// components/JobScraper.tsx
"use client";
import { useCallback, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  clearSearch,
  fetchJobs,
  searchJobs,
} from "../../lib/store/features/job/jobSearch";
import { RootState, AppDispatch } from "../../lib/store/store";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
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
  Search,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

export default function JobScraper() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const observer = useRef<IntersectionObserver | null>(null);

  const {
    jobs,
    totalJobs,
    loading,
    error,
    jobTitle,
    jobLocation,
    datePosted,
    currentPage,
    isSearching,
  } = useSelector((state: RootState) => state.jobs);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login");
      return;
    }
    dispatch(fetchJobs(1));
  }, [dispatch, router]);

  const handleSearch = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      await dispatch(
        searchJobs({ jobTitle, jobLocation, datePosted })
      ).unwrap();
    } catch (error) {
      toast({
        title: "Search Failed",
        description: "Unable to perform search. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleClearSearch = () => {
    dispatch(clearSearch());
  };
  const totalPages = Math.ceil(totalJobs / 10); // Assuming 10 jobs per page

  const handlePageChange = (page: number) => {
    if (page !== currentPage) {
      dispatch(fetchJobs(page));  // Fetch only the jobs for the new page
    }
  };
  
  // Infinite scroll
  const lastJobElementRef = useCallback(
    (node) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && currentPage < totalPages) {
          dispatch(fetchJobs(currentPage + 1));
        }
      });
      if (node) observer.current.observe(node);
    },
    [loading, currentPage, totalPages, dispatch]
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
                          onChange={(e) =>
                            dispatch({
                              type: "jobs/setJobTitle",
                              payload: e.target.value,
                            })
                          }
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
                          onChange={(e) =>
                            dispatch({
                              type: "jobs/setJobLocation",
                              payload: e.target.value,
                            })
                          }
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
                            onSelect={(date) =>
                              dispatch({
                                type: "jobs/setDatePosted",
                                payload: date,
                              })
                            }
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

                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleClearSearch}
                      className="w-40"
                    >
                      Clear Search
                    </Button>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {jobs.map((job, index) => (
                  <JobCard
                    key={job._id}
                    job={job}
                    index={index}
                    jobs={jobs}
                    lastJobElementRef={
                      index === jobs.length - 1 ? lastJobElementRef : null
                    } // Adjusted condition for last job
                    router={router}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600">
                  No jobs found matching your criteria.
                </p>
              </div>
            )}

            {/* Pagination Controls */}
            <div className="flex justify-center space-x-4 py-4">
              {Array.from({ length: totalPages }, (_, index) => (
                <Button
                  key={index + 1}
                  variant="outline"
                  onClick={() => handlePageChange(index + 1)}
                  className={`px-4 ${
                    currentPage === index + 1
                      ? "bg-blue-600 text-white"
                      : "text-blue-600"
                  }`}
                >
                  {index + 1}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
