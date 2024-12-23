"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { jwtDecode } from "jwt-decode";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Sidebar from "@/components/ui/sidebar";
import {
  Chart as ChartJS,
  ChartData,
  ChartOptions,
  BarController,
  PieController,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  BarController,
  PieController,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend
);

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
  shortlist: number;
  applied: number;
  interview: number;
  rejected: number;
}

const getToken = () =>
  typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";

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

const EmptyState = ({ message }: { message: string }) => (
  <div className="flex items-center justify-center h-full">
    <p className="text-gray-500 text-center">{message}</p>
  </div>
);

export default function Dashboard() {
  const [resumeAnalysis, setResumeAnalysis] = useState<ResumeAnalysis | null>(null);
  const [skillProgresses, setSkillProgresses] = useState<SkillProgress | null>(null);
  const [resumeStatus, setResumeStatus] = useState<ResumeStatus | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const skillChartRef = useRef<ChartJS<"bar", number[]> | null>(null);
  const statusChartRef = useRef<ChartJS<"pie", number[]> | null>(null);
  const router = useRouter();

  const fetchData = useCallback(async (endpoint: string) => {
    const token = getToken();
    const userId = getUserIdFromToken();
    if (!userId) return null;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/resume/${endpoint}`,
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
        return data.data;
      }
      throw new Error(`Failed to fetch ${endpoint}`);
    } catch (error) {
      console.error(`Error fetching ${endpoint}:`, error);
      setErrorMessage(`An error occurred while fetching ${endpoint}.`);
      return null;
    }
  }, []);

  const fetchResumeAnalysis = useCallback(async () => {
    const data = await fetchData("resumeanalysis");
    if (data) setResumeAnalysis(data);
  }, [fetchData]);

  const fetchSkillProgresses = useCallback(async () => {
    const data = await fetchData("resumeskills");
    if (data) setSkillProgresses(data);
  }, [fetchData]);

  const fetchResumeStatus = useCallback(async () => {
    const data = await fetchData("resumestatus");
    if (data) setResumeStatus(data);
  }, [fetchData]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login");
    } else {
      fetchResumeAnalysis();
      fetchSkillProgresses();
      fetchResumeStatus();
    }
  }, [router, fetchResumeAnalysis, fetchSkillProgresses, fetchResumeStatus]);

  const renderSkillChart = useCallback((skillProgresses: SkillProgress) => {
    const ctx = document.getElementById("skillsChart") as HTMLCanvasElement;
    if (skillChartRef.current) skillChartRef.current.destroy();

    if (ctx && skillProgresses) {
      const data: ChartData<"bar", number[]> = {
        labels: skillProgresses.skills.map((skill) => skill.skillName),
        datasets: [
          {
            label: "Skill Level (%)",
            data: skillProgresses.skills.map((skill) => skill.skillLevel),
            backgroundColor: "rgba(99, 102, 241, 0.5)",
            borderColor: "rgb(99, 102, 241)",
            borderWidth: 1,
          },
        ],
      };

      const options: ChartOptions<"bar"> = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
          },
        },
      };

      const config = {
        type: "bar" as const,
        data,
        options,
      };

      skillChartRef.current = new ChartJS(ctx, config);
    }
  }, []);

  const renderStatusChart = useCallback((resumeStatus: ResumeStatus) => {
    const ctx = document.getElementById("statusChart") as HTMLCanvasElement;
    if (statusChartRef.current) statusChartRef.current.destroy();

    if (ctx && resumeStatus) {
      const data: ChartData<"pie", number[]> = {
        labels: ["Shortlisted", "Applied", "Interview", "Rejected"],
        datasets: [
          {
            data: [
              resumeStatus.shortlist,
              resumeStatus.applied,
              resumeStatus.interview,
              resumeStatus.rejected,
            ],
            backgroundColor: [
              "rgba(34, 197, 94, 0.6)",
              "rgba(59, 130, 246, 0.6)",
              "rgba(234, 179, 8, 0.6)",
              "rgba(239, 68, 68, 0.6)",
            ],
            borderColor: [
              "rgb(34, 197, 94)",
              "rgb(59, 130, 246)",
              "rgb(234, 179, 8)",
              "rgb(239, 68, 68)",
            ],
            borderWidth: 1,
          },
        ],
      };

      const options: ChartOptions<"pie"> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "right" as const,
          },
        },
      };

      const config = {
        type: "pie" as const,
        data,
        options,
      };

      statusChartRef.current = new ChartJS(ctx, config);
    }
  }, []);

  useEffect(() => {
    if (skillProgresses) renderSkillChart(skillProgresses);
  }, [skillProgresses, renderSkillChart]);

  useEffect(() => {
    if (resumeStatus) renderStatusChart(resumeStatus);
  }, [resumeStatus, renderStatusChart]);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-64">
        <div className="flex-1 overflow-auto p-6">
          {errorMessage && (
            <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">
              {errorMessage}
            </div>
          )}
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Top row - Status Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Resume Status Chart */}
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-medium">
                    Application Status Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-64">
                  {resumeStatus ? (
                    <canvas id="statusChart" />
                  ) : (
                    <EmptyState message="Upload your resume to see application status" />
                  )}
                </CardContent>
              </Card>

              {/* Skills Progress Chart */}
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-medium">
                    Skills Assessment
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-64">
                  {skillProgresses ? (
                    <canvas id="skillsChart" />
                  ) : (
                    <EmptyState message="Upload your resume to see skills assessment" />
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Bottom row - Strengths and Weaknesses */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Strengths */}
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-medium">
                    Profile Strengths
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {resumeAnalysis?.strengths ? (
                    <ul className="space-y-2">
                      {resumeAnalysis.strengths.map((strength, index) => (
                        <li key={index} className="flex items-start">
                          <span className="inline-block w-2 h-2 mt-2 mr-2 bg-green-500 rounded-full" />
                          <span className="text-gray-700">{strength}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <EmptyState message="Upload your resume to see strengths analysis" />
                  )}
                </CardContent>
              </Card>

              {/* Weaknesses */}
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-medium">
                    Areas for Improvement
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {resumeAnalysis?.weaknesses ? (
                    <ul className="space-y-2">
                      {resumeAnalysis.weaknesses.map((weakness, index) => (
                        <li key={index} className="flex items-start">
                          <span className="inline-block w-2 h-2 mt-2 mr-2 bg-red-500 rounded-full" />
                          <span className="text-gray-700">{weakness}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <EmptyState message="Upload your resume to see improvement suggestions" />
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}