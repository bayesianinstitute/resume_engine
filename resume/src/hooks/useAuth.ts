// src/hooks/useAuth.ts
"use client"; // Ensure this hook runs only on the client side

import { useRouter } from "next/router";
import { useEffect } from "react";

const useAuth = (): void => {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login"); // Redirect to login if no token found
    }
  }, [router]);
};

export default useAuth;
