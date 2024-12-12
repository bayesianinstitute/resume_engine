from app.utils.s3 import S3Manager
import os
from loguru import logger
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

# Validate environment variables
ACCESS_KEY = os.getenv("AWS_ACCESS_KEY_ID")
SECRET_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
REGION = os.getenv("AWS_REGION")
BUCKET_NAME = os.getenv("S3_BUCKET_NAME") 
PUBLIC_GEOAPIFY_API_KEY = os.getenv("PUBLIC_GEOAPIFY_API_KEY")


ENTERPRISE_URL = os.getenv("ENTERPRISE_URL")
ENTERPRISE_API_KEY = os.getenv("ENTERPRISE_API_KEY")


MONGO_URI = os.getenv("MONGODB_URL")
DATABASE_NAME = "Resume"
AUTOMATION_COLLECTION = "automations"


if not all([ACCESS_KEY, SECRET_KEY, REGION, BUCKET_NAME,PUBLIC_GEOAPIFY_API_KEY,ENTERPRISE_URL,ENTERPRISE_API_KEY,MONGO_URI]):
    missing_keys = [key for key, value in locals().items() if value is None]
    logger.error(f"Environment variables must be specified in the environment. Missing keys: {missing_keys}")
    raise ValueError(f"Environment variables must be specified in the environment. Missing keys: {missing_keys}")




# S3 Manager instance
s3_manager = S3Manager(
    access_key=ACCESS_KEY,
    secret_key=SECRET_KEY,
    region=REGION,
    bucket_name=BUCKET_NAME,
)

# Connect to MongoDB
client = MongoClient(MONGO_URI)
