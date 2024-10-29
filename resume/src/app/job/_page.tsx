"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Search,
  Briefcase,
  MapPin,
  Link,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Sidebar from "@/components/ui/sidebar";
import { useRouter } from "next/navigation";

interface Job {
  company: string;
  title: string;
  location: string;
  url: string;
}

export default function JobScraper() {
  const [jobTitle, setJobTitle] = useState("");
  const [jobLocation, setJobLocation] = useState("");
  const [scrapedJobs, setScrapedJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const jobsPerPage = 10;
  const router = useRouter();

  // Authentication check
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login"); // Redirect to login if no token is found
    }
  }, [router]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!jobTitle || !jobLocation) {
      alert("Please fill in all fields.");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/resume/scrape`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            jobTitle,
            jobLocation,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to scrape jobs.");
      }

      const data = await response.json();
      setScrapedJobs(data);
      setCurrentPage(1); // Reset to first page when new jobs are fetched
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred while scraping jobs.");
    } finally {
      setLoading(false);
    }
  };

  // Calculate indices for current page
  const indexOfLastJob = currentPage * jobsPerPage;
  const indexOfFirstJob = indexOfLastJob - jobsPerPage;
  const currentJobs = scrapedJobs.slice(indexOfFirstJob, indexOfLastJob);

  // Pagination control
  const totalPages = Math.ceil(scrapedJobs.length / jobsPerPage);

  const handlePreviousPage = () => {
    setCurrentPage((prevPage) => Math.max(prevPage - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prevPage) => Math.min(prevPage + 1, totalPages));
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />

      <div className="flex-1 ml-64">
        {/* Main content */}
        <div className="flex-1 p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Title */}
            <h1 className="text-4xl font-extrabold text-gray-800 text-center">
              Job list
            </h1>
            <p className="text-lg text-center text-gray-600 mb-6">
              Find the latest job opportunities tailored to your preferences
            </p>

            {/* Scraping Form */}
            <Card className="shadow-lg rounded-lg bg-white p-8">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold text-gray-700">
                  Search for Jobs
                </CardTitle>
                <CardDescription className="text-gray-500">
                  Enter your job preferences to start scraping.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label
                      htmlFor="jobTitle"
                      className="text-gray-700 font-medium"
                    >
                      Job Title
                    </Label>
                    <Input
                      id="jobTitle"
                      type="text"
                      placeholder="e.g. AI Engineer"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      className="w-full border-gray-300 rounded-md focus:ring focus:ring-blue-200 focus:border-blue-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="jobLocation"
                      className="text-gray-700 font-medium"
                    >
                      Job Location
                    </Label>
                    <Input
                      id="jobLocation"
                      type="text"
                      placeholder="e.g. Germany"
                      value={jobLocation}
                      onChange={(e) => setJobLocation(e.target.value)}
                      className="w-full border-gray-300 rounded-md focus:ring focus:ring-blue-200 focus:border-blue-400"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition duration-200 flex items-center justify-center"
                    disabled={loading}
                  >
                    {loading ? (
                      "Scraping..."
                    ) : (
                      <>
                        <Search className="w-5 h-5 mr-2" />
                        Scrape Jobs
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Scraped Jobs Results with Pagination */}
            {scrapedJobs.length > 0 && (
              <Card className="shadow-lg rounded-lg bg-white p-8">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl font-bold text-gray-700">
                    Scraped Jobs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {currentJobs.map((job, index) => (
                      <div
                        key={index}
                        className="border-b border-gray-200 pb-4 last:border-b-0"
                      >
                        <h3 className="text-xl font-semibold text-gray-800 mb-2 flex items-center">
                          <Briefcase className="w-5 h-5 mr-2 text-blue-500" />
                          {job.title}
                        </h3>
                        <p className="text-gray-600 mb-1 flex items-center">
                          <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                          {job.location}
                        </p>
                        {job.company && (
                          <p className="text-gray-600 mb-1">
                            Company: {job.company}
                          </p>
                        )}
                        {job.url && (
                          <a
                            href={job.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline flex items-center"
                          >
                            <Link className="w-4 h-4 mr-2" />
                            View Job
                          </a>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Pagination Controls */}
                  <div className="flex justify-between items-center mt-6">
                    <Button
                      onClick={handlePreviousPage}
                      disabled={currentPage === 1}
                      className="bg-gray-200 text-gray-600 hover:bg-gray-300 flex items-center px-3 py-2 rounded"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Previous
                    </Button>

                    <p className="text-gray-700">
                      Page {currentPage} of {totalPages}
                    </p>

                    <Button
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                      className="bg-gray-200 text-gray-600 hover:bg-gray-300 flex items-center px-3 py-2 rounded"
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
