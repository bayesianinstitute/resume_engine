"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  selectMatchResults,
  setMatchResults,
} from "@/lib/store/features/resume/matchSlice";
import { MatchResult, MatchResultResponse } from "@/types/matcher";
import { Label } from "@radix-ui/react-label";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { jwtDecode } from "jwt-decode";
import {
  CheckCircle2Icon,
  Download,
  FileTextIcon,
  InfoIcon,
  Link2Icon,
  RefreshCcw,
  Search,
  XCircleIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem } from "./ui/select";

import { AppDispatch, RootState } from "@/lib/store/store";
import { useDispatch } from "react-redux";
import { setJobDescription } from "@/lib/store/features/job/jobSlice";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { toast } from "react-toastify";

export function ResumeMatchResults() {
  const dispatch = useDispatch<AppDispatch>();
  const matchResults = useSelector(selectMatchResults);
  const [results, setResults] = useState<MatchResult[]>(matchResults);
  const [expandedRows, setExpandedRows] = useState<number[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [filterByFit, setFilterByFit] = useState<string>(""); // New filter state
  const [isLoading, setIsLoading] = useState(false); // New state for loading indicator
  const { jobs } = useSelector((state: RootState) => state.jobs);
  const router = useRouter();

  const API_BASE_URL =
    process.env.NEXT_PUBLIC_SOCKET_URL || "http://127.0.0.1:5001";

  useEffect(() => {
    // Sync local results with Redux store
    setResults(matchResults);
  }, [matchResults]);

  // Add this function to handle job description click
  const handleJobDescription = useCallback(
    (id: string) => {
      const job = jobs.find((job) => job._id === id); // Assuming `jobs` is an array with job objects
      if (!job) {
        console.error(`Job with ID ${id} not found`);
        return;
      }
      dispatch(setJobDescription(job.description)); // Set job description in Redux
      router.push("/interview"); // Redirect to interview preparation page
    },
    [dispatch, jobs, router]
  );

  const handleJobURL = useCallback(
    (id: string) => {
      const job = jobs.find((job) => job._id === id); // Assuming `jobs` is an array with job objects
      if (!job) {
        console.error(`Job with ID ${id} not found`);
        return;
      }
      if (!job.url) {
        console.log(`Job with No URL ${job._id}`);
        toast.success(`No URL is Found for job `)
        return;
      }
      window.open(job.url, "_blank"); // Open job URL in a new tab
    },
    [jobs]
  );

  const getToken = useCallback(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("token") || "";
    }
    return "";
  }, []); // No dependencies, this function is now stable

  const getUserIdFromToken = useCallback(() => {
    const token = getToken();
    if (token) {
      try {
        const decodedToken = jwtDecode<{ userId: string }>(token);
        return decodedToken?.userId || null;
      } catch (error) {
        console.error("Error decoding token:", error);
        return null;
      }
    }
    return null;
  }, [getToken]);

  const fetchResults = useCallback(async () => {
    setIsLoading(true); // Set loading state to true
    const userId = getUserIdFromToken();
    if (!userId) {
      console.error("User not authenticated.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/resume/getResumeMatchResults?userId=${userId}&filterByFit=all`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data: MatchResultResponse = await response.json();

      if (data.success) {
        setResults(data.results);
        dispatch(setMatchResults(data.results));
      } else {
        console.error("Failed to fetch results:", data.message);
      }
    } catch (error) {
      console.error("Error fetching results:", error);
    } finally {
      setIsLoading(false); // Reset loading state
    }
  }, [API_BASE_URL, getUserIdFromToken, dispatch]); // Only changes if API_BASE_URL changes

  useEffect(() => {
    fetchResults(); // Initial fetch on component mount
  }, [fetchResults]);

  const filteredResults = useMemo(() => {
    if (filterByFit === "good fit") {
      return results.filter((result) => !result.evaluationResponse.isfit);
    } else if (filterByFit === "not a fit") {
      return results.filter((result) => result.evaluationResponse.isfit);
    }
    return results;
  }, [results, filterByFit]);

  const columns: ColumnDef<MatchResult>[] = useMemo(
    () => [
      {
        accessorKey: "resumeName",
        header: "Resume",
        cell: ({ row }) => (
          <div className="flex items-center space-x-3">
            <FileTextIcon className="text-blue-500 w-5 h-5" />
            <span className="font-medium text-gray-800">
              {row.getValue("resumeName")}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "jobTitle",
        header: "Job Title",
        cell: ({ row }) => (
          <div className="text-sm text-gray-700 font-semibold">
            {row.getValue("jobTitle")}
          </div>
        ),
      },
      {
        accessorKey: "jobCompany",
        header: "Company",
        cell: ({ row }) => (
          <div className="text-sm text-gray-600">
            {row.getValue("jobCompany")}
          </div>
        ),
      },
      {
        accessorKey: "matchResult",
        header: "Match Result",
        cell: ({ row }) => {
          const isGoodFit = row.original.evaluationResponse.isfit;
          return (
            <Badge
              variant={isGoodFit ? "secondary" : "destructive"}
              className={`
                ${
                  isGoodFit
                    ? "bg-green-100 text-green-800 border-green-300"
                    : "bg-red-100 text-red-800 border-red-300"
                }
                flex items-center justify-center space-x-2 px-3 py-1 rounded-full
              `}
            >
              {isGoodFit ? (
                <CheckCircle2Icon className="w-4 h-4 mr-1" />
              ) : (
                <XCircleIcon className="w-4 h-4 mr-1" />
              )}
              {isGoodFit ? "Good Fit" : "Not a Fit"}
            </Badge>
          );
        },
      },
      {
        accessorKey: "compositeScore",
        header: "Match Score",
        cell: ({ row }) => {
          const compositeScore =
            row.original.evaluationResponse.compositeScore || 0;
          return (
            <div className="flex items-center space-x-3">
              <Progress
                value={compositeScore}
                className={cn(
                  "h-2",
                  compositeScore > 70
                    ? "bg-green-100"
                    : compositeScore > 40
                    ? "bg-yellow-100"
                    : "bg-red-100"
                )}
              />
              <span
                className={`
                text-sm font-medium 
                ${
                  compositeScore > 70
                    ? "text-green-600"
                    : compositeScore > 40
                    ? "text-yellow-600"
                    : "text-red-600"
                }
              `}
              >
                {compositeScore}%
              </span>
            </div>
          );
        },
      },
      {
        id: "details",
        header: "Details",
        cell: ({ row }) => {
          const index = row.index;
          return (
            <Button
              variant="outline"
              size="sm"
              className="text-blue-600 hover:bg-blue-50"
              onClick={() => toggleRow(index)}
            >
              <InfoIcon className="w-4 h-4 mr-2" />
              {expandedRows.includes(index) ? "Hide" : "Show"}
            </Button>
          );
        },
      },
      {
        id: "preparation",
        header: "Preparation",
        cell: ({ row }) => {
          const jobId = row.original.jobId;
          return (
            <Button
              variant="outline"
              size="sm"
              className="text-purple-600 hover:bg-purple-50"
              onClick={() => handleJobDescription(jobId)}
            >
              Prep Notes
            </Button>
          );
        },
      },
      {
        id: "View_Details",
        header: "Job URL",
        cell: ({ row }) => {
          const jobId = row.original.jobId;
          return (
            <Button
              variant="outline"
              size="sm"
              className="text-purple-600 hover:bg-purple-50"
              onClick={() => handleJobURL(jobId)}
            >
              <Link2Icon />
              URL
            </Button>
          );
        },
      },
    ],
    [expandedRows, handleJobDescription, handleJobURL]
  );

  const table = useReactTable({
    data: filteredResults, // Apply filter results here
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
  });

  const toggleRow = (index: number) => {
    setExpandedRows((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const downloadCSV = () => {
    const headers = [
      "Resume Name",
      "Job Title",
      "Company Name",
      "job_url",
      "Isfit",
      "Match Result",
      "compositeScore",
      "Relevance",
      "Skills",
      "Experience",
      "Presentation",
      "Recommendation",
    ];

    const csvContent = table.getFilteredRowModel().rows.map((row) => {
      const result = row.original;
      const cleanMatchResult = result.matchResult;

      const evaluation = result.evaluationResponse;

      const scores = evaluation.scores || {
        relevance: 0,
        skills: 0,
        experience: 0,
        presentation: 0,
      };
      // Find the corresponding job to get the URL
      const job = jobs.find((job) => job._id === result.jobId);
      const jobUrl = job?.url || ""; // Get job URL or empty string

      const csvRow = [
        result.resumeName || "",
        result.jobTitle || "",
        result.jobCompany || "",
        jobUrl,  // Add job URL to the CSV row
        evaluation.isfit || false,
        cleanMatchResult ? cleanMatchResult.replace(/,/g, ";") : "",
        evaluation.compositeScore || "",
        scores.relevance || "",
        scores.skills || "",
        scores.experience || "",
        scores.presentation || "",
        evaluation.recommendation
          ? evaluation.recommendation.replace(/,/g, ";")
          : "",
      ];

      return csvRow
        .map((field) =>
          typeof field === "string" ? `"${field.replace(/"/g, '""')}"` : field
        )
        .join(",");
    });

    const csv = [headers.join(","), ...csvContent].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "resume_match_results.csv");
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto mt-10">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
        <CardTitle>Resume Match Results</CardTitle>
        <div className="ml-auto">
          <Button onClick={fetchResults} variant="outline" disabled={isLoading}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            {isLoading ? "Loading..." : "Refresh Results"}
          </Button>
          <Button onClick={downloadCSV} className="ml-5">
            <Download className="mr-2 h-4 w-4" />
            Download CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search all columns..."
                value={globalFilter ?? ""}
                onChange={(e) => setGlobalFilter(String(e.target.value))}
                className="pl-8"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="fitFilter">Filter by fit:</Label>
              <Select
                onValueChange={(value) => setFilterByFit(value)}
                defaultValue=""
              >
                <SelectContent>
                  <SelectItem value="">All</SelectItem>
                  <SelectItem value="good fit">Not a Fit</SelectItem>
                  <SelectItem value="not a fit">Good Fit</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.map((row) => (
                  <>
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                    {expandedRows.includes(row.index) && (
                      <TableRow>
                        <TableCell colSpan={columns.length}>
                          <div className="p-4 bg-gray-50">
                            <h4 className="font-semibold mb-2">
                              Evaluation Details
                            </h4>
                            {(() => {
                              const result = row.original.evaluationResponse;

                              return (
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <p>
                                      <strong>Relevance:</strong>{" "}
                                      {result.scores.relevance}%
                                    </p>
                                    <p>
                                      <strong>Skills:</strong>{" "}
                                      {result.scores.skills}%
                                    </p>
                                  </div>
                                  <div>
                                    <p>
                                      <strong>Experience:</strong>{" "}
                                      {result.scores.experience}%
                                    </p>
                                    <p>
                                      <strong>Presentation:</strong>{" "}
                                      {result.scores.presentation}%
                                    </p>
                                  </div>
                                  <div className="col-span-2">
                                    <p>
                                      <strong>Recommendation:</strong>{" "}
                                      {result.recommendation}
                                    </p>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
