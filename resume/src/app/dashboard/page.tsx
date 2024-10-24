"use client";

import React, { useState, useEffect, useRef } from "react";
import { jwtDecode } from "jwt-decode";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Sidebar from "@/components/ui/sidebar";
import { Chart, BarController, BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend } from 'chart.js'; // Import Chart.js and required components

// Register Chart.js components
Chart.register(BarController, BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend);

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

interface ResumeStatus {
  status: string;
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

export default function Dashboard() {
  const [resumeAnalysis, setResumeAnalysis] = useState<ResumeAnalysis | null>(null);
  const [skillProgresses, setSkillProgresses] = useState<SkillProgress | null>(null);
  const [resumeStatus, setResumeStatus] = useState<ResumeStatus | null>(null); // New state for resume status
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const chartRef = useRef<Chart | null>(null); // Ref to track the chart instance
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
      fetchResumeStatus(); // Call the new API
    }
  }, [router]);

  const fetchResumeAnalysis = async () => {
    const token = getToken();
    const userId = getUserIdFromToken();

    if (!userId) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/resume/resumeanalysis`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId }),
      });

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

  const fetchSkillProgresses = async () => {
    const token = getToken();
    const userId = getUserIdFromToken();

    if (!userId) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/resume/resumeskills`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId }),
      });

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

  const fetchResumeStatus = async () => {
    const token = getToken();
    const userId = getUserIdFromToken();

    if (!userId) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/resume/resumestatus`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        const data = await response.json();
        setResumeStatus(data.data); // Set resume status
      } else {
        setErrorMessage("Failed to fetch resume status.");
      }
    } catch (error) {
      console.error("Error fetching resume status:", error);
      setErrorMessage("An error occurred while fetching resume status.");
    }
  };

  // Function to render chart using Chart.js
  const renderChart = (skillProgresses: SkillProgress) => {
    const ctx = document.getElementById('skillsChart') as HTMLCanvasElement;

    // Destroy the previous chart if it exists
    if (chartRef.current) {
      chartRef.current.destroy();
    }

    // Create new chart instance and save to ref
    if (ctx && skillProgresses) {
      chartRef.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: skillProgresses.skills.map((skill) => skill.skillName),
          datasets: [
            {
              label: 'Skill Level (%)',
              data: skillProgresses.skills.map((skill) => skill.skillLevel),
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              borderColor: 'rgba(75, 192, 192, 1)',
              borderWidth: 1,
            },
          ],
        },
        options: {
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
            },
          },
        },
      });
    }
  };

  useEffect(() => {
    if (skillProgresses) {
      renderChart(skillProgresses);
    }
  }, [skillProgresses]);

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <div className="flex-1 p-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
          <h1 className="text-4xl font-extrabold text-gray-800 col-span-2 text-center mb-8">Dashboard</h1>

          {/* Error Message */}
          {errorMessage && <div className="text-red-500 text-center col-span-2">{errorMessage}</div>}

          {/* Strengths Card */}
          <Card className="shadow-lg rounded-lg bg-white p-8">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-gray-700">Strengths</CardTitle>
            </CardHeader>
            <CardContent>
              {resumeAnalysis ? (
                <ul className="list-disc list-inside">
                  {resumeAnalysis.strengths.map((strength, index) => (
                    <li key={index} className="text-gray-600">
                      {strength}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-600 text-center">Please upload a resume to see the strengths.</p>
              )}
            </CardContent>
          </Card>

          {/* Weaknesses Card */}
          <Card className="shadow-lg rounded-lg bg-white p-8">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-gray-700">Weaknesses</CardTitle>
            </CardHeader>
            <CardContent>
              {resumeAnalysis ? (
                <ul className="list-disc list-inside">
                  {resumeAnalysis.weaknesses.map((weakness, index) => (
                    <li key={index} className="text-gray-600">
                      {weakness}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-600 text-center">Please upload a resume to see the weaknesses.</p>
              )}
            </CardContent>
          </Card>

          {/* Skill Progress Card */}
          <Card className="shadow-lg rounded-lg bg-white p-8 col-span-2">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-gray-700">Skill Progress</CardTitle>
            </CardHeader>
            <CardContent>
              {skillProgresses ? (
                <>
                  <p className="text-gray-500 mt-4 text-center">
                    Evaluated At: {new Date(skillProgresses.evaluatedAt).toLocaleString()}
                  </p>
                  {/* Chart for skill progress */}
                  <canvas id="skillsChart"></canvas>
                </>
              ) : (
                <p className="text-gray-600 text-center">Please upload a resume to see the skill progress.</p>
              )}
            </CardContent>
          </Card>

          {/* Resume Status Card */}
          <Card className="shadow-lg rounded-lg bg-white p-8 col-span-2">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-gray-700">Resume Status</CardTitle>
            </CardHeader>
            <CardContent>
              {resumeStatus ? (
                <p className="text-gray-600 text-center">Status: {resumeStatus.status}</p>
              ) : (
                <p className="text-gray-600 text-center">Please upload a resume to see the status.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
