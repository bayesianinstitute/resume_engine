from fastapi import FastAPI
from jobspy import scrape_jobs
import pandas as pd
from typing import List, Dict, Optional
from pydantic import BaseModel, ValidationError
from datetime import datetime
import urllib.parse
import boto3
from botocore.exceptions import NoCredentialsError, PartialCredentialsError
import uuid
from io import StringIO
from dotenv import load_dotenv
load_dotenv() 

import os

class S3Manager:
    def __init__(self, access_key: str, secret_key: str, region: str, bucket_name: str):
        self.s3_client = boto3.client(
            "s3",
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            region_name=region,
        )
        self.bucket_name = bucket_name
        # self.region=REGION
        self.regionBUCKET_NAME
    def upload_csv(self, dataframe, file_name: str) -> str:
        try:
            # Generate a unique file name if not provided
            if not file_name:
                file_name = f"{uuid.uuid4()}.csv"

            # Save DataFrame to a temporary CSV file
            temp_file = f"/tmp/{file_name}"
            dataframe.to_csv(temp_file, index=False)

            # Upload to S3 with public-read ACL
            self.s3_client.upload_file(
                temp_file,
                self.bucket_name,
                f"scrape/{file_name}",
            )

            # Construct the public URL
            public_url = f"https://{self.bucket_name}.s3.{self.region}.amazonaws.com/scrape/{file_name}"
            return public_url

        except (NoCredentialsError, PartialCredentialsError) as e:
            print(f"S3 credential error: {e}")
            raise
        except Exception as e:
            print(f"An error occurred while uploading to S3: {e}")
            raise


ACCESS_KEY =os.getenv("AWS_ACCESS_KEY_ID")

SECRET_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")

REGION =  os.getenv("AWS_REGION") 

BUCKET_NAME = os.getenv("AWS_BUCKET_NAME")

# S3 Manager instance
s3_manager = S3Manager(
    access_key=ACCESS_KEY,
    secret_key=SECRET_KEY,
    region=REGION,
    bucket_name=BUCKET_NAME,
)

app = FastAPI()

class JobResponseModel(BaseModel):
    title: str
    location: str
    job_level: Optional[str] = None
    date_posted: str
    description: Optional[str] = None
    job_url: str
    company: str

class JobSearchResponseModel(BaseModel):
    total_jobs: int  # New field for total jobs scraped
    jobs: List[JobResponseModel]  # List of job response models

@app.get("/jobs/", response_model=JobSearchResponseModel)
async def get_jobs(
    role: Optional[str] = "software engineer",
    location: Optional[str] = "San Francisco, CA",
    hours: Optional[int] = 72,
    include_description: Optional[bool] = False,
    max_result_wanted: Optional[int] = 20,
    required_skills: Optional[List[str]] = None,
    excluded_terms: Optional[List[str]] = None,
    country:Optional[str]="USA"
):
    role_decoded = urllib.parse.unquote(role)
    print(role_decoded)
    print(role,location,hours,include_description,country)
    try:
        # Construct Indeed search term with structured query
        role_exact = f'"{role_decoded.lower()}"'  # Exact match for the role
        skills_query = " OR ".join(required_skills) if required_skills else ""
        exclusions_query = " ".join(f"-{term}" for term in excluded_terms) if excluded_terms else ""
        
        # Build the structured query string
        indeed_search_term = f'{role_exact} {skills_query} {exclusions_query}'

        # Print the query for debugging
        print(f"Indeed search term: {indeed_search_term}")

        # Site list for scraping
        site_name = ["indeed", "linkedin", "zip_recruiter", "glassdoor", "google"]
        
        # Scrape jobs using constructed Indeed search term
        jobs = scrape_jobs(
            site_name=["indeed"],
            search_term=indeed_search_term,
            google_search_term=f"{role} jobs near {location} since {hours} hours ago",
            location=location,
            results_wanted=max_result_wanted,
            hours_old=hours,
            country=country,
            linkedin_fetch_description=include_description,
            
            
        )

        # Debug output
        print(f"Found {len(jobs)} jobs")

        if len(jobs) == 0:
            return {
                "total_jobs": 0,
                "jobs": []
            }

        # Process date and filter columns
        jobs['date_posted'] = jobs['date_posted'].apply(lambda x: str(x) if not pd.isna(x) else "")
        filtered_jobs = jobs[['title', 'location', 'job_level', 'date_posted', 'description', 'job_url', 'company']]
        response_jobs = filtered_jobs.to_dict(orient='records')

        return {
            "total_jobs": len(response_jobs),
            "jobs": response_jobs
        }

    except ValidationError as e:
        print(f"Validation Error: {e}")
        return {"error": "Data validation failed.  See logs for details."}, 500  # Return 500 error
    except Exception as e:  # Catch other potential errors
        print(f"An unexpected error occurred: {e}")
        return {"error": "An unexpected error occurred.  See logs for details."}, 500
    
    
@app.get("/jobss3/", response_model=Dict[str, str])
async def get_jobs(
    role: Optional[str] = "software engineer",
    location: Optional[str] = "San Francisco, CA",
    hours: Optional[int] = 72,
    include_description: Optional[bool] = False,
    max_result_wanted: Optional[int] = 20,
    required_skills: Optional[List[str]] = None,
    excluded_terms: Optional[List[str]] = None,
    country: Optional[str] = "USA"
):
    role_decoded = urllib.parse.unquote(role)
    print(role_decoded)

    try:
        role_exact = f'"{role_decoded.lower()}"'
        skills_query = " OR ".join(required_skills) if required_skills else ""
        exclusions_query = " ".join(f"-{term}" for term in excluded_terms) if excluded_terms else ""
        indeed_search_term = f'{role_exact} {skills_query} {exclusions_query}'

        jobs = scrape_jobs(
            site_name=["indeed"],
            search_term=indeed_search_term,
            google_search_term=f"{role} jobs near {location} since {hours} hours ago",
            location=location,
            results_wanted=max_result_wanted,
            hours_old=hours,
            country=country,
            linkedin_fetch_description=include_description,
        )

        if len(jobs) == 0:
            return {"message": "No jobs found."}

        # Process DataFrame
        jobs['date_posted'] = jobs['date_posted'].apply(lambda x: str(x) if not pd.isna(x) else "")
        filtered_jobs = jobs[['title', 'location', 'job_level', 'date_posted', 'description', 'job_url', 'company']]

        # Save as CSV to S3
        file_name = f"jobs_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        presigned_url = s3_manager.upload_csv(filtered_jobs, file_name)

        return {
            "message": "File successfully uploaded to S3",
            "success": True,
            "url": presigned_url
        }

    except ValidationError as e:
        print(f"Validation Error: {e}")
        return {"error": "Data validation failed. See logs for details."}, 500
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        return {"error": "An unexpected error occurred. See logs for details."}, 500

