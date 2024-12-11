from fastapi import FastAPI, HTTPException, Query
from apscheduler.schedulers.background import BackgroundScheduler
import pandas as pd
import urllib.parse
from typing import List,  Optional
from datetime import datetime
import os
from loguru import logger

from jobspy import scrape_jobs
from app.model.job import S3UploadResponseModel,JobSearchResponseModel
from app.utils.utils import generate_file_name,build_search_query,fetch_country_by_city
from app.config.config import s3_manager
from app.db.data import read_cities_from_csv,get_role,upload_to_db

# Set up logging with loguru
log_dir = "logs"
os.makedirs(log_dir, exist_ok=True)  # Create the logs folder if it doesn't exist

# Log rotation to keep the last 7 days of logs
logger.add(
    os.path.join(log_dir, "log_{time:YYYY-MM-DD}.log"),  # Logs will be stored with date as part of filename
    rotation="00:00",  # Rotate at midnight every day
    retention="7 days",  # Keep logs for the last 7 days
    compression="zip",  # Compress the older log files
    level="INFO"  # Log level can be adjusted (INFO, DEBUG, ERROR, etc.)
)


# FastAPI Application
app = FastAPI()

# Scheduler setup
scheduler = BackgroundScheduler()


# Job Scraping Function
def scrape_and_upload_jobs(city: str,job_role="software engineer",results_wanted=20,hours_old=24,country="USA"):
    try:
        logger.info(f"Scraping jobs for {city}...") 

        file_name = generate_file_name(city, job_role)

        # Check if the file already exists in S3
        if s3_manager.file_exists(file_name):
            logger.info(f"File {file_name} already exists in S3, skipping scrape for {city}.")
            return

        # Example of scraping jobs for a city
        jobs = scrape_jobs(
            site_name=["indeed"],
            search_term=job_role,
            google_search_term=f"{job_role} jobs near {city} 72 hours ago",
            location=city,
            results_wanted=results_wanted,
            hours_old=hours_old,
            country=country,
            linkedin_fetch_description=False
        )

        if jobs.empty:
            logger.info(f"No jobs found for {city}.")
            return

        jobs["date_posted"] = jobs["date_posted"].apply(lambda x: str(x) if not pd.isna(x) else "")
        filtered_jobs = jobs[["title", "location", "job_level", "date_posted", "description", "job_url", "company"]]
        
        csv_data = filtered_jobs.to_csv(index=False)

        # Upload to the database
        
        if not upload_to_db(csv_data):
            logger.error("Failed to upload jobs to the database. Exiting process.")

        presigned_url = s3_manager.upload_csv(filtered_jobs, file_name)

        logger.info(f"Jobs for {city} uploaded to S3: {presigned_url}")
    except Exception as e:
        logger.error(f"Error scraping and uploading jobs for {city}: {e}")


# Scheduler Job
def scheduled_job():

    # Read cities from the CSV file
    cities = read_cities_from_csv()
    
    if not cities:
        print("No cities found to scrape jobs for.")
        return

    DATA_ROLES = get_role()
    
    # For each city and role, scrape jobs
    for city in cities:
        for role in DATA_ROLES:
            scrape_and_upload_jobs(city, role)


# Start the scheduler on app startup
@app.on_event("startup")
async def startup_event():
    # Schedule the job to run every 24 hours
    scheduler.add_job(scheduled_job, 'interval', hours=24, next_run_time=datetime.now())

    scheduler.start()
    logger.info("Scheduler started.")



# Endpoints
@app.get("/jobs/", response_model=JobSearchResponseModel)
async def get_jobs(
    role: str = Query("software engineer", description="Job role to search for"),
    location: str = Query("San Francisco, CA", description="Job location"),
    hours: int = Query(72, description="How recent the jobs should be (in hours)"),
    include_description: bool = Query(False, description="Include job descriptions"),
    max_result_wanted: int = Query(20, description="Max number of jobs to fetch"),
    required_skills: Optional[List[str]] = Query(None, description="Skills required for the job"),
    excluded_terms: Optional[List[str]] = Query(None, description="Terms to exclude from results"),
    country: str = Query("USA", description="Country for job search"),
):
    try:
        role_decoded = urllib.parse.unquote(role)
        search_query = build_search_query(role_decoded, required_skills, excluded_terms)

        jobs = scrape_jobs(
            site_name=["indeed"],
            search_term=search_query,
            google_search_term=f"{role} jobs near {location} since {hours} hours ago",
            location=location,
            results_wanted=max_result_wanted,
            hours_old=hours,
            country=country,
            linkedin_fetch_description=include_description,
        )

        if jobs.empty:
            return {"total_jobs": 0, "jobs": []}

        jobs["date_posted"] = jobs["date_posted"].apply(lambda x: str(x) if not pd.isna(x) else "")
        filtered_jobs = jobs[
            ["title", "location", "job_level", "date_posted", "description", "job_url", "company"]
        ]
        response_jobs = filtered_jobs.to_dict(orient="records")

        return {"total_jobs": len(response_jobs), "jobs": response_jobs}

    except Exception as e:
        logger.error(f"Error fetching jobs: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch jobs.")


@app.get("/jobs-s3/", response_model=S3UploadResponseModel)
async def get_jobs_s3(
    roles: List[str] = Query(["software engineer"], description="Job roles to search for"),
    location: str = Query("San Francisco, CA", description="Job location"),
    last_hours: int = Query(24, description="How recent the jobs should be (in hours)"),
    include_description: bool = Query(True, description="Include job descriptions"),
    max_result_wanted: int = Query(20, description="Max number of jobs to fetch"),
    required_skills: Optional[List[str]] = Query(None, description="Skills required for the job"),
    excluded_terms: Optional[List[str]] = Query(None, description="Terms to exclude from results"),
    site_name: Optional[List[str]]=Query(["indeed"],description="Site name to search for jobs"),
):
    # Validate hours to be within the allowed range (24 hours max)
    if last_hours > 24:
        raise HTTPException(status_code=400, detail="Hours cannot exceed 24 hours.")
    
    # country = await fetch_country_by_city(location)
    # return {"message": "No jobs found for the given roles.", "success": False}
    
    
    try:
        all_jobs = []  # Store all jobs fetched across roles
        
        logger.debug(f"Role {roles}")


        # Loop through each role and fetch jobs
        for role in roles:
            role_decoded = urllib.parse.unquote(role)
            search_query = build_search_query(role_decoded, required_skills, excluded_terms)

            jobs = scrape_jobs(
                site_name=site_name,
                search_term=search_query,
                google_search_term=f"{role} jobs near {location} since {last_hours} hours ago",
                location=location,
                results_wanted=max_result_wanted,
                hours_old=last_hours,
                country="usa",
                linkedin_fetch_description=include_description,
            )

            if jobs.empty:
                continue  # Skip to the next role if no jobs are found for this role

            jobs["date_posted"] = jobs["date_posted"].apply(lambda x: str(x) if not pd.isna(x) else "")
            filtered_jobs = jobs[
                ["title", "location", "job_level", "date_posted", "description", "job_url", "company"]
            ]

            # Add the fetched jobs to the all_jobs list
            all_jobs.append(filtered_jobs)

        if not all_jobs:
            return {"message": "No jobs found for the given roles.", "success": False}

        # Concatenate all the job data into a single DataFrame
        final_jobs = pd.concat(all_jobs, ignore_index=True)

        file_name = f"all_other/jobs_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        presigned_url = s3_manager.upload_csv(final_jobs, file_name)

        return {"message": "File successfully uploaded to S3.", "success": True, "url": presigned_url}

    except Exception as e:
        logger.error(f"Error uploading jobs to S3: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload jobs to S3.")
    
    
# Shutdown the scheduler on app shutdown
@app.on_event("shutdown")
async def shutdown_event():
    scheduler.shutdown()
    logger.info("Scheduler stopped.")
