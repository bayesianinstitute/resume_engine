// components/ResumeMatcher.tsx
"use client";

import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { FileText, Download, Briefcase, Link } from "lucide-react";
import Sidebar from "@/components/ui/sidebar";
import { RootState } from "../../lib/store/store";


export default function ResumeMatcher() {
    const [timeFilter, setTimeFilter] = useState("24h");
    const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
    const [selectAllJobs, setSelectAllJobs] = useState(false);
  
    const resumes = [
      { id: "mle", name: "Jason resume for MLE" },
      { id: "ds", name: "Jason resume for Data Scientist" },
    ];
  
    const jobs = useSelector((state: RootState) => state.jobs.jobs);
  
    const filteredJobs = jobs.filter((job) => {
      const jobDate = new Date(job.datePosted);
      const now = new Date();
      switch (timeFilter) {
        case "24h":
          return now.getTime() - jobDate.getTime() <= 24 * 60 * 60 * 1000;
        case "week":
          return now.getTime() - jobDate.getTime() <= 7 * 24 * 60 * 60 * 1000;
        case "month":
          return now.getTime() - jobDate.getTime() <= 30 * 24 * 60 * 60 * 1000;
        default:
          return true;
      }
    });
  
    const toggleSelectAll = (checked: boolean) => {
      setSelectedJobs(checked ? resumes.map((r) => r.id) : []);
    };
  
    const toggleSelectAllJobs = (checked: boolean) => {
      setSelectAllJobs(checked);
      setSelectedJobs(checked ? filteredJobs.map((job) => job._id) : []);
    };
  
    const toggleResume = (id: string) => {
      setSelectedJobs((prev) =>
        prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
      );
    };
  
    const toggleJob = (jobId: string) => {
      setSelectedJobs((prev) =>
        prev.includes(jobId)
          ? prev.filter((id) => id !== jobId)
          : [...prev, jobId]
      );
    };
  
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
  
        <div className="flex-1 ml-64 flex items-center justify-center">
          <div className="flex-1 p-6">
            <Card className="w-full max-w-4xl mx-auto">
              <CardHeader>
                <CardTitle className="text-2xl self-center">
                  Job Matcher
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="selectAll"
                      checked={selectedJobs.length === resumes.length}
                      onCheckedChange={toggleSelectAll}
                    />
                    <Label
                      htmlFor="selectAll"
                      className="text-sm font-medium leading-none"
                    >
                      Select ALL Resumes
                    </Label>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {resumes.map((resume) => (
                      <div
                        key={resume.id}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={resume.id}
                          checked={selectedJobs.includes(resume.id)}
                          onCheckedChange={() => toggleResume(resume.id)}
                        />
                        <Label
                          htmlFor={resume.id}
                          className="text-sm leading-none flex items-center"
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          {resume.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
  
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Time Filter</Label>
                  <RadioGroup
                    value={timeFilter}
                    onValueChange={setTimeFilter}
                    className="flex space-x-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="24h" id="24h" />
                      <Label htmlFor="24h">Last 24 hours</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="week" id="week" />
                      <Label htmlFor="week">Last week</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="month" id="month" />
                      <Label htmlFor="month">Last month</Label>
                    </div>
                  </RadioGroup>
                </div>
  
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">
                      Job Opportunities
                    </Label>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="selectAllJobs"
                        checked={selectAllJobs}
                        onCheckedChange={toggleSelectAllJobs}
                      />
                      <Label
                        htmlFor="selectAllJobs"
                        className="text-sm font-medium"
                      >
                        Select ALL Jobs
                      </Label>
                    </div>
                  </div>
                  <ScrollArea className="h-[200px] w-full rounded-md border p-4">
                    {filteredJobs.map((job, index) => (
                      <div
                        key={job._id}
                        className="flex items-center space-x-2 mb-2"
                      >
                        <Checkbox
                          id={`job-${index}`}
                          checked={selectedJobs.includes(job._id)}
                          onCheckedChange={() => toggleJob(job._id)}
                        />
                        <Label
                          htmlFor={`job-${index}`}
                          className="text-sm leading-none flex items-center"
                        >
                          <Briefcase className="h-4 w-4 mr-2" />
                          {new Date(job.datePosted).toLocaleDateString()} -{" "}
                          {job.company || "N/A"} - {job.title} -{" "}
                          <a
                            href={job.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors duration-200 mr-3"
                          >
                            <Link className="w-4 h-4 mr-2" />
                            View Details
                          </a>
                        </Label>
                      </div>
                    ))}
                  </ScrollArea>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button>Match</Button>
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" /> Download Results
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    );
  }