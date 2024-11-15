// app/components/AuthLayout.tsx
"use client"

import { setToken } from '@/lib/store/features/user/user'
import { AppDispatch, RootState } from '@/lib/store/store'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  const auth = useSelector((state: RootState) => state.auth)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const pathname = window.location.pathname // Get the current path

    // Skip redirection for reset password route
    if (pathname.startsWith('/reset-password/') || pathname.startsWith("/complete-signup/")) {
      return
    }


    if (!token) {
      router.replace('/login') // Redirect to login if token is missing
      return
    }

    // Set token in Redux store if not already present
    if (!auth.token) {
      dispatch(setToken(token))
    }
  }, [dispatch, auth.token, router])

  // Optionally, show a loading state while checking auth
  // if (!auth.token && !window.location.pathname.startsWith('/reset-password/')) {
  //   return <div>Loading...</div>
  // }

  return <>{children}</>
}
