from fastapi import FastAPI
from jobspy import scrape_jobs
import pandas as pd
from typing import List, Dict, Optional
from pydantic import BaseModel, ValidationError
from datetime import datetime

app = FastAPI()

class JobResponseModel(BaseModel):
    title: str
    location: str
    job_level: Optional[str] = None
    date_posted: str  # Must be a string
    description: Optional[str] = None
    job_url: str
    company: str

class JobSearchResponseModel(BaseModel):
    total_jobs: int  # New field for total jobs scraped
    jobs: List[JobResponseModel]  # List of job response models
    
class JobSearchParams(BaseModel):
    role: Optional[str] = "software engineer"  # Default value
    location: Optional[str] = "San Francisco, CA"  # Default value
    hours: Optional[int] = 72  # Default value
    include_description: Optional[bool] = True  # Default value

@app.get("/jobs/", response_model=JobSearchResponseModel)
async def get_jobs(
    role: Optional[str] = "software engineer",
    location: Optional[str] = "San Francisco, CA",
    hours: Optional[int] = 72,
    include_description: Optional[bool] = False
):
    print(role,location,hours,include_description)
    try:
        site_name=["indeed", "linkedin", "zip_recruiter", "glassdoor", "google"]
        jobs = scrape_jobs(
            site_name=["indeed","google"],  
            search_term=role,
            google_search_term=f"{role} jobs near {location} since {hours} ago",  # Assuming this format is needed
            location=location,
            results_wanted=20,
            hours_old=hours,
            country_indeed='USA',
            linkedin_fetch_description=include_description,

        )

        print(f"Found {len(jobs)} jobs")
        if len(jobs) == 0:
            return {
                "total_jobs": 0,
                "jobs": []
            }

        # Convert date_posted to string *before* filtering columns.  Handle NaNs and other types
        jobs['date_posted'] = jobs['date_posted'].apply(lambda x: str(x) if not pd.isna(x) else "")  # Or a default string like "N/A"

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