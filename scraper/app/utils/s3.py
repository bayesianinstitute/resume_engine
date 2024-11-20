
import boto3
from botocore.exceptions import NoCredentialsError, PartialCredentialsError
from tempfile import NamedTemporaryFile
import pandas as pd
from loguru import logger
from fastapi import  HTTPException
import os

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

    def file_exists(self, file_name: str) -> bool:
        try:
            self.s3_client.head_object(Bucket=self.bucket_name, Key=file_name)
            return True  # File exists
        except self.s3_client.exceptions.ClientError:
            return False  # File does not exist
        
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
                logger.info(f"File uploaded to S3: {public_url}")
                return public_url
        except (NoCredentialsError, PartialCredentialsError) as e:
            logger.error(f"S3 credential error: {e}")
            raise HTTPException(status_code=500, detail="S3 credentials error.")
        except Exception as e:
            logger.error(f"Error uploading to S3: {e}")
            raise HTTPException(status_code=500, detail="Failed to upload to S3.")
        finally:
            if os.path.exists(temp_file.name):
                os.remove(temp_file.name)
                logger.info("Temporary file deleted.")
