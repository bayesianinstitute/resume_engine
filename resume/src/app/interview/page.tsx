"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Loader2, BookOpen, List, MessageSquare } from 'lucide-react'
import Sidebar from "@/components/ui/sidebar"

interface PrepResource {
  title: string
  content: string
  type: 'topic' | 'question' | 'tip'
}

export default function InterviewPreparation() {
  const [jobDescription, setJobDescription] = useState('')
  const [prepResources, setPrepResources] = useState<PrepResource[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // Check for authentication
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.replace('/login') // Redirect to login if no token is found
    }
  }, [router])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    
    if (!jobDescription) {
      alert("Please enter a job description.")
      return
    }

    try {
      setLoading(true)

      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/resume/preparation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jobDescription }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate interview preparation resources.")
      }

      const data = await response.json()
      console.log(data)
      const prepResources: PrepResource[] = parsePreparationResources(data.preparationResources)
      
      setPrepResources(prepResources)
    } catch (error) {
      console.error('Error:', error)
      alert("An error occurred while generating interview preparation resources.")
    } finally {
      setLoading(false)
    }
  }

  function parsePreparationResources(text: string): PrepResource[] {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line)
    const resources: PrepResource[] = []
    
    let currentType: 'topic' | 'question' | 'tip' | null = null
    let buffer: string[] = []
    let currentTitle: string = ''
  
    lines.forEach(line => {
      if (line.startsWith('**Key Skills:**')) {
        if (buffer.length && currentType) {
          resources.push({
            title: currentTitle,
            content: buffer.join('\n'),
            type: currentType,
          })
        }
        currentType = 'topic'
        currentTitle = 'Key Skills'
        buffer = []
      } else if (line.startsWith('**Interview Questions:**')) {
        if (buffer.length && currentType) {
          resources.push({
            title: currentTitle,
            content: buffer.join('\n'),
            type: currentType,
          })
        }
        currentType = 'question'
        currentTitle = 'Interview Questions'
        buffer = []
      } else if (line.startsWith('**Preparation Tips:**')) {
        if (buffer.length && currentType) {
          resources.push({
            title: currentTitle,
            content: buffer.join('\n'),
            type: currentType,
          })
        }
        currentType = 'tip'
        currentTitle = 'Preparation Tips'
        buffer = []
      } else {
        buffer.push(line)
      }
    })
  
    // Push the final content if any
    if (buffer.length && currentType) {
      resources.push({
        title: currentTitle,
        content: buffer.join('\n'),
        type: currentType,
      })
    }
  
    return resources
  }
  

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <h1 className="text-4xl font-extrabold text-gray-800 text-center">Interview Preparation</h1>
          <p className="text-lg text-center text-gray-600 mb-6">Get tailored interview preparation resources based on the job description</p>

          <Card className="shadow-lg rounded-lg bg-white p-8">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-gray-700">Job Description Analysis</CardTitle>
              <CardDescription className="text-gray-500">
                Enter the job description to receive customized interview preparation resources.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
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

          {prepResources.length > 0 && (
            <Card className="shadow-lg rounded-lg bg-white p-8">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold text-gray-700">Interview Preparation Resources</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {prepResources.map((resource, index) => (
                    <div key={index} className="border-b border-gray-200 pb-4 last:border-b-0">
                      <h3 className="text-xl font-semibold text-gray-800 mb-2 flex items-center">
                        {resource.type === 'topic' && <List className="w-5 h-5 mr-2 text-blue-500" />}
                        {resource.type === 'question' && <MessageSquare className="w-5 h-5 mr-2 text-green-500" />}
                        {resource.type === 'tip' && <BookOpen className="w-5 h-5 mr-2 text-yellow-500" />}
                        {resource.title}
                      </h3>
                      
                      <div className="text-gray-600 space-y-2">
                        {resource.content.split('\n').map((item, i) => (
                          <p key={i}>{item.trim()}</p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
