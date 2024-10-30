// components/ResumeMatcher.tsx
"use client";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import Sidebar from "@/components/ui/sidebar";
import { Briefcase, Download, FileText, Link } from "lucide-react";
import { useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../lib/store/store";
import { toast } from "react-toastify";
import { ResumeMatchResults } from "@/components/resume-match-results";
import { MatchResult, MatchResultResponse } from "@/types/matcher";

export default function ResumeMatcher() {
    const [timeFilter, setTimeFilter] = useState("24h");
    const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
    const [selectAllJobs, setSelectAllJobs] = useState(false);
    const [results, setResults] = useState<MatchResult[]>([]); // State to store matching results
    const { resumes } = useSelector((state: RootState) => state.resume);
    const jobs = useSelector((state: RootState) => state.jobs.jobs);

    const filteredJobs = jobs.filter((job) => {
        const jobDate = new Date(job.datePosted);
        const now = new Date();
        switch (timeFilter) {
            case "24h":
                return now.getTime() - jobDate.getTime() <= 24 * 60 * 60 * 1000;
            case "week":
                return now.getTime() - jobDate.getTime() <= 7 * 24 * 60 * 60 * 1000;
            case "month":
                return now.getTime() - jobDate.getTime() <= 30 * 24 * 60 * 60 * 1000;
            default:
                return true;
        }
    });

    const toggleSelectAll = (checked: boolean) => {
        setSelectedJobs(checked ? resumes.map((r) => r.resume) : []);
    };

    const toggleSelectAllJobs = (checked: boolean) => {
        setSelectAllJobs(checked);
        setSelectedJobs(checked ? filteredJobs.map((job) => job._id) : []);
    };

    const toggleResume = (id: string) => {
        setSelectedJobs((prev) =>
            prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
        );
    };

    const toggleJob = (jobId: string) => {
        setSelectedJobs((prev) =>
            prev.includes(jobId)
                ? prev.filter((id) => id !== jobId)
                : [...prev, jobId]
        );
    };

    const handleMatch = async () => {
        console.log(selectedJobs)
        const resumeEntryIds = selectedJobs.filter((jobId) =>
            resumes.some((resume) => resume.resumeId === jobId)
        );
        const jobIds = selectedJobs.filter((jobId) =>
            filteredJobs.some((job) => job._id === jobId)
        );
    

        toast(`Job ${jobIds} and resume ${resumeEntryIds}`)
        
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/resume/matcher`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ resumeEntryIds, jobIds }),
            });

            if (!response.ok) {
                throw new Error("Network response was not ok");
            }

            const data:MatchResultResponse = await response.json();
            setResults(data.results); // Store the results in state
        } catch (error) {
            console.error("Error matching resumes:", error);
        }
    };

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />

            <div className="flex-1 ml-64 flex items-center justify-center">
                <div className="flex-1 p-6">
                    <Card className="w-full max-w-4xl mx-auto">
                        <CardHeader>
                            <CardTitle className="text-2xl self-center">
                                Job Matcher
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="selectAll"
                                        checked={selectedJobs.length === resumes.length}
                                        onCheckedChange={toggleSelectAll}
                                    />
                                    <Label
                                        htmlFor="selectAll"
                                        className="text-sm font-medium leading-none"
                                    >
                                        Select ALL Resumes
                                    </Label>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 ml-4">
                                    {resumes.map((resume) => (
                                        <div
                                            key={resume.resume}
                                            className="flex items-center space-x-2"
                                        >
                                            <Checkbox
                                                id={resume.resumeId}
                                                checked={selectedJobs.includes(resume.resumeId)}
                                                onCheckedChange={() => toggleResume(resume.resumeId)}
                                            />
                                            <Label
                                                htmlFor={resume.resumeId}
                                                className="text-sm leading-none flex items-center"
                                            >
                                                <FileText className="h-4 w-4 mr-2" />
                                                {resume.filename}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Time Filter</Label>
                                <RadioGroup
                                    value={timeFilter}
                                    onValueChange={setTimeFilter}
                                    className="flex space-x-4"
                                >
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="24h" id="24h" />
                                        <Label htmlFor="24h">Last 24 hours</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="week" id="week" />
                                        <Label htmlFor="week">Last week</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="month" id="month" />
                                        <Label htmlFor="month">Last month</Label>
                                    </div>
                                </RadioGroup>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-medium">
                                        Job Opportunities
                                    </Label>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="selectAllJobs"
                                            checked={selectAllJobs}
                                            onCheckedChange={toggleSelectAllJobs}
                                        />
                                        <Label
                                            htmlFor="selectAllJobs"
                                            className="text-sm font-medium"
                                        >
                                            Select ALL Jobs
                                        </Label>
                                    </div>
                                </div>
                                <ScrollArea className="h-[200px] w-full rounded-md border p-4">
                                    {filteredJobs.map((job, index) => (
                                        <div
                                            key={job._id}
                                            className="flex items-center space-x-2 mb-2"
                                        >
                                            <Checkbox
                                                id={`job-${index}`}
                                                checked={selectedJobs.includes(job._id)}
                                                onCheckedChange={() => toggleJob(job._id)}
                                            />
                                            <Label
                                                htmlFor={`job-${index}`}
                                                className="text-sm leading-none flex items-center"
                                            >
                                                <Briefcase className="h-4 w-4 mr-2" />
                                                {new Date(job.datePosted).toLocaleDateString()} -{" "}
                                                {job.company || "N/A"} - {job.title} -{" "}
                                                <a
                                                    href={job.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors duration-200 mr-3"
                                                >
                                                    <Link className="w-4 h-4 mr-2" />
                                                    View Details
                                                </a>
                                            </Label>
                                        </div>
                                    ))}
                                </ScrollArea>
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between">
                            <Button onClick={handleMatch}>Match</Button>

                        </CardFooter>
                    </Card>
                    

                    {/* Display Matching Results */}
                    <ResumeMatchResults results={results} />
                    {/* {results.length > 0 && (
                        <div className="mt-4">
                            <h2 className="text-lg font-semibold">Matching Results</h2>
                            <ul className="space-y-2">
                                {results.map((result, index) => (
                                    <li key={index} className="p-4 border rounded-md">
                                        <h3 className="font-medium">{result.jobId}</h3>
                                        <p>{result.matchResult}</p>
                                        <p className="text-sm text-gray-500">{result.evaluationResponse}</p>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )} */}
                </div>
            </div>
        </div>
    );
}
