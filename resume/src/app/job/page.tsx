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
import { experienceOptions } from "@/constant/dropdata";
import { useState } from "react";

import { AddJobApi, AddJobForm, Feature, searchlocationFeature } from "@/types/job";
import { toast } from "react-toastify";

// import { Loader2 } from "lucide-react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/lib/store/store";
import { addJobb } from "@/lib/store/features/job/jobSearch";

export default function JobTabs() {
  const dispatch = useDispatch<AppDispatch>();
  const [formData, setFormData] = useState<AddJobForm>({
    title: "",
    location: "",
    experienceLevel: "",
    datePosted: new Date(),
    description: "",
    url: "",
    company: "",
  });

  // const [isLocationLoading, setIsLocationLoading] = useState(true);

  const [suggestions, setSuggestions] = useState<searchlocationFeature[]>([]);

  const handleLocationChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, location: value }));

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
    setFormData((prev) => ({ ...prev, location: suggestion.city }));
    setSuggestions([]); // Clear suggestions after selection
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
    } else {
      toast.error(responseData.message);
    }
  };

  return (
<div className="flex min-h-screen bg-gray-50">
  <Sidebar />
  <div className="flex-1 flex items-center justify-center">
    <div className="w-full max-w-xl p-8">
      <h1 className="text-4xl font-extrabold text-gray-800 text-center mb-8">
        Job Management System
      </h1>

      <p className="text-lg text-center text-gray-600 mb-8">
        Efficiently manage job listings with our intuitive system.
      </p>

      <Tabs defaultValue="add-job" className="w-full">
        <TabsList className="grid w-full grid-cols-1">
          <TabsTrigger value="add-job">Add Job</TabsTrigger>
        </TabsList>
        <TabsContent value="add-job">
          <Card>
            <CardHeader>
              <CardTitle>Add Job</CardTitle>
              <CardDescription>
                Manually add a new job listing. Fill in all the details below.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
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
                />
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
                <Label htmlFor="experienceLevel">Experience Level</Label>
                <CustomDropdown
                  options={experienceOptions as never[]}
                  placeholder="Select Experience Level"
                  value={formData.experienceLevel as never}
                  onSelect={(value: string | null) => {
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
      </Tabs>
    </div>
  </div>
</div>

  );
}
