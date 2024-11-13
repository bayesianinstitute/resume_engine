"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/lib/store/store';
import { setToken } from '@/lib/store/features/user/user';

export default function Home() {
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>();


  useEffect(() => {
    const token = localStorage.getItem('token') // Check for token in localStorage
    if (token) {
      dispatch(setToken(token))

      router.replace('/uploadResume') // Redirect to resume if token exists
    } else {
      router.replace('/login') // Redirect to login page if token does not exist
    }
  }, [router,dispatch])

  return null // Do not render anything on this page
}
