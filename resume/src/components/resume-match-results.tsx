"use client";

import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, ChevronDown, ChevronUp, Search } from "lucide-react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getFilteredRowModel,
  getSortedRowModel,
  SortingState,
} from "@tanstack/react-table";
import { Progress } from "@/components/ui/progress";
import { MatchResult } from "@/types/matcher";



export function ResumeMatchResults({ results }) {
  const [expandedRows, setExpandedRows] = useState<number[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const columns: ColumnDef<MatchResult>[] = useMemo(
    () => [
      {
        accessorKey: "resumeName",
        header: "Resume Names",
        cell: ({ row }) => (
          <div className="font-medium">{row.getValue("resumeName")}</div>
        ),
      },
      {
        accessorKey: "jobTitle",
        header: "Job Title",
      },
      {
        accessorKey:"jobCompany",
        header: "Company",
      },
      {
        accessorKey: "matchResult",
        header: "Match Result",
        cell: ({ row }) => {
          const isGoodFit = row.original.matchResult.includes("good fit");
          const score = isGoodFit
            ? parseInt(row.original.matchResult.match(/\d+/)[0])
            : 0;
          return (
            <div className="flex items-center space-x-2">
              <Badge
                variant={isGoodFit ? "secondary" : "destructive"}
                className={
                  isGoodFit
                    ? "bg-green-500 text-white hover:bg-green-300"
                    : "w-24 justify-center"
                }
              >
                {isGoodFit ? "Good Fit" : "Not a Fit"}
              </Badge>
            </div>
          );
        },
      },
      {
        accessorKey: "evaluationResponse",
        header: "Score(%)",
        cell: ({ row }) => {
          const evaluation =
            JSON.parse(row.original.evaluationResponse) || "Error";
          console.log("evaluation : ", evaluation);
          const compositeScore = evaluation.compositeScore || 0;
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
            <Button variant="ghost" size="sm" onClick={() => toggleRow(index)}>
              {expandedRows.includes(index) ? "Hide" : "Show"}
            </Button>
          );
        },
      },
    ],
    [expandedRows]
  );

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

  const downloadCSV = () => {
    const headers = [
      "Resume Name",
      "Job Title",
      "Company Name",
      "Match Result",
      "Composite Score",
      "Relevance",
      "Skills",
      "Experience",
      "Presentation",
      "Recommendation",
    ];
    const csvContent = table.getFilteredRowModel().rows.map((row) => {
      const result = row.original;
      let cleanMatchResult = result.matchResult;
      if (typeof cleanMatchResult === "string") {
        cleanMatchResult = cleanMatchResult.replace(/\n/g, " "); // Replace newlines with spaces
      }

      let evaluation = {};
      try {
        evaluation = JSON.parse(result.evaluationResponse);
        console.log("success evaluation", evaluation);
        console.log("evaluation recommandation", evaluation.recommendation);
      } catch (e) {
        // Handle cases where evaluationResponse is not valid JSON
        console.error("Error parsing evaluationResponse:", e);
      }
      // Use optional chaining to safely access nested properties
      return [
        result.resumeName,
        result.jobTitle,
        result.jobCompany,
        result.matchResult,
        evaluation.compositeScore || "",
        evaluation?.scores?.relevance || "",
        evaluation?.scores?.skills || "",
        evaluation?.scores?.experience || "",
        evaluation?.scores?.presentation || "",
        evaluation.recommendation || "",
      ].join(",");
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
        <CardTitle className="text-2xl self-center ali">
          Resume Match Results
        </CardTitle>
        <Button onClick={downloadCSV} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Download CSV
        </Button>
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
                onValueChange={(value) =>
                  table.getColumn("matchResult")?.setFilterValue(value)
                }
              >
                <SelectTrigger id="fitFilter" className="w-[180px]">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All</SelectItem>
                  <SelectItem value="good fit">Good Fit</SelectItem>
                  <SelectItem value="not a perfect fit">Not a Fit</SelectItem>
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
                        {header.isPlaceholder ? null : (
                          <div
                            {...{
                              className: header.column.getCanSort()
                                ? "cursor-pointer select-none"
                                : "",
                              onClick: header.column.getToggleSortingHandler(),
                            }}
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                            {{
                              asc: (
                                <ChevronUp className="ml-2 h-4 w-4 inline" />
                              ),
                              desc: (
                                <ChevronDown className="ml-2 h-4 w-4 inline" />
                              ),
                            }[header.column.getIsSorted() as string] ?? null}
                          </div>
                        )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.map((row) => (
                  <>
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                    >
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
                        <TableCell
                          colSpan={columns.length}
                          className="bg-muted/50"
                        >
                          <div className="p-4">
                            <h4 className="font-semibold mb-2">
                              Evaluation Details
                            </h4>
                            {(() => {
                              // Immediately Invoked Function Expression (IIFE)
                              try {
                                const evaluation = JSON.parse(
                                  row.original.evaluationResponse
                                ); // Try parsing
                                return (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <p>
                                        <strong>Composite Score:</strong>{" "}
                                        {evaluation.compositeScore}%
                                      </p>
                                      <p>
                                        <strong>Relevance:</strong>{" "}
                                        {evaluation?.scores?.relevance || ""}%
                                      </p>{" "}
                                      {/* Optional chaining */}
                                      <p>
                                        <strong>Skills:</strong>{" "}
                                        {evaluation?.scores?.skills || ""}%
                                      </p>{" "}
                                      {/* Optional chaining */}
                                    </div>
                                    <div className="space-y-2">
                                      <p>
                                        <strong>Experience:</strong>{" "}
                                        {evaluation?.scores?.experience || ""}%
                                      </p>{" "}
                                      {/* Optional chaining */}
                                      <p>
                                        <strong>Presentation:</strong>{" "}
                                        {evaluation?.scores?.presentation || ""}
                                        %
                                      </p>{" "}
                                      {/* Optional chaining */}
                                    </div>
                                    {evaluation.recommendation && (
                                      <div className="col-span-full">
                                        <p>
                                          <strong>Recommendation:</strong>{" "}
                                          {evaluation.recommendation}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                );
                              } catch (e) {
                                // Catch parsing errors
                                // Display the string if parsing fails
                                return <p>{row.original.evaluationResponse}</p>;
                              }
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
