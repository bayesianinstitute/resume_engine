"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Upload, FileText, CheckCircle } from 'lucide-react'
import Sidebar from "@/components/ui/sidebar"

export default function ResumeMatcher() {
  const [file, setFile] = useState<File | null>(null)
  // const { jobDescription, prepResources, loading } = useSelector((state:RootState) => state.jobDescription);

  const [jobDescription, setJobDescription] = useState('')
  const [matchResult, setMatchResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // Check if the user is authenticated
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      // If no token, redirect to login page
      router.replace('/login')
    }
  }, [router])

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0])
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!file || !jobDescription) {
      alert("Please upload a resume and enter a job description.");
      return;
    }
  
    const formData = new FormData();
    formData.append('resume', file);
    formData.append('jobDescription', jobDescription);
  
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/resume/matcher`, {
        method: 'POST',
        body: formData,
      });
  
      if (!response.ok) {
        throw new Error("Failed to match resume with job description.");
      }
  
      const data = await response.json();
      let result = `${data.matchResult} \n ${data.evaluationResponse}`;
      
      // Deduplication: Remove any repeated lines in the result
      result = result.split('\n')
        .filter((line, index, self) => index === self.findIndex((t) => t.trim() === line.trim()))
        .join('\n');
  
      setMatchResult(`Score: ${result}`);
    } catch (error) {
      console.error('Error:', error);
      setMatchResult("An error occurred while matching the resume.");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <div className="flex-1 ml-64">

      <div className="flex-1 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Logo */}
          <div className="flex justify-center mb-8"></div>

          {/* Title */}
          <h1 className="text-4xl font-extrabold text-gray-800 text-center">Resume Matcher</h1>
          <p className="text-lg text-center text-gray-600 mb-6">Upload your resume and job description to get a compatibility score</p>

          {/* Upload Form */}
          <Card className="shadow-lg rounded-lg bg-white p-8">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-gray-700">Upload Your Resume</CardTitle>
              <CardDescription className="text-gray-500">
                See how well your resume matches the job description.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="resume" className="text-gray-700 font-medium">Resume</Label>
                  <div className="flex items-center space-x-2">
                    <Input 
                      id="resume" 
                      type="file" 
                      onChange={handleFileChange} 
                      className="flex-1 file:bg-blue-500 file:text-white file:px-4 file:py-2 file:rounded-md"
                    />
                    {file && <CheckCircle className="text-green-500 w-6 h-6" />}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="jobDescription" className="text-gray-700 font-medium">Job Description</Label>
                  <Textarea
                    id="jobDescription"
                    placeholder="Paste the job description here..."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    rows={5}
                    className="w-full border-gray-300 rounded-md focus:ring focus:ring-blue-200 focus:border-blue-400"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition duration-200 flex items-center justify-center"
                  disabled={loading}
                >
                  {loading ? "Matching..." : (
                    <>
                      <Upload className="w-5 h-5 mr-2" />
                      Match Resume
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Match Result */}
          {matchResult && (
            <Card className="shadow-lg rounded-lg bg-white p-8">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold text-gray-700">Match Result</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg text-gray-800 font-semibold whitespace-pre-line">
                  <FileText className="w-6 h-6 mr-2 text-blue-500 inline" />
                  {matchResult}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
    </div>
  )
}
