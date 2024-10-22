"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token') // Check for token in localStorage
    if (token) {
      router.replace('/resume') // Redirect to resume if token exists
    } else {
      router.replace('/login') // Redirect to login page if token does not exist
    }
  }, [router])

  return null // Do not render anything on this page
}
