"use client";


import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useCallback, useEffect, useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

export function ResumeMatchResults() {
  const [results, setResults] = useState<MatchResult[]>([]);
  const [expandedRows, setExpandedRows] = useState<number[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [isLoading, setIsLoading] = useState(false); // New state for loading indicator

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:5000";


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
      const response = await fetch(`${API_BASE_URL}/api/v1/resume/getResumeMatchResults?userId=${userId}&filterByFit=all`, {
        headers: {
          "Content-Type": "application/json",
        },
      });
  
      const data = await response.json();
  
      if (data.success) {
        setResults(data.results);
      } else {
        console.error("Failed to fetch results:", data.message);
      }
    } catch (error) {
      console.error("Error fetching results:", error);
    } finally {
      setIsLoading(false); // Reset loading state
    }
  }, [API_BASE_URL]); // Only changes if API_BASE_URL changes

  useEffect(() => {
    fetchResults(); // Initial fetch on component mount
  }, [fetchResults]);

  const columns: ColumnDef<MatchResult>[] = useMemo(() => [
    {
      accessorKey: "resumeName",
      header: "Resume Names",
      cell: ({ row }) => <div className="font-medium">{row.getValue("resumeName")}</div>,
    },
    {
      accessorKey: "jobTitle",
      header: "Job Title",
    },
    {
      accessorKey: "company",
      header: "Company",
    },
    {
      accessorKey: "matchResult",
      header: "Match Result",
      cell: ({ row }) => {
        const isGoodFit = row.original.matchResult === "Good Fit";
        return (
          <Badge
            variant={isGoodFit ? "secondary" : "destructive"}
            className={isGoodFit ? "bg-green-500 text-white" : "w-24 justify-center"}
          >
            {isGoodFit ? "Good Fit" : "Not a Fit"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "compositeScore",
      header: "Score(%)",
      cell: ({ row }) => {
        const compositeScore = row.original.compositeScore || 0;
        return (
          <div className="flex items-center space-x-2">
            <Progress value={compositeScore} className="w-full" />
            <span className="text-sm font-medium">{compositeScore}%</span>
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const index = row.index;
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleRow(index)}
          >
            {expandedRows.includes(index) ? "Hide" : "Show"}
          </Button>
        );
      },
    },
  ], [expandedRows]);

  const table = useReactTable({
    data: results,
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

  return (
    <Card className="w-full max-w-4xl mx-auto mt-10">
      <CardHeader className="flex justify-between">
        <CardTitle>Resume Match Results</CardTitle>
        <Button onClick={fetchResults} disabled={isLoading}>
          {isLoading ? "Loading..." : "Refresh Results"}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {flexRender(header.column.columnDef.header, header.getContext())}
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
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                  {expandedRows.includes(row.index) && (
                    <TableRow>
                      <TableCell colSpan={columns.length}>
                        <div className="p-4 bg-gray-50">
                          <h4 className="font-semibold mb-2">Evaluation Details</h4>
                          {(() => {
                            const result = row.original;

                            return (
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p><strong>Relevance:</strong> {result.scores.relevance}%</p>
                                  <p><strong>Skills:</strong> {result.scores.skills}%</p>
                                </div>
                                <div>
                                  <p><strong>Experience:</strong> {result.scores.experience}%</p>
                                  <p><strong>Presentation:</strong> {result.scores.presentation}%</p>
                                </div>
                                <div className="col-span-2">
                                  <p><strong>Recommendation:</strong> {result.recommendation}</p>
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
      </CardContent>
    </Card>
  );
}
