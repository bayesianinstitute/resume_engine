import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Loader2, BookOpen } from "lucide-react"
import { useDispatch } from "react-redux"
import { setJobDescription } from "@/lib/store/features/job/jobSlice"

interface JobDescriptionFormProps {
  jobDescription: string
  handleSubmit: (event: React.FormEvent) => void
  loading: boolean
}

export const JobDescriptionForm: React.FC<JobDescriptionFormProps> = ({ jobDescription, handleSubmit, loading }) => {
  const dispatch = useDispatch()

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Job Description Analysis</CardTitle>
        <CardDescription>
          Enter or edit the job description to receive customized interview preparation resources
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2 ">
            <Label htmlFor="jobDescription">Job Description</Label>
            <Textarea
              id="jobDescription"
              placeholder="Paste or edit the job description here..."
              value={jobDescription}
              onChange={(e) => dispatch(setJobDescription(e.target.value))}
              rows={5}
              className="h-[300px]"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <BookOpen className="w-5 h-5 mr-2" />
                Generate Preparation Resources
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export default JobDescriptionForm
