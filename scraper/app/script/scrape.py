from app.db.data import upload_to_db
from app.utils.utils import generate_file_name
from app.config.config import s3_manager
from jobspy import scrape_jobs

import pandas as pd
from loguru import logger

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

