"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CustomDropdown } from "@/components/ui/cdropdown";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import Sidebar from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { dateOptions, experienceOptions } from "@/constant/dropdata";
import { useEffect, useState } from "react";

import { AddJobApi, AddJobForm, AutoJob, AutoJobApi, Feature, searchlocationFeature,  } from "@/types/job";
import { toast } from "react-toastify";

import { Loader2 } from "lucide-react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/lib/store/store";
import { addJobb } from "@/lib/store/features/job/jobSearch";

export default function JobTabs() {
  const dispatch=useDispatch<AppDispatch>()
  const [formData, setFormData] = useState<AddJobForm>({
    title: "",
    location: "",
    experienceLevel: "",
    datePosted: new Date(),
    description: "",
    url: "",
    company: "",
  });
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedExperience, setSelectedExperience] = useState<string>("");
  const [autoJobData, setAutoJobData] = useState<AutoJob>({
    title: "",
    location: "",
    country_code:"",
    datePosted: 24,
    max_result_wanted: 20,
  });
  

  const [isLocationLoading, setIsLocationLoading] = useState(true);

  const [suggestions, setSuggestions] = useState<searchlocationFeature[]>([]);

  const handleLocationChange = async (e:React.ChangeEvent<HTMLInputElement>) => {
    
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, location: value }));
    setAutoJobData((prev) => ({ ...prev, location: value }));

    if (value.length > 2) {
      try {
        const response = await fetch(
          `https://api.geoapify.com/v1/geocode/autocomplete?text=${value}&apiKey=${process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY}`
        );
        const data = await response.json();
        setSuggestions(data.features.map((feature:Feature) => feature.properties));
      } catch (error) {
        console.error("Error fetching suggestions:", error);
      }
    } else {
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (suggestion:searchlocationFeature) => {
    setFormData((prev) => ({ ...prev, location: suggestion.city,country_code:suggestion.country_code }));
    setAutoJobData((prev) => ({ ...prev, location: suggestion.city,country_code:suggestion.country_code }));
    setSuggestions([]); // Clear suggestions after selection
  };

  useEffect(() => {
    fetchUserLocation();
  }, []);

  const fetchUserLocation = async () => {
    try {
      const response = await fetch(
        `https://api.geoapify.com/v1/ipinfo?apiKey=${process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY}`
      );
      const data = await response.json();
      setFormData((prev) => ({
        ...prev,
        city: data.city.name,
      }));
      setAutoJobData((prev) => ({
        ...prev,
        city: data.city.name,
        country: data.country.name,
      }));
      console.log(data.city.name, data.country.name);
    } catch (error) {
      console.error("Error fetching location:", error);
    } finally {
      setIsLocationLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    if (id === "datePosted") {
      setFormData((prev) => ({ ...prev, [id]: new Date(value) }));
    } else {
      setFormData((prev) => ({ ...prev, [id]: value }));
    }
  };

  const addJob = async () => {
    const {
      title,
      location,
      experienceLevel,
      datePosted,
      description,
      url,
      company,
    } = formData;
    const requiredFields = [
      { field: title, name: "job title" },
      { field: location, name: "location" },
      { field: experienceLevel, name: "experience level" },
      { field: description, name: "job description" },
      { field: company, name: "company name" },
      { field: datePosted, name: "date posted" },
    ];

    for (const { field, name } of requiredFields) {
      if (!field) {
        toast.warning(`Please provide the ${name}`);
        return;
      }
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/job/add`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          location,
          experienceLevel,
          datePosted: datePosted.toISOString().split("T")[0],
          description,
          url,
          company,
        }),
      }
    );
    const responseData: AddJobApi = await response.json();
    if (responseData.success) {
      toast.success(responseData.message);
      if (responseData.joblist && responseData.joblist.length > 0) {
        dispatch(addJobb(responseData.joblist)); 
      }

      setFormData({
        title: "",
        location: "",
        experienceLevel: "",
        datePosted: new Date(),
        description: "",
        url: "",
        company: "",
      });
      setSelectedDate("");
      setSelectedExperience("");
    } else {
      toast.error(responseData.message);
    }
  };

  const autofetchJobs = async () => {
    const { title, location, datePosted, max_result_wanted,country_code } = autoJobData;
    const requiredFields = [
      { field: title, name: "job title" },
      { field: location, name: "location" },
    ];

    for (const { field, name } of requiredFields) {
      if (!field) {
        toast.warning(`Please provide the ${name}`);
        return;
      }
    }
    toast("Requesting auto job");

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/job/scrap`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json", // Ensure the body is sent as JSON
          },
          body: JSON.stringify({
            title,
            location,
            hours: datePosted,
            max_result_wanted,
            country_code: country_code,
          }),
        }
      );
      const responseData: AutoJobApi = await response.json();
      if (responseData.success) {

        toast.success(responseData.message);
        if (responseData.joblist && responseData.joblist.length > 0) {
          dispatch(addJobb(responseData.joblist)); 
        }
        
      } else {
        toast.error(responseData.message);
      }
    } catch (error) {
      console.error("Error while fetching jobs:", error);
      toast.error("An error occurred while fetching jobs");
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}

      <Sidebar />
      <div className="flex-1 ml-64 flex items-center justify-center">
        <div className="flex-1 ml-20 mt-9 ">
          <h1 className="text-4xl font-extrabold text-gray-800 dark:text-gray-100 text-center mb-8">
            Job Management System
          </h1>

          <p className="text-lg text-center text-gray-600 dark:text-gray-300 mb-8">
            Efficiently manage job listings with our intuitive system, designed
            to streamline the process of adding and scraping job opportunities.
          </p>
          <div className="ml-64">
            <Tabs defaultValue="add-job" className="w-[600px]">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="add-job">Add Job</TabsTrigger>
                <TabsTrigger value="auto-job">Auto Job</TabsTrigger>
              </TabsList>
              <TabsContent value="add-job" className="h-full ">
                <Card className="">
                  <CardHeader>
                    <CardTitle>Add Job</CardTitle>
                    <CardDescription>
                      Manually add a new job listing. Fill in all the details
                      below.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 overflow-auto">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        placeholder="Enter job title"
                        value={formData.title}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2 relative">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={handleLocationChange}
                        placeholder="Detecting your location..."
                        required
                        disabled={isLocationLoading}
                      />
                      {isLocationLoading && (
                        <Loader2
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 animate-spin"
                          size={20}
                        />
                      )}
                      {/* City suggestions dropdown */}
                      {suggestions.length > 0 && (
                        <div className="absolute bg-white border border-gray-300 rounded-md w-full mt-1 max-h-40 overflow-y-auto">
                          {suggestions.map((suggestion, index) => (
                            <div
                              key={index}
                              onClick={() => handleSuggestionClick(suggestion)}
                              className="px-4 py-2 hover:bg-gray-200 cursor-pointer"
                            >
                              {suggestion.formatted}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="auto-experienceLevel">
                        Experience Level
                      </Label>
                      <br />
                      <CustomDropdown
                        options={experienceOptions as never[]}
                        placeholder="Select Experience Level"
                        value={selectedExperience as never}
                        onSelect={(value: string | null) => {
                          setSelectedExperience(value ?? "");
                          setFormData((prev) => ({
                            ...prev,
                            experienceLevel: value ?? "",
                          }));
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="datePosted">Date Posted</Label>
                      <Input
                        id="datePosted"
                        type="date"
                        value={formData.datePosted.toISOString().split("T")[0]}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Enter job description"
                        value={formData.description}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="url">URL</Label>
                      <Input
                        id="url"
                        placeholder="Enter job posting URL (optional)"
                        value={formData.url}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company">Company</Label>
                      <Input
                        id="company"
                        placeholder="Enter company name"
                        value={formData.company}
                        onChange={handleChange}
                      />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button onClick={addJob}>Add Job</Button>
                  </CardFooter>
                </Card>
              </TabsContent>
              <TabsContent value="auto-job" className="h-full overflow-auto">
                <Card className="h-[600px]">
                  <CardHeader>
                    <CardTitle>Auto Job</CardTitle>
                    <CardDescription>
                      Automatically add job listings. Provide basic information
                      below.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 overflow-auto">
                    <div className="space-y-2">
                      <Label htmlFor="auto-title">Title</Label>
                      <Input
                        id="autoTitle"
                        placeholder="Enter job title"
                        value={autoJobData.title}
                        onChange={(e) =>
                          setAutoJobData((prev) => ({
                            ...prev,
                            title: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2 relative">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={autoJobData.location}
                        onChange={handleLocationChange}
                        placeholder="Detecting your location..."
                        required
                        disabled={isLocationLoading}
                      />
                      {isLocationLoading && (
                        <Loader2
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 animate-spin"
                          size={20}
                        />
                      )}
                      {/* City suggestions dropdown */}
                      {suggestions.length > 0 && (
                        <div className="absolute bg-white border border-gray-300 rounded-md w-full mt-1 max-h-40 overflow-y-auto">
                          {suggestions.map((suggestion, index) => (
                            <div
                              key={index}
                              onClick={() => handleSuggestionClick(suggestion)}
                              className="px-4 py-2 hover:bg-gray-200 cursor-pointer"
                            >
                              {suggestion.formatted}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxResultWanted">
                        Maximum Jobs to Scrape
                      </Label>
                      <Input
                        id="maxResultWanted"
                        type="number"
                        min="1"
                        placeholder="Enter maximum jobs to scrape"
                        value={autoJobData.max_result_wanted}
                        onChange={(e) =>
                          setAutoJobData((prev) => ({
                            ...prev,
                            max_result_wanted: parseInt(e.target.value),
                          }))
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="datePosted">Date Posted</label>
                      <br />
                      <CustomDropdown
                        options={dateOptions as never}
                        placeholder="Select date range"
                        value={selectedDate}
                        onSelect={(value: string | null) => {
                          setSelectedDate(value ?? "");
                          setAutoJobData((prev) => ({
                            ...prev,
                            autoDatePosted: value ? parseInt(value) : 0,
                          }));
                        }}
                      />
                    </div>
                    <></>
                  </CardContent>
                  <CardFooter>
                    <Button onClick={autofetchJobs}>Auto Add Jobs</Button>
                  </CardFooter>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
