from datetime import datetime
from typing import List, Dict, Optional
import httpx
from loguru import logger
from app.config.config import PUBLIC_GEOAPIFY_API_KEY


def generate_file_name(location, job_role):
    current_date = datetime.now()
    year = current_date.year
    month = current_date.month
    
    # Creating the file name
    file_name = f"{location}/{job_role}/{current_date.strftime('%Y-%m-%d')}/{current_date.strftime('%Y-%m-%d')}.csv"
    return file_name



# Helper Functions
def build_search_query(
    role: str,
    required_skills: Optional[List[str]],
    excluded_terms: Optional[List[str]],
) -> str:
    role_exact = f'"{role.lower()}"'
    skills_query = " OR ".join(required_skills) if required_skills else ""
    exclusions_query = " ".join(f"-{term}" for term in excluded_terms) if excluded_terms else ""
    return f"{role_exact} {skills_query} {exclusions_query}"



# Search Country based on los location : # Helper function to fetch country by city using Geoapify API
async def fetch_country_by_city(city: str)->str:

    url = f"https://api.geoapify.com/v1/geocode/search?text={city}&apiKey={PUBLIC_GEOAPIFY_API_KEY}"

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url)
            data = response.json()

            if data.get("features"):
                country = data["features"][0]["properties"].get("country", "USA")
                
                logger.debug(f"Country: {country}")
                return country
            else:
                return "usa"
        except Exception as e:
            print(f"Error fetching country: {e}")
            return "usa"

async def country(location: str):
    s=await fetch_country_by_city(location)
    print(s)

# await country("Los Angeles")
