from app.utils.s3 import S3Manager
import os
from loguru import logger
from dotenv import load_dotenv

load_dotenv()

# Validate environment variables
ACCESS_KEY = os.getenv("AWS_ACCESS_KEY_ID")
SECRET_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
REGION = os.getenv("AWS_REGION")
BUCKET_NAME = os.getenv("S3_BUCKET_NAME") 
PUBLIC_GEOAPIFY_API_KEY = os.getenv("PUBLIC_GEOAPIFY_API_KEY")


if not all([ACCESS_KEY, SECRET_KEY, REGION, BUCKET_NAME,PUBLIC_GEOAPIFY_API_KEY]):
    logger.error("Environment variables must be specified in the environment")
    raise ValueError("AWS environment variables are not set properly.")




# S3 Manager instance
s3_manager = S3Manager(
    access_key=ACCESS_KEY,
    secret_key=SECRET_KEY,
    region=REGION,
    bucket_name=BUCKET_NAME,
)