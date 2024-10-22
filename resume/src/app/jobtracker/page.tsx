"use client";

import React, { useState,useEffect  } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import Sidebar from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

// Define the custom JWT payload type
interface CustomJwtPayload {
  userId: string;
}

// Job Interface
interface Job {
  id: string;
  title: string;
  company: string;
  status: 'shortlist' | 'applied' | 'interview' | 'rejected';
}

// Helper functions for getting and decoding token
const getToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token') || '';
  }
  return ''; // Return an empty string if not in the browser
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

// SWR fetcher function
const fetcher = (url: string) => fetch(url, {
  headers: { 'Authorization': `Bearer ${getToken()}` }
}).then(res => res.json());

// JobCard Component
function JobCard({ job, onUpdateJob, onDeleteJob }: { job: Job, onUpdateJob: (id: string, newStatus: Job['status']) => void, onDeleteJob: (id: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<Job['status']>(job.status);

  const handleUpdate = () => {
    if (job.id) {
      onUpdateJob(job.id, newStatus);
    } else {
      console.error("Job ID is undefined");
    }
    setIsOpen(false);
  };

  const handleDelete = () => {
    if (job.id) {
      onDeleteJob(job.id);
    } else {
      console.error("Job ID is undefined");
    }
    setIsOpen(false);
  };

  return (
    <>
      <div onClick={() => setIsOpen(true)} className="shadow cursor-pointer p-4 rounded-md bg-white">
        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-lg">{job.title}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-sm text-gray-600">{job.company}</p>
            <p className="text-sm text-gray-500">Status: {job.status}</p>
          </CardContent>
        </Card>
      </div>

      {isOpen && (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Job</DialogTitle>
              <DialogDescription>Choose an action for this job</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {/* Update Status */}
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as Job['status'])}
                className="w-full p-2 border rounded"
              >
                <option value="">None</option>
                <option value="shortlist">Shortlist</option>
                <option value="applied">Applied</option>
                <option value="interview">Interview</option>
                <option value="rejected">Rejected</option>
              </select>
              <Button onClick={handleUpdate}>Update Status</Button>

              {/* Delete Job */}
              <Button className="bg-red-600 text-white hover:bg-red-700" onClick={handleDelete}>
                Delete Job
              </Button>
            </div>
            <div className="space-y-4">
              <Button className="mt-4 bg-gray-100 text-gray-700" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

// Job Creation Modal
function CreateJobModal({ onCreateJob }: { onCreateJob: (newJob: Job) => void }) {
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [status, setStatus] = useState<Job['status']>('applied');
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = async () => {
    const token = getToken();
    const userId = getUserIdFromToken();

    if (title && company && status && userId) {
      const newJob = { title, company, status, userId };

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/resume/jobtracker`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(newJob),
        });

        if (response.ok) {
          const createdJob = await response.json();
          onCreateJob(createdJob);
          setTitle('');
          setCompany('');
          setStatus('applied');
          setIsOpen(false);
        } else {
          console.error('Failed to create job, Status:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('Error creating job:', error);
      }
    } else {
      console.error('Invalid job data or user ID');
    }
  };

  return (
    <>
      <Button className="mb-4" onClick={() => setIsOpen(true)}>Add New Job</Button>
      {isOpen && (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Job</DialogTitle>
              <DialogDescription>Fill in the details to add a new job to the tracker.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Input 
                placeholder="Job Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <Input 
                placeholder="Company Name"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Job['status'])}
                className="w-full p-2 border rounded"
              >
                <option value="shortlist">Shortlist</option>
                <option value="applied">Applied</option>
                <option value="interview">Interview</option>
                <option value="rejected">Rejected</option>
              </select>
              <Button onClick={handleSubmit}>Create Job</Button>
            </div>
            <Button className="mt-4 bg-gray-100 text-gray-700" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

// Main JobTracker Component
export default function JobTracker() {
  const router = useRouter(); 
  const userId = getUserIdFromToken();

  // Redirect to login if no token is found
  useEffect(() => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.replace('/login'); // Redirect to login if no token is found
      }
  }, [router]);
  
  // Use SWR for fetching jobs with default fallback to an empty array
  const { data: jobsData = [], mutate } = useSWR(
    `${process.env.NEXT_PUBLIC_BASE_URL}/resume/jobtracker?userId=${userId}`,
    fetcher
  );

  // Ensure jobsData is always an array (fallback to empty array if not)
  const jobs = Array.isArray(jobsData) ? jobsData : [];

  // Log the jobs data to ensure they have an id field
  console.log("Fetched jobs:", jobs);

  // If the backend returns _id instead of id, map _id to id
  const normalizedJobs = jobs.map((job) => {
    return { ...job, id: job.id || job._id };
  });

  // Update job status
  const handleUpdateJob = async (id: string, newStatus: Job['status']) => {
    const token = getToken();
    
    if (!id) {
      console.error("Job ID is undefined");
      return;
    }

    // Optimistically update the job status in the UI
    const updatedJobs = normalizedJobs.map(job => job.id === id ? { ...job, status: newStatus } : job);
    mutate(updatedJobs, false); // Update UI immediately

    // Update the job status on the server
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/resume/jobtracker/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        console.error('Failed to update job status, Status:', response.status, response.statusText);
        mutate(); // Revalidate jobs
      } else {
        mutate(); // Revalidate jobs after the update
      }
    } catch (error) {
      console.error('Error updating job status:', error);
      mutate(); // Revalidate jobs
    }
  };

  // Delete job
  const handleDeleteJob = async (id: string) => {
    const token = getToken();
    
    if (!id) {
      console.error("Job ID is undefined");
      return;
    }

    // Optimistically remove the job from the UI
    const updatedJobs = normalizedJobs.filter(job => job.id !== id);
    mutate(updatedJobs, false); // Update UI immediately

    // Delete the job on the server
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/resume/jobtracker/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.error('Failed to delete job, Status:', response.status, response.statusText);
        mutate(); // Revalidate jobs
      } else {
        mutate(); // Revalidate jobs after the delete
      }
    } catch (error) {
      console.error('Error deleting job:', error);
      mutate(); // Revalidate jobs
    }
  };

  const handleCreateJob = (newJob: Job) => {
    mutate([...normalizedJobs, newJob], false); // Optimistically add new job to the list
  };

  const filteredJobs = (status: Job['status']) => {
    if (Array.isArray(normalizedJobs)) {
      return normalizedJobs.filter((job) => job.status === status);
    }
    return []; // Return empty array if jobs is not an array
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-col flex-1 p-6">
        <h1 className="text-3xl font-bold mb-6">Job Application Tracker</h1>

        <CreateJobModal onCreateJob={handleCreateJob} />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatusColumn status="shortlist" jobs={filteredJobs('shortlist')} onUpdateJob={handleUpdateJob} onDeleteJob={handleDeleteJob} />
          <StatusColumn status="applied" jobs={filteredJobs('applied')} onUpdateJob={handleUpdateJob} onDeleteJob={handleDeleteJob} />
          <StatusColumn status="interview" jobs={filteredJobs('interview')} onUpdateJob={handleUpdateJob} onDeleteJob={handleDeleteJob} />
          <StatusColumn status="rejected" jobs={filteredJobs('rejected')} onUpdateJob={handleUpdateJob} onDeleteJob={handleDeleteJob} />
        </div>
      </div>
    </div>
  );
}

// StatusColumn Component
function StatusColumn({ status, jobs, onUpdateJob, onDeleteJob }: { status: Job['status'], jobs: Job[], onUpdateJob: (id: string, newStatus: Job['status']) => void, onDeleteJob: (id: string) => void }) {
  return (
    <div className="p-4 rounded-lg shadow-md bg-gray-100">
      <h2 className="text-xl font-bold mb-4 capitalize">{status}</h2>
      {jobs.length > 0 ? (
        jobs.map((job) => <JobCard key={job.id} job={job} onUpdateJob={onUpdateJob} onDeleteJob={onDeleteJob} />)
      ) : (
        <p className="text-gray-500">No jobs in this status.</p>
      )}
    </div>
  );
}
