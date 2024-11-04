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
    
    if (!token) {
      router.replace('/login')
      return
    }

    // Set token if not already in store
    if (!auth.token) {
      dispatch(setToken(token))
    }


  }, [dispatch, auth.token, auth.userId,  router])

  // Show loading state while checking auth
//   if (!auth.token) {
//     return <div>Loading...</div>
//   }

  return <>{children}</>
}
