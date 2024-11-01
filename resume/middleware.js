import { NextResponse } from 'next/server'

export function middleware(req) {
  const token = req.cookies.get('token') // Or use cookies instead of localStorage for better security

  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
}

export const config = {
  matcher: ['/resume','dashboard','/resumematch','/job','interview','/searchjob','/uploadResume'], // Add protected routes here
}
