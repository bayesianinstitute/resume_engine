"use client";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import JobCard from "@/components/ui/jobCard";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import Sidebar from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import {
  Briefcase,
  Calendar as CalendarIcon,
  MapPin,
  Search
} from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";

interface Job {
  _id: string;
  title: string;
  location: string;
  datePosted: string;
  experienceLevel: string;
  description: string;
  url: string;
}

interface JobsResponse {
  totalJoblists: number;
  currentPage: number;
  totalPages: number;
  joblists: Job[];
}

export default function JobScraper() {
  const [jobTitle, setJobTitle] = useState("");
  const [jobLocation, setJobLocation] = useState("");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [datePosted, setDatePosted] = useState<Date | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();
  const observer = useRef<IntersectionObserver | null>(null);

  // Initial jobs fetch
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login");
      return;
    }
    fetchInitialJobs(1);
  }, []);

  const fetchInitialJobs = async (page: number) => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/job/list?page=${page}&limit=10`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch jobs");
      }

      const data: JobsResponse = await response.json();
      setJobs((prevJobs) => [...prevJobs, ...data.joblists]);
      setTotalJobs(data.totalJoblists);
      setCurrentPage(data.currentPage);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch jobs. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSearching(true);

    try {
      setLoading(true);
      const searchParams = new URLSearchParams();
      if (jobTitle) searchParams.append("title", jobTitle);
      if (jobLocation) searchParams.append("location", jobLocation);
      if (datePosted)
        searchParams.append("datePosted", datePosted.toISOString());

      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_BASE_URL
        }/job/search?${searchParams.toString()}`
      );

      if (!response.ok) {
        throw new Error("Search failed");
      }

      const searchResults: Job[] = await response.json();
      setJobs(searchResults);
      setTotalJobs(searchResults.length);
      setCurrentPage(1);
    } catch (error) {
      toast({
        title: "Search Failed",
        description: "Unable to perform search. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClearSearch = () => {
    setJobTitle("");
    setJobLocation("");
    setDatePosted(null);
    setIsSearching(false);
    setJobs([]);
    fetchInitialJobs(1);
  };

  const lastJobElementRef = useCallback(
    (node) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && currentPage < Math.ceil(totalJobs / 10)) {
          fetchInitialJobs(currentPage + 1);
        }
      });
      if (node) observer.current.observe(node);
    },
    [loading, currentPage, totalJobs]
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 ml-64">
        <div className="p-8">
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Discover Your Next Opportunity
              </h1>
              <p className="text-lg text-gray-600">
                {totalJobs} jobs available
              </p>
            </div>

            <Card className="shadow-lg border-0 rounded-xl bg-white/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <form onSubmit={handleSearch} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-gray-700">
                        Job Title
                      </Label>
                      <div className="relative">
                        <Briefcase className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          value={jobTitle}
                          onChange={(e) => setJobTitle(e.target.value)}
                          placeholder="e.g. Data Scientist"
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-gray-700">
                        Location
                      </Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          value={jobLocation}
                          onChange={(e) => setJobLocation(e.target.value)}
                          placeholder="e.g. San Francisco"
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-gray-700">
                        Posted After
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {datePosted ? (
                              format(datePosted, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={datePosted}
                            onSelect={setDatePosted}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-6 rounded-lg hover:from-blue-700 hover:to-purple-700 transition duration-200"
                      disabled={loading}
                    >
                      {loading ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          <span>Searching...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center space-x-2">
                          <Search className="w-5 h-5" />
                          <span>Search Jobs</span>
                        </div>
                      )}
                    </Button>
                    {isSearching && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleClearSearch}
                        className="w-40"
                      >
                        Clear Search
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(4)].map((_, i) => (
                  <Card key={i} className="border-0 shadow-md">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-4 w-1/3" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : jobs.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {jobs.map((job, index) => (
                    <JobCard
                      key={job._id}
                      job={job}
                      index={index}
                      jobs={jobs}
                      lastJobElementRef={lastJobElementRef}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600">
                  No jobs found matching your criteria.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
