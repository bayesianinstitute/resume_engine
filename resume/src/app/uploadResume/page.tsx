"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Sidebar from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DialogTrigger } from "@radix-ui/react-dialog";
import { Download, XCircle } from "lucide-react"; // Import Download icon
import React, { useCallback, useEffect, useState } from "react";
// import { SkeletonCard } from "@/components/ui/skeleton/resume";
import { Datanotfound } from "@/components/ui/skeleton/notfound";
import {
  fetchResumes,
  setLoading,
  setResumes,
  setSelectedResume,
} from "@/lib/store/features/resume/resumeSlice";
import { AppDispatch, RootState } from "@/lib/store/store";
import { Resume, ResumeApiResponse } from "@/types/resume";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";

import { resumeSteps } from "@/constant/tourdata";
import Tour from "@/components/Tour";
import { setToken } from "@/lib/store/features/user/user";
import { useRouter } from "next/navigation";

export default function ResumeViewer() {
  const [files, setFiles] = useState<File[]>([]);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [resumeToDelete, setResumeToDelete] = useState<Resume | null>(null);

  const dispatch = useDispatch<AppDispatch>();
  const auth = useSelector((state: RootState) => state.auth);

  const { resumes, selectedResume, loading } = useSelector(
    (state: RootState) => state.resume
  );

  useEffect(() => {
    if (auth.userId && auth.token) {
      dispatch(fetchResumes(auth.userId));
    } else {
      const token = localStorage.getItem("token");
      if (token) {
        dispatch(setToken(token));
      } else {
        console.error("Token is missing");
        // Show login modal
        router.push("/login");
      }
    }
  }, [auth.userId, auth.token, dispatch, router]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles(droppedFiles);
  }, []);

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(selectedFiles);
    }
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (files.length === 0) {
      toast.warning(`Please upload a resume select`);
      // dispatch(setErrorMessage("Please upload a resume."));
      return;
    }

    if (!auth.userId || !auth.token){
      toast.error("Please login to upload a resume.");
      router.push('/login');
      return;
    }

    const formData = new FormData();
    formData.append("resume", files[0]);
    formData.append("userId", auth.userId);

    try {
      dispatch(setLoading(true));
      // dispatch(setErrorMessage(null));
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/resume/stats`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${auth.token}`,
          },
          body: formData,
        }
      );

      const result: ResumeApiResponse = await response.json();
      if (result.success) {
        toast.success(result.message);
        dispatch(setResumes(result.data.resumes));
        setFiles([]);
        const fileInput = document.getElementById("file") as HTMLInputElement;
        if (fileInput) fileInput.value = ""; // Clear the input element
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("An error occurred while uploading the resume.");
      // dispatch(setErrorMessage());
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleCloseModal = () => dispatch(setSelectedResume(null));

  const handleDownloadResume = () => {
    if (selectedResume && selectedResume.resume) {
      // Assuming `resume` contains the relative path "uploads/resumes/fileName.pdf"
      const fileName = selectedResume.resume.split("/").pop(); // Get the file name only
      const baseurl = process.env.NEXT_PUBLIC_BASE_URL; // This will be 'http://127.0.0.1:5000/api/v1'

      if (!baseurl){
        return
      }

      const fileUrl = `${baseurl.split('/api/v1')[0]}/uploads/${fileName}`;

      // Download link to backend download API
      // const fileUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/uploads/view/${fileName}`;
      window.open(fileUrl, "_blank"); // Open the URL in a new tab to trigger download
    }
  };

  const handleDeleteResume = async (Resume: Resume) => {
    try {
      const userId = auth.userId;
      const resume=Resume.resume
      
      if (!userId || !resume) {
        console.error("User ID or Resume ID is missing");
        return;
      }
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/resume/`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${auth.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId, resume }),
        }
      );
      const result: ResumeApiResponse = await response.json();
      if (result.success) {
        toast.success(result.message);
        dispatch(setResumes(result.data.resumes));
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("An error occurred while deleting the resume.");
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Tour steps={resumeSteps} name="ResumeTourComplete" />
      <Sidebar />
      <div className="flex-1 ml-64 p-6">
        <h1 className="text-4xl font-extrabold text-gray-800 text-center">
          Manage Your Resumes
        </h1>

        <div className="flex mt-12">
          <div className="flex-1">
            <CardTitle className="text-xl font-bold text-gray-800 p-4">
              Your All Resume
            </CardTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mx-auto max-w-5xl">
              {resumes.length > 0 ? (
                resumes.map((resume) => (
                  <Card
                    key={resume._id}
                    className="cursor-pointer shadow-lg rounded-lg p-4 hover:shadow-xl transition-transform duration-200 relative"
                  >
                    <Dialog open={open} onOpenChange={setOpen}>
                      <DialogTrigger asChild>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <XCircle
                                className="delete-button w-6 h-6 text-gray-500 absolute top-2 right-2 cursor-pointer hover:text-red-500"
                                onClick={() => {
                                  setResumeToDelete(resume); // Set the selected resume ID
                                  setOpen(true);
                                }}
                              />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Delete Resume</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Delete Resume</DialogTitle>
                          <DialogDescription>
                            Are you sure you want to delete {resumeToDelete?.filename} file? This
                            action cannot be undone.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="sm:justify-start">
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            onClick={async () => {
                              if (resumeToDelete) {
                                await handleDeleteResume(resumeToDelete); // Pass the specific resume ID
                                setResumeToDelete(null); // Reset after deletion
                                setOpen(false); // Close the dialog
                              }
                            }}
                          >
                            Delete
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <CardContent
                            className="analyze-button"
                            onClick={() => dispatch(setSelectedResume(resume))}
                          >
                            <CardTitle className="text-lg font-bold text-gray-800 mt-4 mr-4 truncate">
                              {resume.filename}
                            </CardTitle>
                            <p className="text-gray-500 text-sm mt-2">
                              Uploaded At:{" "}
                              {new Date(resume.uploadedAt).toLocaleString()}
                            </p>
                          </CardContent>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>View Report</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Card>
                ))
              ) : (
                <Datanotfound msg="No Resume Found" />
              )}
            </div>

            {/* {errorMessage && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mt-6 text-center">
                <p>{errorMessage}</p>
              </div>
            )} */}
          </div>

          <div className="w-1/3 ml-6">
            <Card className="upload-section">
              <CardTitle className="text-xl font-bold text-gray-800 p-4">
                Upload New Resume
              </CardTitle>
              <CardContent className="p-6 space-y-4" id="upload-section">
                <div
                  className="border-2 border-dashed rounded-lg flex flex-col gap-1 p-6 items-center border-gray-200"
                  onDragOver={onDragOver}
                  onDrop={onDrop}
                >
                  <FileIcon className="w-12 h-12 text-gray-500" />
                  <span className="text-sm font-medium text-gray-500">
                    Drag and drop a file or click to browse
                  </span>
                  <span className="text-xs text-gray-500">
                    PDF, image, video, or audio
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <Label htmlFor="file" className="text-sm font-medium">
                    File
                  </Label>
                  <Input
                    id="file"
                    type="file"
                    onChange={onFileChange}
                    accept=".pdf"
                  />
                  {files.length > 0 && (
                    <div className="text-sm text-gray-500 mt-2">
                      Selected files:{" "}
                      {files.map((file) => file.name).join(", ")}
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  size="lg"
                  onClick={handleSubmit}
                  disabled={files.length === 0 || loading}
                >
                  {loading ? "Uploading..." : "Upload Resume"}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>

        {selectedResume && (
          <Dialog open={!!selectedResume} onOpenChange={handleCloseModal}>
            <DialogContent className=" max-w-lg mx-auto p-4 sm:p-6 md:p-8 max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Resume Analysis</DialogTitle>
              </DialogHeader>
              <DialogDescription>
                <div className="mt-4">
                  {selectedResume.strengths &&
                  selectedResume.strengths.length > 0 ? (
                    <div>
                      <h3 className="text-lg font-bold text-gray-700">
                        Strengths
                      </h3>
                      <ul className="list-disc list-inside">
                        {selectedResume.strengths.map((strength, index) => (
                          <li key={index} className="text-gray-600">
                            {typeof strength === "object" && "point" in strength
                              ? strength.point
                              : strength}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p className="text-gray-600">No data available</p>
                  )}

                  {selectedResume.weaknesses &&
                  selectedResume.weaknesses.length > 0 ? (
                    <div className="mt-4">
                      <h3 className="text-lg font-bold text-gray-700">
                        Weaknesses
                      </h3>
                      <ul className="list-disc list-inside">
                        {selectedResume.weaknesses.map((weakness, index) => (
                          <li key={index} className="text-gray-600">
                            {typeof weakness === "object" && "point" in weakness
                              ? weakness.point
                              : weakness}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p className="text-gray-600 mt-4">No data available</p>
                  )}

                  <h3 className="text-lg font-bold text-gray-700 mt-4">
                    Skills
                  </h3>
                  <ul className="list-disc list-inside">
                    {selectedResume.skills.map((skill, index) => (
                      <li key={index} className="text-gray-600">
                        {skill.skillName}: {skill.skillLevel}%
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={handleDownloadResume}
                    className="mt-6 bg-blue-500 text-white py-2 px-4 rounded-lg flex items-center"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    Download Resume
                  </Button>
                </div>
              </DialogDescription>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}

function FileIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
    </svg>
  );
}
