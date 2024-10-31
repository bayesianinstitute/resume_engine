// app/components/AuthLayout.tsx
"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '@/lib/store/store'
import { fetchJobs } from '@/lib/store/features/job/jobSearch'
import { fetchResumes } from '@/lib/store/features/resume/resumeSlice'
import { setToken } from '@/lib/store/features/user/user'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  const auth = useSelector((state: RootState) => state.auth)
  const jobs = useSelector((state: RootState) => state.jobs)
  const resumes = useSelector((state: RootState) => state.resume)

  useEffect(() => {
    const token = localStorage.getItem('token')
    
    if (!token) {
      router.replace('/login')
      return
    }

    // Set token if not already in store
    if (!auth.token) {
      dispatch(setToken(token))
    }

    // Fetch jobs if not already in store
    if (!jobs.jobs.length) {
      dispatch(fetchJobs({ page: 1, limit: 10 }))
    }

    // Fetch resumes if not already in store
    if (!resumes.resumes?.length && auth.userId) {
      dispatch(fetchResumes(auth.userId))
    }
  }, [dispatch, auth.token, auth.userId, jobs.jobs, resumes.resumes, router])

  // Show loading state while checking auth
//   if (!auth.token) {
//     return <div>Loading...</div>
//   }

  return <>{children}</>
}
