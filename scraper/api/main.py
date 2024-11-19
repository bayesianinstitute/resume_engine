from fastapi import FastAPI, HTTPException, Query
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.events import EVENT_JOB_EXECUTED, EVENT_JOB_ERROR
from jobspy import scrape_jobs
import pandas as pd
from typing import List, Dict, Optional
from pydantic import BaseModel, ValidationError
from datetime import datetime
import urllib.parse
import boto3
from botocore.exceptions import NoCredentialsError, PartialCredentialsError
import uuid

import csv
from tempfile import NamedTemporaryFile
import os
import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)

# Validate environment variables
ACCESS_KEY = os.getenv("AWS_ACCESS_KEY_ID")
SECRET_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
REGION = os.getenv("AWS_REGION")
BUCKET_NAME = os.getenv("S3_BUCKET_NAME")

if not all([ACCESS_KEY, SECRET_KEY, REGION, BUCKET_NAME]):
    logging.error("Environment variables must be specified in the environment")
    raise ValueError("AWS environment variables are not set properly.")

 
# S3 Manager
class S3Manager:
    def __init__(self, access_key: str, secret_key: str, region: str, bucket_name: str):
        self.s3_client = boto3.client(
            "s3",
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            region_name=region,
        )
        self.bucket_name = bucket_name
        self.region = region

    def upload_csv(self, dataframe: pd.DataFrame, file_name: str) -> str:
        try:
            with NamedTemporaryFile(delete=False, suffix=".csv") as temp_file:
                dataframe.to_csv(temp_file.name, index=False)
                object_name = f"scrape/{file_name}"
                self.s3_client.upload_file(
                    temp_file.name,
                    self.bucket_name,
                    object_name,
                    ExtraArgs={"ContentType": "text/csv"}
                )
                public_url = f"https://{self.bucket_name}.s3.{self.region}.amazonaws.com/{object_name}"
                logging.info(f"File uploaded to S3: {public_url}")
                return public_url
        except (NoCredentialsError, PartialCredentialsError) as e:
            logging.error(f"S3 credential error: {e}")
            raise HTTPException(status_code=500, detail="S3 credentials error.")
        except Exception as e:
            logging.error(f"Error uploading to S3: {e}")
            raise HTTPException(status_code=500, detail="Failed to upload to S3.")
        finally:
            if os.path.exists(temp_file.name):
                os.remove(temp_file.name)
                logging.info("Temporary file deleted.")


# FastAPI Application
app = FastAPI()

# Scheduler setup
scheduler = BackgroundScheduler()

# S3 Manager instance
s3_manager = S3Manager(
    access_key=ACCESS_KEY,
    secret_key=SECRET_KEY,
    region=REGION,
    bucket_name=BUCKET_NAME,
)


# Job Scraping Function
def scrape_and_upload_jobs(city: str):
    try:
        logging.info(f"Scraping jobs for {city}...")
        job_role="software engineer"
        # Example of scraping jobs for a city
        jobs = scrape_jobs(
            site_name=["indeed"],
            search_term=job_role,
            google_search_term=f"software engineer jobs near {city} 72 hours ago",
            location=city,
            results_wanted=20,
            hours_old=72,
            country="USA",
            linkedin_fetch_description=False
        )

        if jobs.empty:
            logging.info(f"No jobs found for {city}.")
            return

        jobs["date_posted"] = jobs["date_posted"].apply(lambda x: str(x) if not pd.isna(x) else "")
        filtered_jobs = jobs[["title", "location", "job_level", "date_posted", "description", "job_url", "company"]]
        
            # Get current datetime and format it
        current_datetime = datetime.now()
        timestamp = current_datetime.strftime('%Y/%m/%d_%H%M/')
        file_name = f"{city}/{job_role}/jobs_{timestamp}{current_datetime.strftime('%Y%m%d_%H%M%S')}.csv"
        presigned_url = s3_manager.upload_csv(filtered_jobs, file_name)

        logging.info(f"Jobs for {city} uploaded to S3: {presigned_url}")
    except Exception as e:
        logging.error(f"Error scraping and uploading jobs for {city}: {e}")


# Read all City
def read_cities_from_csv(file_path):
    cities = []
    with open(file_path, mode='r', newline='') as file:
        csv_reader = csv.DictReader(file)
        for row in csv_reader:
            # Concatenate city and state
            cities.append(f"{row['City']}, {row['State']}")
    return cities
# Scheduler Job
def scheduled_job():
    # Read cities from CSV file
    cities = read_cities_from_csv('cities.csv')  # Path to your CSV file
    for city in cities:
        scrape_and_upload_jobs(city)

# Start the scheduler on app startup
@app.on_event("startup")
async def startup_event():
    # Schedule the job to run every 24 hours
    scheduler.add_job(scheduled_job, 'interval', hours=24, next_run_time=datetime.now())
    scheduler.start()
    logging.info("Scheduler started.")


# Pydantic Models
class JobResponseModel(BaseModel):
    title: str
    location: str
    job_level: Optional[str] = None
    date_posted: str
    description: Optional[str] = None
    job_url: str
    company: str


class JobSearchResponseModel(BaseModel):
    total_jobs: int
    jobs: List[JobResponseModel]


class S3UploadResponseModel(BaseModel):
    message: str
    success: bool
    url: Optional[str] = None


# Helper Functions
def build_search_query(
    role: str,
    required_skills: Optional[List[str]],
    excluded_terms: Optional[List[str]],
) -> str:
    role_exact = f'"{role.lower()}"'
    skills_query = " OR ".join(required_skills) if required_skills else ""
    exclusions_query = " ".join(f"-{term}" for term in excluded_terms) if excluded_terms else ""
    return f"{role_exact} {skills_query} {exclusions_query}"


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
        logging.error(f"Error fetching jobs: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch jobs.")


@app.get("/jobs-s3/", response_model=S3UploadResponseModel)
async def get_jobs_s3(
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
            return {"message": "No jobs found.", "success": False}

        jobs["date_posted"] = jobs["date_posted"].apply(lambda x: str(x) if not pd.isna(x) else "")
        filtered_jobs = jobs[
            ["title", "location", "job_level", "date_posted", "description", "job_url", "company"]
        ]
        file_name = f"jobs_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        presigned_url = s3_manager.upload_csv(filtered_jobs, file_name)

        return {"message": "File successfully uploaded to S3.", "success": True, "url": presigned_url}

    except Exception as e:
        logging.error(f"Error uploading jobs to S3: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload jobs to S3.")
    
# Shutdown the scheduler on app shutdown
@app.on_event("shutdown")
async def shutdown_event():
    scheduler.shutdown()
    logging.info("Scheduler stopped.")
