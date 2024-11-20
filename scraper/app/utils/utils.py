from datetime import datetime
from typing import List, Dict, Optional



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
