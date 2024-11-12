import { clearToken } from "@/lib/store/features/user/user";
import { AppDispatch } from "@/lib/store/store";
import {
  BarChart2,
  FileText,
  LogOut,
  PlusCircle,
  Search,
  Upload
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Sidebar = () => {
  const pathname = usePathname(); // usePathname instead of useRouter
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter()
  const onLogout = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/user/logout`,
        {
          method: "GET",
          credentials: "include",
        }
      );
      if (!response.ok) {
        throw new Error("Failed to log out");
      }
      const data = await response.json();
      console.log(data.message);
      dispatch(clearToken());
      toast.success("Logged out successfully");
      router.push("/login");
    } catch (error) {
      console.error("Error:", error);
      toast.error("An error occurred while logging out.");
    }
  };

  return (
    <div className="sidebar min-h-screen w-64 bg-gray-900 text-white flex flex-col fixed">
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
      />
      <div className="flex items-center justify-center h-16 border-b border-gray-800">
        <h1 className="text-xl font-bold">Job Dashboard</h1>
      </div>
      <nav className="flex-1 flex flex-col px-4 py-6">
        <div className="space-y-2 flex-1">
          <Link
            href="/resumematch"
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
              pathname === "/resumematch"
                ? "text-white bg-gray-700"
                : "text-gray-300 hover:text-white hover:bg-gray-800"
            }`}
          >
            <FileText className="w-5 h-5" />
            <span>Resume Match</span>
          </Link>
          <Link
            href="/interview"
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
              pathname === "/interview"
                ? "text-white bg-gray-700"
                : "text-gray-300 hover:text-white hover:bg-gray-800"
            }`}
          >
            <BarChart2 className="w-5 h-5" />
            <span>Interview Preparation</span>
          </Link>
          <Link
            href="/job"
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
              pathname === "/job"
                ? "text-white bg-gray-700"
                : "text-gray-300 hover:text-white hover:bg-gray-800"
            }`}
          >
            <PlusCircle className="w-5 h-5" />
            <span>Add Job</span>
          </Link>
          <Link
            href="/searchjob"
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
              pathname === "/searchjob"
                ? "text-white bg-gray-700"
                : "text-gray-300 hover:text-white hover:bg-gray-800"
            }`}
          >
            <Search className="w-5 h-5" />
            <span>Search Job</span>
          </Link>
          <Link
            href="/uploadResume"
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
              pathname === "/uploadResume"
                ? "text-white bg-gray-700"
                : "text-gray-300 hover:text-white hover:bg-gray-800"
            }`}
          >
            <Upload className="w-5 h-5" />
            <span>Upload Resume</span>
          </Link>
          <Link
            href="/profile"
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
              pathname === "/profile"
                ? "text-white bg-gray-700"
                : "text-gray-300 hover:text-white hover:bg-gray-800"
            }`}
          >
            <Upload className="w-5 h-5" />
            <span>Profile</span>
          </Link>
        </div>
        {/*
          <Link
            href="/dashboard"
            className="flex items-center space-x-3 text-gray-300 hover:text-white hover:bg-gray-800 px-4 py-3 rounded-lg transition-colors duration-200"
          >
            <Briefcase className="w-5 h-5" />
            <span>Dashboard</span>
          </Link>
           <Link
            href="/resume"
            className="flex items-center space-x-3 text-gray-300 hover:text-white hover:bg-gray-800 px-4 py-3 rounded-lg transition-colors duration-200"
          >
            <FileText className="w-5 h-5" />
            <span>Resume Summary</span>
          </Link> 
           <Link
            href="/jobtracker"
            className="flex items-center space-x-3 text-gray-300 hover:text-white hover:bg-gray-800 px-4 py-3 rounded-lg transition-colors duration-200"
          >
            <BarChart2 className="w-5 h-5" />
            <span>Job Tracker</span>
          </Link> 
          */}

        <button
          onClick={onLogout}
          className="mt-auto flex items-center space-x-3 text-gray-300 hover:text-white hover:bg-gray-800 px-4 py-3 rounded-lg transition-colors duration-200 w-full"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </nav>
    </div>
  );
};

export default Sidebar;
