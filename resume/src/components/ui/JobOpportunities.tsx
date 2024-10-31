import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from '@radix-ui/react-label'
import { Briefcase, Link } from 'lucide-react'
interface Job {
    _id: string
    title: string
    description: string
    company?: string
    datePosted: string
    url: string
  }
  
  interface JobOpportunitiesProps {
    jobs: Job[]
    selectedJob: string | null
    handleJobSelect: (jobId: string) => void
  }
export const JobOpportunities = ({jobs,selectedJob,handleJobSelect}:JobOpportunitiesProps) => {
  return (
    <Card className="shadow-lg">
    <CardHeader>
      <CardTitle>Job Opportunities</CardTitle>
      <CardDescription>Select a job or enter a custom description</CardDescription>
    </CardHeader>
    <CardContent>
      <ScrollArea className="h-[200px] w-full rounded-md border p-4">
        {jobs.map((job, index) => (
          <div key={job._id} className="flex items-center space-x-2 mb-2">
            <Checkbox
              id={`job-${index}`}
              checked={selectedJob === job._id}
              onCheckedChange={() => handleJobSelect(job._id)}
            />
            <Label
              htmlFor={`job-${index}`}
              className="text-sm leading-none flex items-center cursor-pointer"
            >
              <Briefcase className="h-4 w-4 mr-2" />
              <span className="font-medium">{job.title}</span>
              <span className="mx-2 text-gray-400">|</span>
              <span className="text-gray-600">{job.company || "N/A"}</span>
              <span className="mx-2 text-gray-400">|</span>
              <span className="text-gray-500 text-xs">{new Date(job.datePosted).toLocaleDateString()}</span>
              <a
                href={job.url}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors duration-200"
                onClick={(e) => e.stopPropagation()}
              >
                <Link className="w-4 h-4 mr-1" />
                View
              </a>
            </Label>
          </div>
        ))}
      </ScrollArea>
    </CardContent>
  </Card>
  )
}
