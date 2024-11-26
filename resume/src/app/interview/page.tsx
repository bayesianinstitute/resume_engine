"use client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import JobDescriptionForm from "@/components/ui/JobDescriptionForm";
import { JobOpportunities } from "@/components/ui/JobOpportunities";
import Sidebar from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  setJobDescription,
  setLoading,
  setPrepResources,
} from "@/lib/store/features/job/jobSlice";
import { AppDispatch, RootState } from "@/lib/store/store";
import {
  InterviewQuestion,
  preparationAPIResponse,
  PrepResource,
} from "@/types/interview";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle, Download, List, MessageSquare } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  downloadPrepResourcePDF,
  // downloadPrepResourcesDocx,
  parsePreparationResources,
} from "@/lib/fileparse";
import { fetchJobs, setIsSearch } from "@/lib/store/features/job/jobSearch";
import { toast } from "react-toastify";
import Expander from "@/components/ui/expander";

export default function InterviewPreparation() {
  const dispatch = useDispatch<AppDispatch>();
  const { jobDescription, prepResources, loading } = useSelector(
    (state: RootState) => state.jobDescription
  );
  const { jobs, totalJobs, isSearch } = useSelector(
    (state: RootState) => state.jobs
  );
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const cardRef = useRef<HTMLDivElement | null>(null);

  const loadMoreJobs = useCallback(() => {
    if (!loading && jobs.length < totalJobs) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      dispatch(fetchJobs({ page: nextPage, limit: 10 }));
    }
  }, [currentPage, loading, jobs.length, totalJobs, dispatch]);

  const handleJobSelect = (jobId: string) => {
    const selectedJob = jobs.find((job) => job._id === jobId);
    if (selectedJob) {
      dispatch(setJobDescription(selectedJob.description));
      setSelectedJob(jobId);
    } else {
      dispatch(setJobDescription(""));
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!jobDescription) {
      alert("Please enter a job description.");
      return;
    }

    try {
      dispatch(setLoading(true));

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/resume/preparation`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ jobDescription }),
        }
      );
      const responseData: preparationAPIResponse = await response.json();
      if (responseData.success) {
        const parsedData: InterviewQuestion = JSON.parse(responseData.data);
        const prepResources = parsePreparationResources(parsedData);

        dispatch(setPrepResources(prepResources));
        toast.success(responseData.message);
        if (cardRef.current) {
          // Scroll to card if it exists
          cardRef.current.scrollIntoView({ behavior: "smooth" });
        }
      } else {
        toast.error(responseData.message);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.warning(
        "An error occurred while generating interview preparation resources."
      );
    } finally {
      dispatch(setLoading(false));
    }
  };

  useEffect(() => {
    // Fetch jobs if not already in store
    if (!jobs.length || isSearch) {
      dispatch(fetchJobs({ page: 1, limit: 10 }));
      dispatch(setIsSearch(false));
    }
  }, [dispatch, jobs.length, isSearch]);

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 ml-64 p-8">
        <h1 className="text-4xl font-extrabold text-gray-800 dark:text-gray-100 text-center mb-8">
          Interview Preparation
        </h1>
        <p className="text-lg text-center text-gray-600 dark:text-gray-300 mb-8">
          Get tailored interview preparation resources based on the job
          description
        </p>
        <div className="max-w-6xl mx-auto space-y-8">
          <Expander title="View Job Opportunities">
            <JobOpportunities
              jobs={jobs}
              selectedJob={selectedJob}
              handleJobSelect={handleJobSelect}
              totalJobs={totalJobs}
              loading={loading}
              onLoadMore={loadMoreJobs}
            />
          </Expander>

          <JobDescriptionForm
            jobDescription={jobDescription}
            handleSubmit={handleSubmit}
            loading={loading}
          />
          <AnimatePresence>
            {prepResources.length > 0 && (
              <>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="shadow-lg">
                    <CardHeader className="flex justify-between items-center">
                      <div>
                        <CardTitle>Interview Preparation Resources</CardTitle>
                        <CardDescription>
                          Review your personalized preparation materials
                        </CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Tabs defaultValue="topics" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                          <TabsTrigger value="topics">Key Skills</TabsTrigger>
                          <TabsTrigger value="questions">
                            Interview Questions
                          </TabsTrigger>
                          <TabsTrigger value="tips">
                            Preparation Tips
                          </TabsTrigger>
                        </TabsList>
                        <TabsContent value="topics">
                          <ResourceList
                            resources={prepResources.filter(
                              (r) => r.type === "topic"
                            )}
                            icon={List}
                          />
                        </TabsContent>
                        <TabsContent value="questions">
                          <ResourceList
                            resources={prepResources.filter(
                              (r) => r.type === "question"
                            )}
                            icon={MessageSquare}
                          />
                        </TabsContent>
                        <TabsContent value="tips">
                          <ResourceList
                            resources={prepResources.filter(
                              (r) => r.type === "tip"
                            )}
                            icon={CheckCircle}
                          />
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>
                </motion.div>
                <Button
                  onClick={() => downloadPrepResourcePDF(prepResources)}
                  variant="outline"
                  className=" mr-5"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF File
                </Button>
                {/* <Button
                  onClick={() => downloadPrepResourcesDocx(prepResources)}
                  variant="outline"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download DOCX File
                </Button> */}
              </>
            )}
          </AnimatePresence>
          {/* Download button */}
        </div>
      </div>
    </div>
  );
}

function ResourceList({
  resources,
  icon: Icon,
}: {
  resources: PrepResource[];
  icon: React.ElementType;
}) {
  return (
    <div className="space-y-4 mt-4">
      {resources.map((resource, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="border-b border-gray-200 pb-4 last:border-b-0"
        >
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2 flex items-center">
            <Icon className="w-5 h-5 mr-2 text-blue-500" />
            {resource.title}
          </h3>
          <div className="text-gray-600 dark:text-gray-300 space-y-2">
            {resource.content.split("\n").map((item, i) => (
              <p key={i}>{item.trim()}</p>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
