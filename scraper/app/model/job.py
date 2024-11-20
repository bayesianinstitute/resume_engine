from typing import List, Dict, Optional
from pydantic import BaseModel, ValidationError

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
