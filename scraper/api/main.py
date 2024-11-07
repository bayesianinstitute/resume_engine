from fastapi import FastAPI
from jobspy import scrape_jobs
import pandas as pd
from typing import List, Dict, Optional
from pydantic import BaseModel, ValidationError
from datetime import datetime
import urllib.parse

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