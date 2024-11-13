import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Job } from "@/types/job";
import { Label } from "@radix-ui/react-label";
import { Briefcase, Link } from "lucide-react";
import { useRef, useState } from "react";
import useInfiniteScroll from "react-infinite-scroll-hook";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface JobOpportunitiesProps {
  jobs: Job[];
  selectedJob: string | null;
  totalJobs: number;
  handleJobSelect: (jobId: string) => void;
  loading: boolean;
  onLoadMore: () => void;
}

export const JobOpportunities = ({
  jobs,
  selectedJob,
  handleJobSelect,
  totalJobs,
  loading,
  onLoadMore,
}: JobOpportunitiesProps) => {
  const hasNextPage = jobs.length < totalJobs;
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Use the infinite scroll hook with the custom scroll area
  const [sentryRef] = useInfiniteScroll({
    loading,
    hasNextPage,
    onLoadMore,
    rootMargin: "0px 0px 400px 0px",
  });

  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleViewDetailsClick = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Job Opportunities</CardTitle>
        <CardDescription>
          <span className="text-lg font-semibold">Total Jobs: {totalJobs}</span>
          <br />
          <span className="text-sm">
            Select a job or enter a custom description to get started.
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea
          className="h-[200px] w-full rounded-md border p-4"
          ref={scrollAreaRef}
        >
          <div className="space-y-4">
            {jobs.map((job) => (
              <div key={job._id} className="flex items-center space-x-2">
                <Checkbox
                  id={job._id}
                  checked={selectedJob === job._id}
                  onCheckedChange={() => handleJobSelect(job._id)}
                />
                <Label
                  htmlFor={job._id}
                  className="flex-1 text-sm leading-none flex items-center cursor-pointer"
                >
                  <Briefcase className="h-4 w-4 mr-2" />
                  <span className="font-medium">{job.title}</span>
                  <span className="mx-2 text-gray-400">|</span>
                  <span className="text-gray-600">{job.company || "N/A"}</span>
                  <span className="mx-2 text-gray-400">|</span>
                  <span className="text-gray-500 text-xs">
                    {new Date(job.datePosted).toLocaleDateString()}
                  </span>
                  {job.url ? (
                    <a
                      href={job.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-auto inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors duration-200"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Link className="w-4 h-4 mr-1" />
                      View Details
                    </a>
                  ) : (
                    <button
                      onClick={handleViewDetailsClick}
                      className="ml-auto inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors duration-200"
                    >
                      <Link className="w-4 h-4 mr-2" />
                      View Details
                    </button>
                  )}
                </Label>
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
                      <button
                        onClick={handleCloseModal}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Close
                      </button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            ))}
          </div>
          {(loading || hasNextPage) && (
            <div ref={sentryRef} className="text-center p-4">
              {loading && "Loading more jobs..."}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
