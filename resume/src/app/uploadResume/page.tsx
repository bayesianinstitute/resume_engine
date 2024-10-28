"use client";

import React, { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Upload, CheckCircle, XCircle, Eye } from "lucide-react"; // Import Eye icon for view button
import Sidebar from "@/components/ui/sidebar";
import Modal from "@/components/ui/modal";

interface StrengthOrWeakness {
  point: string;
}

interface Skill {
  skillName: string;
  skillLevel: string;
}

interface Resume {
  resume: string; // Base64-encoded string of the PDF data
  strengths: Array<StrengthOrWeakness | string>;
  weaknesses: Array<StrengthOrWeakness | string>;
  skills: Skill[];
  uploadedAt: string;
}

const getToken = () => (typeof window !== "undefined" ? localStorage.getItem("token") || "" : "");

const getUserIdFromToken = () => {
  const token = getToken();
  if (token) {
    try {
      const decodedToken = jwtDecode(token) as { userId: string };
      return decodedToken?.userId;
    } catch (error) {
      console.error("Error decoding token:", error);
      return null;
    }
  }
  return null;
};

export default function ResumeViewer() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
    } else {
      fetchAllResumes();
    }
  }, [router]);

  const fetchAllResumes = async () => {
    const userId = getUserIdFromToken();
    if (!userId) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/resume/getAllResumes?userId=${userId}`,
        {
          headers: { Authorization: `Bearer ${getToken()}` },
        }
      );
      const data = await response.json();
      if (response.ok) {
        setResumes(data.data);
      } else {
        setErrorMessage("Failed to fetch resumes.");
      }
    } catch (error) {
      console.error("Error fetching resumes:", error);
      setErrorMessage("An error occurred while fetching resumes.");
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const token = getToken();
    const userId = getUserIdFromToken();

    if (!userId) {
      setErrorMessage("User not authenticated");
      return;
    }

    if (!file) {
      setErrorMessage("Please upload a resume.");
      return;
    }

    const formData = new FormData();
    formData.append("resume", file);
    formData.append("userId", userId);

    try {
      setLoading(true);
      setErrorMessage(null);

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
        throw new Error("Failed to upload and analyze resume.");
      }

      await fetchAllResumes();
      setFile(null);
    } catch (error) {
      console.error("Error:", error);
      setErrorMessage("An error occurred while uploading the resume.");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => setSelectedResume(null);

  const handleViewResume = () => {
    if (selectedResume && selectedResume.resume) {
      // Convert Base64 string to binary buffer
      console.log("selectedResume.resume",selectedResume.resume)
      const byteCharacters = atob(selectedResume.resume); // Decode Base64 string
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
  
      // Create a blob and URL for the PDF
      const blob = new Blob([byteArray], { type: "application/pdf" });
      const blobUrl = URL.createObjectURL(blob);
  
      // Open the PDF in a new tab
      window.open(blobUrl);
    }
  };
  

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-64">
        <div className="flex-1 p-6">
          <h1 className="text-4xl font-extrabold text-gray-800 text-center">Your Resumes</h1>

          <div className="max-w-lg mx-auto mt-12">
            <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-8">
              <Label htmlFor="resume" className="text-gray-700 font-medium">
                Upload Resume
              </Label>
              <div className="flex items-center mt-4">
                <Input
                  id="resume"
                  type="file"
                  onChange={handleFileChange}
                  className="flex-1 file:bg-blue-500 file:text-white file:px-4 file:py-2 file:rounded-md"
                />
                {file && <CheckCircle className="text-green-500 w-6 h-6 ml-2" />}
              </div>
              <Button
                type="submit"
                className="w-full mt-4 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition duration-200 flex items-center justify-center"
                disabled={loading}
              >
                {loading ? "Uploading..." : "Upload Resume"}
              </Button>
            </form>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-12 mx-auto max-w-5xl">
            {resumes.map((resume, index) => (
              <Card
                key={index}
                onClick={() => setSelectedResume(resume)}
                className="cursor-pointer shadow-lg rounded-lg p-4 hover:shadow-xl transition-transform duration-200"
              >
                <CardContent>
                  <CardTitle className="text-lg font-bold text-gray-800">Resume {index + 1}</CardTitle>
                  <p className="text-gray-500 text-sm mt-2">
                    Uploaded At: {new Date(resume.uploadedAt).toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {errorMessage && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mt-6 text-center">
              <p>{errorMessage}</p>
            </div>
          )}

          {selectedResume && (
            <Modal onClose={handleCloseModal}>
              <div className="bg-white p-8 rounded-lg shadow-lg">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-800">Resume Analysis</h2>
                  <XCircle onClick={handleCloseModal} className="w-6 h-6 text-gray-500 cursor-pointer" />
                </div>

                <div className="mt-4">
                  {selectedResume.strengths && selectedResume.strengths.length > 0 ? (
                    <div>
                      <h3 className="text-lg font-bold text-gray-700">Strengths</h3>
                      <ul className="list-disc list-inside">
                        {selectedResume.strengths.map((strength, index) => (
                          <li key={index} className="text-gray-600">
                            {strength && typeof strength === "object" && "point" in strength
                              ? strength.point
                              : strength || "No data available"}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p className="text-gray-600">No data available</p>
                  )}

                  {selectedResume.weaknesses && selectedResume.weaknesses.length > 0 ? (
                    <div className="mt-4">
                      <h3 className="text-lg font-bold text-gray-700">Weaknesses</h3>
                      <ul className="list-disc list-inside">
                        {selectedResume.weaknesses.map((weakness, index) => (
                          <li key={index} className="text-gray-600">
                            {weakness && typeof weakness === "object" && "point" in weakness
                              ? weakness.point
                              : weakness || "No data available"}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p className="text-gray-600 mt-4">No data available</p>
                  )}

                  <h3 className="text-lg font-bold text-gray-700 mt-4">Skills</h3>
                  <ul className="list-disc list-inside">
                    {selectedResume.skills.map((skill, index) => (
                      <li key={index} className="text-gray-600">
                        {skill.skillName}: {skill.skillLevel}%
                      </li>
                    ))}
                  </ul>

                  {/* View Resume Button */}
                  <Button
                    onClick={handleViewResume}
                    className="mt-6 bg-blue-500 text-white py-2 px-4 rounded-lg flex items-center"
                  >
                    <Eye className="w-5 h-5 mr-2" />
                    View Resume
                  </Button>
                </div>
              </div>
            </Modal>
          )}
        </div>
      </div>
    </div>
  );
}
