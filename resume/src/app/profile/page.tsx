"use client"; // Add this at the very top

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import Sidebar from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "react-toastify";
import {jwtDecode} from "jwt-decode";

interface CustomJwtPayload {
  userId: string;
}

export default function ProfileDashboard() {
  const [profile, setProfile] = useState({
    email: "",
    name: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null); // Add `userId` state

  useEffect(() => {
    const id = getUserIdFromToken();
    if (id) {
      setUserId(id); // Set userId in state
      fetchProfile(id);
    } else {
      toast.error("User not authenticated");
    }
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      setLoading(true);
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  
      if (!baseUrl) {
        throw new Error("Base URL is not defined in environment variables");
      }
  
      const response = await fetch(
        `${baseUrl}/user/profile?userId=${userId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${getToken()}`,
          },
        }
      );
  
      if (response.ok) {
        const { data } = await response.json();
        setProfile(data);
      } else {
        toast.error("Failed to fetch profile data");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("An error occurred while fetching profile data");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setProfile((prev) => ({ ...prev, [id]: value }));
  };

  const updateProfile = async () => {
    if (!userId) {
      toast.error("User ID is missing");
      return;
    }

    try {
      setLoading(true);
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

      if (!baseUrl) {
        throw new Error("Base URL is not defined in environment variables");
      }

      const response = await fetch(
        `${baseUrl}/user/profile?userId=${userId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${getToken()}`,
          },
          body: JSON.stringify(profile),
        }
      );

      if (response.ok) {
        toast.success("Profile updated successfully");
      } else {
        toast.error("Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("An error occurred while updating profile");
    } finally {
      setLoading(false);
    }
  };

  const getToken = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("token") || "";
    }
    return ""; 
  };

  const getUserIdFromToken = () => {
    const token = getToken();
    if (token) {
      try {
        const decodedToken = jwtDecode<CustomJwtPayload>(token);
        return decodedToken?.userId;
      } catch (error) {
        console.error("Error decoding token:", error);
        return null;
      }
    }
    return null;
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-64 p-10">
        <h1 className="text-4xl font-extrabold text-gray-800 text-center mb-8">
          Profile Dashboard
        </h1>
        <p className="text-lg text-center text-gray-600 mb-8">
          Manage your personal information and keep your profile updated.
        </p>

        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle>Profile Details</CardTitle>
            <CardDescription>Update your personal information below.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={profile.email} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={profile.name} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={profile.phone} onChange={handleChange} />
            </div>
          </CardContent>
          <CardContent>
            <Button onClick={updateProfile} disabled={loading} className="w-full">
              {loading ? "Saving..." : "Update Profile"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
