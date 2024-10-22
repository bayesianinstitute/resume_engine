import { useRouter } from 'next/navigation';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { PieChart, Briefcase, User } from 'lucide-react';
import Link from 'next/link';

const Sidebar = () => {
  const router = useRouter();

  const onLogout = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/user/logout`, {
        method: 'GET',
        credentials: 'include', // Include credentials if necessary
      });

      if (!response.ok) {
        throw new Error('Failed to log out');
      }

      const data = await response.json();
      console.log(data.message);

      // Remove the token from localStorage after successful logout
      localStorage.removeItem('token');

      toast.success('Logged out successfully');
      router.push('/login'); // Redirect to the login page after logout

    } catch (error) {
      console.error('Error:', error);
      toast.error('An error occurred while logging out.');
    }
  };

  return (
    <div className="h-screen w-64 bg-gray-800 text-white flex flex-col">
      <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} />
      <div className="flex items-center justify-center h-16 bg-gray-900">
        <h1 className="text-xl font-bold">Job Dashboard</h1>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-4">
        <Link href="/resume" className="flex items-center space-x-2 text-white hover:bg-gray-700 px-4 py-2 rounded">
          <Briefcase className="w-5 h-5" />
          <span>Resume Summary</span>
        </Link>
        <Link href="/interview" className="flex items-center space-x-2 text-white hover:bg-gray-700 px-4 py-2 rounded">
          <PieChart className="w-5 h-5" />
          <span>Interview Preparation</span>
        </Link>
        <Link href="/job" className="flex items-center space-x-2 text-white hover:bg-gray-700 px-4 py-2 rounded">
          <PieChart className="w-5 h-5" />
          <span>Job list</span>
        </Link>
        <Link href="/jobtracker" className="flex items-center space-x-2 text-white hover:bg-gray-700 px-4 py-2 rounded">
          <PieChart className="w-5 h-5" />
          <span>Job Tracker</span>
        </Link>
        <Link href="/uploadResume" className="flex items-center space-x-2 text-white hover:bg-gray-700 px-4 py-2 rounded">
          <PieChart className="w-5 h-5" />
          <span>Upload Resume</span>
        </Link>
        <button 
          onClick={onLogout} 
          className="flex items-center space-x-2 text-white hover:bg-gray-700 px-4 py-2 rounded w-full text-left"
        >
          <User className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </nav>
    </div>
  );
};

export default Sidebar;
