"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChartContainer } from "@/components/ui/chart";
import { Briefcase, FileText, TrendingUp, Users, CheckCircle2, XCircle } from 'lucide-react';
import Sidebar from "@/components/ui/sidebar";

// Sample data for the charts
const applicationStatusData = [
  { name: 'Applied', value: 30 },
  { name: 'Interview', value: 15 },
  { name: 'Offer', value: 5 },
  { name: 'Rejected', value: 10 },
];

const skillProgressData = [
  { name: 'Python', value: 80 },
  { name: 'React', value: 65 },
  { name: 'Data Analysis', value: 70 },
  { name: 'Machine Learning', value: 55 },
  { name: 'SQL', value: 75 },
];

const jobMatchesData = [
  { date: '2023-01', matches: 5 },
  { date: '2023-02', matches: 8 },
  { date: '2023-03', matches: 12 },
  { date: '2023-04', matches: 10 },
  { date: '2023-05', matches: 15 },
  { date: '2023-06', matches: 18 },
];

const interviewPerformanceData = [
  { category: 'Technical Skills', score: 4.2 },
  { category: 'Communication', score: 3.8 },
  { category: 'Problem Solving', score: 4.5 },
  { category: 'Cultural Fit', score: 4.0 },
  { category: 'Experience', score: 3.7 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token'); // Check for token in localStorage
    if (!token) {
      router.replace('/login'); // Redirect to login if no token is found
    } else {
      setLoading(false); // Token exists, stop loading and show the dashboard
    }
  }, [router]);

  if (loading) {
    return <p>Loading...</p>; // Show a loading state until authentication is verified
  }

  return (
    <div className="flex">
      <Sidebar />
      
      <div className="flex-1 p-4 bg-gray-100">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <Button>Update Profile</Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Application Status Card */}
            <Card>
              <CardHeader>
                <CardTitle>Application Status</CardTitle>
                <CardDescription>Overview of your job applications</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={applicationStatusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {applicationStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Skill Progress Card */}
            <Card>
              <CardHeader>
                <CardTitle>Skill Progress</CardTitle>
                <CardDescription>Your skill development over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={skillProgressData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Bar dataKey="value" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Job Matches Card */}
            <Card>
              <CardHeader>
                <CardTitle>Job Matches</CardTitle>
                <CardDescription>Number of job matches per month</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={jobMatchesData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Line type="monotone" dataKey="matches" stroke="#8884d8" />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Interview Performance Card */}
            <Card>
              <CardHeader>
                <CardTitle>Interview Performance</CardTitle>
                <CardDescription>Your average scores in different areas</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={interviewPerformanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" />
                      <YAxis />
                      <Bar dataKey="score" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Resume Strength Card */}
            <Card>
              <CardHeader>
                <CardTitle>Resume Strength</CardTitle>
                <CardDescription>AI-powered resume analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Overall Strength</span>
                    <span className="text-sm font-medium">85%</span>
                  </div>
                  <Progress value={85} className="w-full" />
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mr-2" />
                      <span className="text-sm">Strong skills section</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mr-2" />
                      <span className="text-sm">Clear work experience</span>
                    </div>
                    <div className="flex items-center">
                      <XCircle className="w-4 h-4 text-red-500 mr-2" />
                      <span className="text-sm">Missing quantifiable achievements</span>
                    </div>
                  </div>
                  <Button className="w-full">Improve Resume</Button>
                </div>
              </CardContent>
            </Card>

            {/* Job Search Activity Card */}
            <Card>
              <CardHeader>
                <CardTitle>Job Search Activity</CardTitle>
                <CardDescription>Your recent job search actions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Briefcase className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">Applied to Senior Developer at TechCorp</span>
                    <span className="text-xs text-gray-500">2h ago</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Updated resume</span>
                    <span className="text-xs text-gray-500">1d ago</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-purple-500" />
                    <span className="text-sm">Networking event attended</span>
                    <span className="text-xs text-gray-500">3d ago</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-orange-500" />
                    <span className="text-sm">Completed &quot;Advanced React&quot; course</span>
                    <span className="text-xs text-gray-500">1w ago</span>
                  </div>
                  <Button className="w-full">View All Activity</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
