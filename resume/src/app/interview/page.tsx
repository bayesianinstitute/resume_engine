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
import { RootState } from "@/lib/store/store";
import { PrepResource } from "@/types/interview";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle, Download, List, MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { saveAs } from "file-saver"; // Install this library with: npm install file-saver

function downloadPrepResources() {
  const fileContent = JSON.stringify(prepResources, null, 2);
  const blob = new Blob([fileContent], { type: "application/json" });
  saveAs(blob, "interview_preparation_resources.json");
}

export default function InterviewPreparation() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { jobDescription, prepResources, loading } = useSelector(
    (state: RootState) => state.jobDescription
  );
  const jobs = useSelector((state: RootState) => state.jobs.jobs);
  const [selectedJob, setSelectedJob] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login");
    }
  }, [router]);

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

      if (!response.ok) {
        throw new Error("Failed to generate interview preparation resources.");
      }

      const data = await response.json();
      const prepResources: PrepResource[] = parsePreparationResources(
        data.preparationResources
      );

      dispatch(setPrepResources(prepResources));
    } catch (error) {
      console.error("Error:", error);
      alert(
        "An error occurred while generating interview preparation resources."
      );
    } finally {
      dispatch(setLoading(false));
    }
  };

  function parsePreparationResources(text: string): PrepResource[] {
    const lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line);
    const resources: PrepResource[] = [];

    let currentType: "topic" | "question" | "tip" | null = null;
    let buffer: string[] = [];
    let currentTitle: string = "";

    lines.forEach((line) => {
      if (line.startsWith("**Key Skills:**")) {
        if (buffer.length && currentType) {
          resources.push({
            title: currentTitle,
            content: buffer.join("\n"),
            type: currentType,
          });
        }
        currentType = "topic";
        currentTitle = "Key Skills";
        buffer = [];
      } else if (line.startsWith("**Interview Questions:**")) {
        if (buffer.length && currentType) {
          resources.push({
            title: currentTitle,
            content: buffer.join("\n"),
            type: currentType,
          });
        }
        currentType = "question";
        currentTitle = "Interview Questions";
        buffer = [];
      } else if (line.startsWith("**Preparation Tips:**")) {
        if (buffer.length && currentType) {
          resources.push({
            title: currentTitle,
            content: buffer.join("\n"),
            type: currentType,
          });
        }
        currentType = "tip";
        currentTitle = "Preparation Tips";
        buffer = [];
      } else {
        buffer.push(line);
      }
    });

    if (buffer.length && currentType) {
      resources.push({
        title: currentTitle,
        content: buffer.join("\n"),
        type: currentType,
      });
    }

    return resources;
  }

  const handleJobSelect = (jobId: string) => {
    const selectedJob = jobs.find((job) => job._id === jobId);
    if (selectedJob) {
      dispatch(setJobDescription(selectedJob.description));
      setSelectedJob(jobId);
    }
  };

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
          <JobOpportunities
            jobs={jobs}
            selectedJob={selectedJob}
            handleJobSelect={handleJobSelect}
          />
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
                <Button onClick={downloadPrepResources} variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Download File
                </Button>
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
