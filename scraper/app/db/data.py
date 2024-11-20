import os
import csv
from loguru import logger
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