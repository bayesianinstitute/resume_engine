"use client";

import React, { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { useRouter } from "next/navigation";
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
import { Upload, FileText, CheckCircle } from "lucide-react";
import Sidebar from "@/components/ui/sidebar";

// Define the custom JWT payload type
interface CustomJwtPayload {
  userId: string;
}

interface Skill {
  skillName: string;
  skillLevel: number;
}

interface ResumeAnalysis {
  strengths: string[];
  weaknesses: string[];
}

interface SkillProgress {
  skills: Skill[];
  evaluatedAt: string;
}

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
      const decodedToken = jwtDecode<CustomJwtPayload>(token);
      return decodedToken?.userId;
    } catch (error) {
      console.error("Error decoding token:", error);
      return null;
    }
  }
  return null;
};

export default function ResumeMatcher() {
  const [file, setFile] = useState<File | null>(null);
  const [matchResult, setMatchResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resumeAnalysis, setResumeAnalysis] = useState<ResumeAnalysis | null>(
    null
  );
  const [skillProgresses, setSkillProgresses] = useState<SkillProgress | null>(
    null
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();

  // Check if the user is authenticated
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      // If no token, redirect to login page
      router.replace("/login");
    } else {
      fetchResumeAnalysis();
      fetchSkillProgresses();
    }
  }, [router]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    // Fetch token and userId
    const token = getToken();
    const userId = getUserIdFromToken();

    if (!userId) {
      alert("User not authenticated");
      return;
    }

    if (!file) {
      alert("Please upload a resume.");
      return;
    }

    const formData = new FormData();
    formData.append("resume", file);
    formData.append("userId", userId); // Include userId in the form data

    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/resume/stats`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to match resume with job description.");
      }

      const data = await response.json();
      let result = `${data.matchResult} \n ${data.evaluationResponse}`;

      // Deduplication: Remove any repeated lines in the result
      result = result
        .split("\n")
        .filter(
          (line, index, self) =>
            index === self.findIndex((t) => t.trim() === line.trim())
        )
        .join("\n");

      setMatchResult(`Score: ${result}`);
    } catch (error) {
      console.error("Error:", error);
      setMatchResult("An error occurred while matching the resume.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch resume analysis (strengths and weaknesses)
  const fetchResumeAnalysis = async () => {
    const token = getToken();
    const userId = getUserIdFromToken();

    if (!userId) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/resume/resumeanalysis`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ userId }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setResumeAnalysis(data.data);
      } else {
        setErrorMessage("Failed to fetch resume analysis.");
      }
    } catch (error) {
      console.error("Error fetching resume analysis:", error);
      setErrorMessage("An error occurred while fetching resume analysis.");
    }
  };

  // Fetch skill progresses (skills)
  const fetchSkillProgresses = async () => {
    const token = getToken();
    const userId = getUserIdFromToken();

    if (!userId) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/resume/resumeskills`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ userId }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSkillProgresses(data.data);
      } else {
        setErrorMessage("Failed to fetch skill progresses.");
      }
    } catch (error) {
      console.error("Error fetching skill progresses:", error);
      setErrorMessage("An error occurred while fetching skill progresses.");
    }
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
              Update Resume
            </h1>
            <p className="text-lg text-center text-gray-600 mb-6">
              Update your resume
            </p>

            {/* Upload Form */}
            <Card className="shadow-lg rounded-lg bg-white p-8">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold text-gray-700">
                  Upload Your Resume
                </CardTitle>
                <CardDescription className="text-gray-500"></CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label
                      htmlFor="resume"
                      className="text-gray-700 font-medium"
                    >
                      Resume
                    </Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="resume"
                        type="file"
                        onChange={handleFileChange}
                        className="flex-1 file:bg-blue-500 file:text-white file:px-4 file:py-2 file:rounded-md"
                      />
                      {file && (
                        <CheckCircle className="text-green-500 w-6 h-6" />
                      )}
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition duration-200 flex items-center justify-center"
                    disabled={loading}
                  >
                    {loading ? (
                      "Uploading..."
                    ) : (
                      <>
                        <Upload className="w-5 h-5 mr-2" />
                        Upload Resume
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Display Error Message */}
            {errorMessage && (
              <div className="text-red-500 text-center">{errorMessage}</div>
            )}

            {/* Resume Analysis */}
            {resumeAnalysis && (
              <Card className="shadow-lg rounded-lg bg-white p-8">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl font-bold text-gray-700">
                    Resume Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <h3 className="text-lg font-bold text-gray-700">Strengths</h3>
                  <ul className="list-disc list-inside">
                    {resumeAnalysis.strengths.map((strength, index) => (
                      <li key={index} className="text-gray-600">
                        {strength}
                      </li>
                    ))}
                  </ul>

                  <h3 className="text-lg font-bold text-gray-700 mt-4">
                    Weaknesses
                  </h3>
                  <ul className="list-disc list-inside">
                    {resumeAnalysis.weaknesses.map((weakness, index) => (
                      <li key={index} className="text-gray-600">
                        {weakness}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Skill Progress */}
            {skillProgresses && (
              <Card className="shadow-lg rounded-lg bg-white p-8">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl font-bold text-gray-700">
                    Skill Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc list-inside">
                    {skillProgresses.skills.map((skill, index) => (
                      <li key={index} className="text-gray-600">
                        {skill.skillName}: {skill.skillLevel}%
                      </li>
                    ))}
                  </ul>
                  <p className="text-gray-500 mt-4">
                    Evaluated At:{" "}
                    {new Date(skillProgresses.evaluatedAt).toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
