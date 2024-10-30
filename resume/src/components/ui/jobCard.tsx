import React from "react";
import { Card, CardContent } from "./card";
import { format } from "date-fns"; // make sure date-fns is installed
import ReactMarkdown from "react-markdown";
import { Clock, Link, MapPin } from "lucide-react";
import { useRouter } from "next/router";
import { setJobDescription } from "../../lib/store/features/job/jobSlice";
import { useAppDispatch, useAppSelector } from "../../lib/store/hooks";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/lib/store/store";

interface Job {
  title: string;
  description: string;
  datePosted: Date;
  url: string;
  location: string; // Add this if it's used
}

interface JobCardProps {
  job: Job;
  index: number; // Make sure to declare index if it's being passed
  jobs: Job[]; // Assuming you need the jobs array for referencing
  lastJobElementRef: React.RefObject<HTMLDivElement>; // Type for the ref
}

const JobCard = ({ job, index, jobs, lastJobElementRef }: JobCardProps) => {
  // const router = useRouter();
  const dispatch = useAppDispatch<AppDispatch>();
  const { jobDescription, prepResources, loading } = useSelector((state:RootState) => state.jobDescription);



  const handleInterviewPrepClick = () => {
    dispatch(setJobDescription(job.description)); // Dispatch job description
    console.log(jobDescription)
    toast(`Job ${jobDescription}`);
    // router.push("/interview-preparation");
  };

  return (
    <Card
      className="group hover:shadow-xl transition-shadow duration-200 border-0"
      ref={jobs.length === index + 1 ? lastJobElementRef : null}
    >
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-800 group-hover:text-blue-600 transition-colors duration-200">
                {job.title}
              </h3>
              <div className="flex items-center space-x-4 mt-2">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">{job.location}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">
                    {format(new Date(job.datePosted), "MMM dd, yyyy")}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="text-gray-600 line-clamp-2">
            <ReactMarkdown>{job.description}</ReactMarkdown>
          </div>
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors duration-200 mr-3"
          >
            <Link className="w-4 h-4 mr-2" />
            View Details
          </a>
          <button onClick={handleInterviewPrepClick}>Interview Prep </button>
          {/* <button onClick={handleInterviewPrepClick}> Resume Match</button> */}
        </div>
      </CardContent>
    </Card>
  );
};

export default JobCard;
