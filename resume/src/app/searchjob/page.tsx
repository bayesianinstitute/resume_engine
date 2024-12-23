// components/JobScraper.tsx
"use client";
import Tour from "@/components/Tour";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import Sidebar from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { searchStep } from "@/constant/tourdata";
import { format } from "date-fns";
import {
  Briefcase,
  Calendar as CalendarIcon,
  MapPin,
  Search,
} from "lucide-react";
import { lazy, Suspense, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
  clearSearch,
  fetchJobs,
  searchJobs,
  setCurrentPage,
  setIsSearch,
  setReset,
} from "../../lib/store/features/job/jobSearch";
import { AppDispatch, RootState } from "../../lib/store/store";
import { disableNextDays } from "@/lib/utils";

const JobCard = lazy(() => import("@/components/ui/jobCard"));

export default function JobScraper() {
  const dispatch = useDispatch<AppDispatch>();

  const {
    jobs,
    totalJobs,
    loading,
    jobTitle,
    jobLocation,
    datePosted,
    currentPage,
    reset,
    isSearch,
  } = useSelector((state: RootState) => state.jobs);

  useEffect(() => {
    // Dispatch fetchJobs unconditionally; Redux will handle the check
    if (reset) {
      dispatch(fetchJobs({ page: 1, limit: 10 }));
      dispatch(setReset(false)); // Reset after fetching to prevent re-trigger
      dispatch(setCurrentPage(1));
    }
  }, [dispatch, reset, jobTitle]);

  const handleSearch = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      await dispatch(searchJobs()).unwrap();
      dispatch(setIsSearch(true));
    } catch (error) {
      toast.error("Search Failed ");
      console.log(error);
    }
  };

  const handleClearSearch = () => {
    dispatch(clearSearch());
    dispatch(setReset(true));
    dispatch(setIsSearch(false));
  };
  const PAGE_LIMIT = 10; // Number of jobs per page
  const MAX_VISIBLE_PAGES = 8; // Max visible page buttons

  const totalPages = Math.ceil(totalJobs / PAGE_LIMIT);

  // Calculate the page range to display
  const calculatePageRange = (currentPage: number) => {
    const start = Math.max(currentPage - Math.floor(MAX_VISIBLE_PAGES / 2), 1);
    const end = Math.min(start + MAX_VISIBLE_PAGES - 1, totalPages);

    // Adjust the range if the end goes beyond the total pages
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  // Handle page change with edge cases (previous and next buttons)
  const handlePrevious = () => {
    if (currentPage > 1) {
      const newPage = currentPage - 1;
      dispatch(setCurrentPage(newPage)); // Update the page in Redux
      dispatch(fetchJobs({ page: newPage, limit: 10 })); // Fetch jobs for the previous page
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      const newPage = currentPage + 1;
      dispatch(setCurrentPage(newPage)); // Update the page in Redux
      dispatch(fetchJobs({ page: newPage, limit: 10 })); // Fetch jobs for the next page
    }
  };

  const handlePageChange = (page: number) => {
    if (page !== currentPage) {
      dispatch(setCurrentPage(page)); // Update the page in Redux
      dispatch(fetchJobs({ page: page, limit: 10 })); // Fetch jobs for the next page
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Tour steps={searchStep} name="JobSearchTourComplete" />

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

            <Card className=" shadow-lg border-0 rounded-xl bg-white/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <form onSubmit={handleSearch} className="space-y-6">
                  <div className="searchinput grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                            selected={
                              typeof datePosted === "string"
                                ? new Date(datePosted)
                                : datePosted
                            }
                            onSelect={(date) =>
                              dispatch({
                                type: "jobs/setDatePosted",
                                payload: date,
                              })
                            }
                            disabled={disableNextDays}
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
              <div className="joblist grid grid-cols-1 md:grid-cols-2 gap-6">
                <Suspense fallback={<div>Loading Jobs...</div>}>
                  {jobs.map((job, index) => (
                    <JobCard key={job._id} job={job} index={index} />
                  ))}
                </Suspense>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600">
                  No jobs found matching your criteria.
                </p>
              </div>
            )}

            {/* Pagination Controls hide if search is true */}
            {!isSearch && (
              <div className="flex justify-center space-x-4 py-4">
                {/* Previous Button */}
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentPage === 1}
                  className="px-4 text-blue-600"
                >
                  Previous
                </Button>

                {/* Page Buttons */}
                {calculatePageRange(currentPage).map((page) => (
                  <Button
                    key={page}
                    variant="outline"
                    onClick={() => handlePageChange(page)}
                    className={`px-4 py-2 rounded-md transition duration-200 ${
                      currentPage === page
                        ? "bg-blue-600 text-white" // Active button color
                        : "bg-white text-blue-600 hover:bg-blue-100" // Inactive button color
                    }`}
                  >
                    {page}
                  </Button>
                ))}

                {/* Next Button */}
                <Button
                  variant="outline"
                  onClick={handleNext}
                  disabled={currentPage === totalPages}
                  className="px-4 text-blue-600"
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
