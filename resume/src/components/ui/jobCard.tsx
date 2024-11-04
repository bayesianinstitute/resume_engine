import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import { Clock, Link, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { setJobDescription } from "../../lib/store/features/job/jobSlice";
import { useAppDispatch } from "../../lib/store/hooks";
import { Card, CardContent } from "./card";
import { Job } from "@/types/job";



interface JobCardProps {
  job: Job;
  index: number;
}


const JobCard = ({ job }: JobCardProps) => {
  const dispatch = useAppDispatch();
  const router=useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleInterviewPrepClick = () => {
    dispatch(setJobDescription(job.description));
    router.push("/interview");
  };

  const handleViewDetailsClick = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <Card className="group hover:shadow-xl transition-shadow duration-200 border-0">
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

          {job.url ? (
            <a
              href={job.url}
              target="_blank"
              rel="noopener noreferrer"
              className="ViewDetails inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors duration-200"
            >
              <Link className="w-4 h-4 mr-2" />
              View Details
            </a>
          ) : (
            <button
              onClick={handleViewDetailsClick}
              className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors duration-200"
            >
              <Link className="w-4 h-4 mr-2" />
              View Details
            </button>
          )}

          <button
            onClick={handleInterviewPrepClick}
            className="Interview inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors duration-200"
          >
            <Clock className=" w-4 h-4 ml-2" />  Interview Prep
          </button>

          <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
            <DialogContent className="max-w-lg mx-auto p-4 sm:p-6 md:p-8 max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Job Details</DialogTitle>
              </DialogHeader>
              <DialogDescription>
                <div className="mt-4">
                  <span>{job.description}</span>
                </div>
              </DialogDescription>
              <DialogFooter>
                <button onClick={handleCloseModal} className="text-blue-600 hover:text-blue-800">
                  Close
                </button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
};

export default JobCard;
