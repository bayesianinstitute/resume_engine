#!/bin/bash

curl -X POST http://127.0.0.1:5000/api/v1/job/add \
-H "Content-Type: application/json" \
-d '{
  "title": "Machine Learning Engineer",
  "location": "San Francisco, CA",
  "experienceLevel": "Senior Level",
  "datePosted": "2024-10-29T00:00:00Z",
  "description": "Develop and implement machine learning models.",
  "url": "http://example.com/job1"
}'

curl -X POST http://127.0.0.1:5000/api/v1/job/add \
-H "Content-Type: application/json" \
-d '{
  "title": "Data Scientist",
  "location": "Austin, TX",
  "experienceLevel": "Entry Level",
  "datePosted": "2024-10-29T00:00:00Z",
  "description": "Analyze data and create data-driven solutions.",
  "url": "http://example.com/job2"
}'

curl -X POST http://127.0.0.1:5000/api/v1/job/add \
-H "Content-Type: application/json" \
-d '{
  "title": "AI Research Scientist",
  "location": "Boston, MA",
  "experienceLevel": "Mid Level",
  "datePosted": "2024-10-29T00:00:00Z",
  "description": "Conduct research in artificial intelligence.",
  "url": "http://example.com/job3"
}'

curl -X POST http://127.0.0.1:5000/api/v1/job/add \
-H "Content-Type: application/json" \
-d '{
  "title": "Data Analyst",
  "location": "Seattle, WA",
  "experienceLevel": "Internship",
  "datePosted": "2024-10-29T00:00:00Z",
  "description": "Gather and analyze data for decision-making.",
  "url": "http://example.com/job4"
}'

curl -X POST http://127.0.0.1:5000/api/v1/job/add \
-H "Content-Type: application/json" \
-d '{
  "title": "Computer Vision Engineer",
  "location": "Chicago, IL",
  "experienceLevel": "Mid Level",
  "datePosted": "2024-10-29T00:00:00Z",
  "description": "Develop algorithms for image and video processing.",
  "url": "http://example.com/job5"
}'

curl -X POST http://127.0.0.1:5000/api/v1/job/add \
-H "Content-Type: application/json" \
-d '{
  "title": "Natural Language Processing Engineer",
  "location": "Los Angeles, CA",
  "experienceLevel": "Senior Level",
  "datePosted": "2024-10-29T00:00:00Z",
  "description": "Build applications using NLP techniques.",
  "url": "http://example.com/job6"
}'

curl -X POST http://127.0.0.1:5000/api/v1/job/add \
-H "Content-Type: application/json" \
-d '{
  "title": "Business Intelligence Developer",
  "location": "Miami, FL",
  "experienceLevel": "Mid Level",
  "datePosted": "2024-10-29T00:00:00Z",
  "description": "Create dashboards and reports for data visualization.",
  "url": "http://example.com/job7"
}'

curl -X POST http://127.0.0.1:5000/api/v1/job/add \
-H "Content-Type: application/json" \
-d '{
  "title": "Data Engineer",
  "location": "Denver, CO",
  "experienceLevel": "Entry Level",
  "datePosted": "2024-10-29T00:00:00Z",
  "description": "Design and implement data pipelines.",
  "url": "http://example.com/job8"
}'

curl -X POST http://127.0.0.1:5000/api/v1/job/add \
-H "Content-Type: application/json" \
-d '{
  "title": "Deep Learning Specialist",
  "location": "Toronto, ON",
  "experienceLevel": "Senior Level",
  "datePosted": "2024-10-29T00:00:00Z",
  "description": "Develop deep learning models for various applications.",
  "url": "http://example.com/job9"
}'

curl -X POST http://127.0.0.1:5000/api/v1/job/add \
-H "Content-Type: application/json" \
-d '{
  "title": "AI Product Manager",
  "location": "New York, NY",
  "experienceLevel": "Executive",
  "datePosted": "2024-10-29T00:00:00Z",
  "description": "Manage product development for AI solutions.",
  "url": "http://example.com/job10"
}'
