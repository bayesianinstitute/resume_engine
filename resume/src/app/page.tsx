"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/lib/store/store";
import { setToken } from "@/lib/store/features/user/user";

export default function Home() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    const verifyToken = async () => {
      const pathname = window.location.pathname; // Get the current path directly from the window

      // Skip token verification and redirection if the path includes "/reset-password/"
      if (pathname.startsWith("/reset-password/") || pathname.startsWith("/complete-signup/")) {
        return;
      }


      const token = localStorage.getItem("token"); // Check for token in localStorage

      if (token) {
        try {
          // Call API to verify the token
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_BASE_URL}/user/`,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (!response.ok) {
            localStorage.removeItem("token"); // Remove token if verification fails
            router.replace("/login"); // Redirect to login page if verification fails
            return;
          }
          dispatch(setToken(token));
          router.replace("/uploadResume"); // Redirect to resume if token exists
        } catch (error) {
          console.error("Token verification error:", error);
          localStorage.removeItem("token");
          router.replace("/login");
        }
      } else {
        router.replace("/login"); // Redirect to login page if token does not exist
      }
    };

    verifyToken();
  }, [router, dispatch]);

  return null; // Do not render anything on this page
}
