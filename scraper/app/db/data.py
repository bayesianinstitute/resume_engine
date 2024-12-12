import os
import csv
from loguru import logger
import pandas as pd
from io import StringIO
import requests
from app.config.config import ENTERPRISE_API_KEY,ENTERPRISE_URL

def read_cities_from_csv(file_path="app/db/cities.csv"):
    
    cities = []
    logger.debug(f"Curr path {os.getcwd()}")
    try:
        # Ensure the db directory and the cities.csv file exist
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"CSV file {file_path} not found.")
        
        with open(file_path, mode='r', newline='') as file:
            csv_reader = csv.DictReader(file)
            for row in csv_reader:
                # Concatenate city and state
                cities.append(f"{row['City']}, {row['State']}")
        
        # cities=["Los Angeles"]
        return cities
    
    except FileNotFoundError as e:
        print(f"Error: {e}")
        return []
    except Exception as e:
        print(f"An error occurred: {e}")
        return []


def get_role()->list[str]:
    return [
        "data scientist",
        "data analyst",
        "machine learning engineer",
        "data engineer",
        "AI researcher"
    ]
    



def upload_to_db(csv_data: str) -> bool:
    """Upload the CSV data to the database using the specified API."""
    try:
        upload_url = f"{ENTERPRISE_URL}/job/upload-csv"
        headers = {"API-Key": ENTERPRISE_API_KEY}
        files = {'jobsFile': ('jobs.csv', StringIO(csv_data), 'text/csv')}

        # Make the API request to upload the jobs CSV
        response = requests.post(upload_url, headers=headers, files=files)

        if response.status_code == 200:
            logger.info("Jobs successfully uploaded to the database.")
            return True
        else:
            logger.error(f"Failed to upload jobs to the database: {response.text}")
            return False
    except Exception as e:
        logger.error(f"Error uploading jobs to the database: {e}")
        return False
