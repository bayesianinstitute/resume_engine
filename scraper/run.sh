git pull

sudo docker build --no-cache -t resume-scraper .


sudo docker run -d --env-file .env -p 8000:8000  resume-scraper 
