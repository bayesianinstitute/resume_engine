from app.db.data import read_cities_from_csv,get_role
from app.config.config import s3_manager,ENTERPRISE_API_KEY,ENTERPRISE_URL,client,DATABASE_NAME,AUTOMATION_COLLECTION
from app.script.scrape import scrape_and_upload_jobs

import requests 
import json
from loguru import logger



# Scheduler Job
def scheduled_job():

    # Read cities from the CSV file
    cities = read_cities_from_csv()
    
    if not cities:
        logger.warning("No cities found to scrape jobs for.")
        return

    DATA_ROLES = get_role()
    
    # For each city and role, scrape jobs
    for city in cities:
        for role in DATA_ROLES:
            scrape_and_upload_jobs(city, role)



def scheduled_matcher_job():
    try:
        # Log the database names
        logger.info(client.list_database_names())

        # Access the database and collection
        db = client[DATABASE_NAME]
        logger.debug(db.list_collection_names())
        automation_collection = db[AUTOMATION_COLLECTION]

        # Fetch all automation data
        automation_data = list(automation_collection.find({}))
        # logger.debug(f"Fetched automation data: {automation_data}")

        if not automation_data:
            logger.info("No automation data found to process.")
            return

        # Process each automation record
        for record in automation_data:
            user_id = record.get("userId")  # Extract userId
            user_email = record.get("email")  # Extract user email if available
            automation_entries = record.get("automationData", [])

            if not user_email:
                logger.error(f"Missing email for userId: {user_id}")
                continue

            if not automation_entries:
                logger.info(f"No automation entries found for userId: {user_id}")
                continue

            # Prepare data for matcher API
            resume_names = []
            job_titles = []

            for entry in automation_entries:
                # Collect resume names
                resume_names.append(entry.get("resumeName"))

                # Collect job titles from nested structure
                job_titles.extend(job.get("title") for job in entry.get("jobTitles", []))

            payload = {
                "userId": str(user_id),  # Convert ObjectId to string
                "email": user_email,  # Include email in the payload
                "resumeNames": list(set(resume_names)),  # Ensure unique resume names
                "jobTitles": list(set(job_titles)),  # Ensure unique job titles
            }

            # Matcher API call
            url = f"{ENTERPRISE_URL}/resume/matcherE"
            headers = {
                "Content-Type": "application/json",
                "API-Key": ENTERPRISE_API_KEY,
            }

            try:
                response = requests.post(url, headers=headers, data=json.dumps(payload))
                if response.status_code == 200:
                    logger.info(f"Matcher job executed successfully for user {user_email}: {response.json()}")
                else:
                    logger.error(f"Matcher job failed for user {user_email} with status: {response.status_code}, {response.text}")
            except Exception as e:
                logger.error(f"Error occurred during matcher job execution for user {user_email}: {str(e)}")

    except Exception as e:
        logger.error(f"Error occurred while processing automation data: {str(e)}")

    finally:
        # Close MongoDB client only once all operations are completed
        client.close()
        logger.info("MongoDB client closed.")
