https://github.com/Bunsly/JobSpy

run docker : 
docker build --no-cache -t resume-scraper .


docker run -d -p 8000:8000 resume-scraper .
