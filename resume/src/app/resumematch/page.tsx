"use client";
import { jwtDecode } from "jwt-decode";

import { ResumeMatchResults } from "@/components/resume-match-results";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import Sidebar from "@/components/ui/sidebar";
import { fetchJobs, setIsSearch } from "@/lib/store/features/job/jobSearch";
import {
  fetchMatchResults,
  updateMatchResultProgress,
} from "@/lib/store/features/resume/matchSlice";
import { fetchResumes } from "@/lib/store/features/resume/resumeSlice";
import { MatchResultResponse } from "@/types/matcher";
import { Briefcase, FileText, Link, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import useInfiniteScroll from "react-infinite-scroll-hook";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { io } from "socket.io-client";
import { AppDispatch, RootState } from "../../lib/store/store";

export default function ResumeMatcher() {
  const dispatch = useDispatch<AppDispatch>();
  const [timeFilter, setTimeFilter] = useState("week");
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const [selectAllJobs, setSelectAllJobs] = useState(false);
  const { resumes } = useSelector((state: RootState) => state.resume);
  const { error } = useSelector((state: RootState) => state.jobMatch);
  const { jobs, loading, totalJobs, isSearch } = useSelector(
    (state: RootState) => state.jobs
  );
  const [currentPage, setCurrentPage] = useState(1);
  const auth = useSelector((state: RootState) => state.auth);
  const router = useRouter();

  useEffect(() => {
    if (!jobs.length || isSearch) {
      dispatch(fetchJobs({ page: 1, limit: 10 }));
      dispatch(setIsSearch(false));
    }

    if (!resumes.length && auth.userId) {
      dispatch(fetchResumes(auth.userId));
    }
  }, [dispatch, jobs.length, auth.userId, resumes.length, isSearch]);

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

  const loadMoreJobs = useCallback(() => {
    if (!loading && jobs.length < totalJobs) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      dispatch(fetchJobs({ page: nextPage, limit: 10 }));
    }
  }, [currentPage, loading, jobs.length, totalJobs, dispatch]);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const hasNextPage = jobs.length < totalJobs;
  const [sentryRef] = useInfiniteScroll({
    loading,
    hasNextPage,
    onLoadMore: loadMoreJobs,
    rootMargin: "0px 0px 400px 0px",
  });

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      const resumeIds = resumes.map((resume) => resume.resumeId);
      // Only select resumes, leave job selections untouched
      setSelectedJobs((prevSelected) => [
        ...prevSelected.filter((id) => filteredJobs.some((job) => job._id === id)),
        ...resumeIds,
      ]);
    } else {
      // Deselect all resumes without affecting job selections
      setSelectedJobs((prevSelected) =>
        prevSelected.filter((id) => filteredJobs.some((job) => job._id === id))
      );
    }
  };
  
  const toggleSelectAllJobs = (checked: boolean) => {
    setSelectAllJobs(checked);
    if (checked) {
      // Select all jobs but leave resumes untouched
      setSelectedJobs((prevSelected) => [
        ...prevSelected.filter((id) => resumes.some((resume) => resume.resumeId === id)),
        ...filteredJobs.map((job) => job._id),
      ]);
    } else {
      // Deselect all jobs but leave resumes untouched
      setSelectedJobs((prevSelected) =>
        prevSelected.filter((id) => resumes.some((resume) => resume.resumeId === id))
      );
    }
  };
  
  const toggleResume = (resumeId: string) => {
    setSelectedJobs((prev) =>
      prev.includes(resumeId)
        ? prev.filter((id) => id !== resumeId)
        : [...prev, resumeId]
    );
  };

  const toggleJob = (jobId: string) => {
    setSelectedJobs((prev) =>
      prev.includes(jobId)
        ? prev.filter((id) => id !== jobId)
        : [...prev, jobId]
    );
  };

  // Helper functions for getting and decoding token
  const getToken = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("token") || "";
    }
    return ""; // Return an empty string if not in the browser
  };

  const getUserIdFromToken = () => {
    const token = getToken();
    if (token) {
      try {
        const decodedToken = jwtDecode<{ userId: string }>(token); // Adjust type if needed
        return decodedToken?.userId;
      } catch (error) {
        console.error("Error decoding token:", error);
        return null;
      }
    }
    return null;
  };
  const handleMatch = async () => {
    const userId = getUserIdFromToken();
    if (!userId) {
      toast.error("User not authenticated. Please log in.");
      return;
    }

    const resumeEntryIds = selectedJobs.filter((jobId) =>
      resumes.some((resume) => resume.resumeId === jobId)
    );
    const jobIds = selectedJobs.filter((jobId) =>
      filteredJobs.some((job) => job._id === jobId)
    );

    toast.info("Job Match requested sent");

    try {
      await dispatch(fetchMatchResults({ userId, resumeEntryIds, jobIds }));
      toast.success("Match result");
    } catch (e) {
      toast.error(error);
      console.error(e);
    }
  };

  // WebSocket setup for real-time updates
  useEffect(() => {
    const socket = io(
      process.env.NEXT_PUBLIC_BASE_WS_URL || "http://localhost:5000"
    );

    socket.on("progress", (data: MatchResultResponse) => {
      // Dispatch to update match result progress in Redux store
      if (!data.success) {
        toast.warning(data.message);
        return;
      }
      dispatch(updateMatchResultProgress(data.results));

      // Optionally show a toast notification for progress
      toast.info(data.message);
    });

    socket.on("done", (data) => {
      console.log(data);
      toast.success("Matching process completed!");
      socket.disconnect();
    });

    return () => {
      socket.disconnect();
    };
  }, [dispatch]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-64 flex items-center justify-center">
        <div className="flex-1 p-6">
          <h1 className="text-4xl font-extrabold text-gray-800 dark:text-gray-100 text-center mb-8">
            Resume Matching Tool
          </h1>
          <p className="text-lg text-center text-gray-600 dark:text-gray-300 mb-8">
            Unlock your interview potential with our tailored resources,
            carefully curated to match your resume with the perfect job
            opportunities.
          </p>
          <Card className="w-full max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl self-center">
                Job Matcher
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 text-center">
                Note: Matching one resume with multiple job descriptions or
                multiple resumes with multiple job descriptions may take some
                time. Please be patient.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Resumes Section */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="selectAll"
                    checked={
                      resumes.length > 0 &&
                      resumes.every((resume) =>
                        selectedJobs.includes(resume.resumeId)
                      )
                    }
                    onCheckedChange={toggleSelectAll}
                  />
                  <Label
                    htmlFor="selectAll"
                    className="text-sm font-medium leading-none"
                  >
                    Select Resumes
                  </Label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 ml-4">
                  {resumes.length === 0 ? (
                    <div>
                      <span className="text-red-500 mb-10">
                        No Resume Found. Please upload your resume before
                        proceeding.
                      </span>
                      <Button
                        onClick={async () => await router.push("/uploadResume")}
                        variant="outline"
                      >
                        <Upload className=" mr-2 h-4 w-4" />
                        Upload Resume
                      </Button>
                    </div>
                  ) : (
                    resumes.map((resume) => (
                      <div
                        key={resume.resumeId}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={resume.resumeId}
                          checked={selectedJobs.includes(resume.resumeId)}
                          onCheckedChange={() => toggleResume(resume.resumeId)}
                        />
                        {/* <Checkbox
                          id={resume.resumeId}
                          checked={selectedResumes.includes(resume.resumeId)}
                          onCheckedChange={() => toggleResume(resume.resumeId)}
                        /> */}
                        <Label
                          htmlFor={resume.resumeId}
                          className="text-sm leading-none flex items-center truncate"
                          title={resume.filename}
                          style={{
                            maxWidth: "calc(100% - 40px)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <FileText className="h-4 w-4 mr-2 flex-shrink-0" />
                          {resume.filename}
                        </Label>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Jobs Section */}
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
                      Select Jobs
                    </Label>
                  </div>
                </div>
                <ScrollArea
                  className="h-[200px] w-full rounded-md border p-4"
                  ref={scrollAreaRef}
                >
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
                        htmlFor={job._id}
                        className="flex-1 text-sm leading-none flex items-center cursor-pointer"
                      >
                        <Briefcase className="h-4 w-4 mr-2" />
                        <span className="font-medium">{job.title}</span>
                        <span className="mx-2 text-gray-400">|</span>
                        <span className="text-gray-600">
                          {job.company || "N/A"}
                        </span>

                        <span className="mx-2 text-gray-400">|</span>
                        <span className="text-gray-500 text-xs">
                          {new Date(job.datePosted).toLocaleDateString()}
                        </span>
                        <a
                          href={job.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-auto inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors duration-200"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Link className="w-4 h-4 mr-1" />
                          View
                        </a>
                      </Label>
                    </div>
                  ))}
                  {(loading || hasNextPage) && (
                    <div ref={sentryRef} className="text-center p-4">
                      {loading && "Loading more jobs..."}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button onClick={handleMatch}>Match</Button>
            </CardFooter>
          </Card>

          {/* Display Matching Results */}
          <ResumeMatchResults />
        </div>
      </div>
    </div>
  );
}
