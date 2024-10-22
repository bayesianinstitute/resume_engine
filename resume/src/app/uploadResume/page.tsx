"use client"; // Ensure this is a client-side component

import React, { useState } from "react";
import { useRouter } from "next/navigation"; // Import from next/navigation
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Sidebar from "@/components/ui/sidebar"; // Assuming you have a sidebar component

export default function UploadResume() {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter(); // useRouter from next/navigation

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const userId = getUserIdFromToken();
    if (!file || !userId) {
      setError("Please select a file and make sure you're logged in.");
      return;
    }

    const formData = new FormData();
    formData.append("resume", file);
    formData.append("userId", userId);

    setIsLoading(true);

    try {
      const response = await fetch("/api/uploadResume", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        alert("Resume uploaded successfully!");
        router.push("/dashboard"); // Redirect to the dashboard after successful upload
      } else {
        const result = await response.json();
        setError(result.message || "Failed to upload resume.");
      }
    } catch (error) {
      console.error("Error uploading resume:", error);
      setError("Failed to upload resume.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar component */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex-1 flex items-center justify-center p-6">
        <form className="p-6 bg-white shadow-lg rounded" onSubmit={handleSubmit}>
          <h1 className="text-2xl font-bold mb-4">Upload Your Resume</h1>
          {error && <p className="text-red-500">{error}</p>}
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleFileChange}
            className="mb-4"
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Uploading..." : "Upload Resume"}
          </Button>
        </form>
      </div>
    </div>
  );
}
