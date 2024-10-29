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
import { useState } from "react";
import useAuth from "@/hooks/useAuth";


import { toast } from "react-toastify";

export default function JobTabs() {


  const [formData, setFormData] = useState({
    title: "",
    location: "",
    experienceLevel: "",
    datePosted: "",
    description: "",
    url: "",
    company: "",
  });
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedExperience, setSelectedExperience] = useState("");
  const [autoJobData, setAutoJobData] = useState({
    autoTitle: "",
    autoLocation: "",
    autoExperienceLevel: "",
    autoDatePosted: 24,
  });

  // useAuth()

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };



  const handleAutoChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    setAutoJobData((prev) => ({ ...prev, [id]: value }));
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

    if (
      !title ||
      !location ||
      !experienceLevel ||
      !description ||
      !company ||
      !datePosted
    ) {
      toast.warning("Please provide all required parameters");
      return;
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
          datePosted,
          description,
          url,
          company,
        }),
      }
    );

    if (response.ok) {
      toast.success("Job added successfully");
      setFormData({
        title: "",
        location: "",
        experienceLevel: "",
        datePosted: "",
        description: "",
        url: "",
        company: "",
      });
      setSelectedDate("");
      setSelectedExperience("");
    } else {
      toast.error("Failed to add job");
    }
  };

  const fetchJobs = async () => {
    const { autoTitle, autoLocation, autoExperienceLevel, autoDatePosted } =
      autoJobData;

    if (!autoTitle || !autoLocation  || !autoDatePosted) {
      toast.warning(
        "Please provide all required parameters for auto job scraping"
      );
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/job/scrap/${autoTitle}/${autoLocation}/${autoDatePosted}`,
        {
          method: "POST",
        }
      );

      if (response.ok) {
        const data:scrapeapi = await response.json();
        toast.success(data.message);

        // Here you could add code to save the jobs to your database if needed.
      } else {
        toast.error("Failed to scrape jobs");
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
        <Tabs defaultValue="add-job" className="w-[600px]">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="add-job">Add Job</TabsTrigger>
            <TabsTrigger value="auto-job">Auto Job</TabsTrigger>
          </TabsList>
          <TabsContent value="add-job">
            <Card>
              <CardHeader>
                <CardTitle>Add Job</CardTitle>
                <CardDescription>
                  Manually add a new job listing. Fill in all the details below.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="Enter job title"
                    value={formData.title}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="Enter job location"
                    value={formData.location}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="auto-experienceLevel">Experience Level</Label>
                  <br />
                  <CustomDropdown
                    options={experienceOptions}
                    placeholder="Select Experience Level"
                    value={selectedExperience}
                    onSelect={(value) => {
                      setSelectedExperience(value);
                      setFormData((prev) => ({
                        ...prev,
                        experienceLevel: value,
                      }));
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="datePosted">Date Posted</Label>
                  <Input
                    id="datePosted"
                    type="date"
                    value={formData.datePosted}
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
          <TabsContent value="auto-job">
            <Card>
              <CardHeader>
                <CardTitle>Auto Job</CardTitle>
                <CardDescription>
                  Automatically add job listings. Provide basic information
                  below.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 ">
                <div className="space-y-2">
                  <Label htmlFor="auto-title">Title</Label>
                  <Input
                    id="autoTitle"  
                    placeholder="Enter job title"
                    value={autoJobData.autoTitle}
                    onChange={handleAutoChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="auto-location">Location</Label>
                  <Input
                    id="autoLocation"
                    placeholder="Enter job location"
                    value={autoJobData.autoLocation}
                    onChange={handleAutoChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="auto-experienceLevel">Experience Level</Label>
                  <br />
                  <CustomDropdown
                    options={experienceOptions}
                    placeholder="Select Experience Level"
                    value={autoJobData.autoExperienceLevel}
                    onSelect={(value) => {
                      setAutoJobData((prev) => ({
                        ...prev,
                        autoExperienceLevel: value,
                      }));
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="datePosted">Date Posted</label>
                  <br />
                  <CustomDropdown
                    options={dateOptions}
                    placeholder="Select date range"
                    value={selectedDate}
                    onSelect={(value) => {
                      setSelectedDate(value);
                      setAutoJobData((prev) => ({
                        ...prev,
                        autoDatePosted: value,
                      }));
                    }}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={fetchJobs}>Auto Add Jobs</Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
