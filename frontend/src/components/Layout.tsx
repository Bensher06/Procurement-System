import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import { Loader2 } from 'lucide-react';

const Layout = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-red-900 animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Full-width header: logo + contact (same height as logo section) */}
      <header className="fixed top-0 left-0 right-0 h-24 bg-red-950 border-b border-red-700/50 text-white flex items-center justify-between gap-4 pl-10 pr-6 z-20 shadow-md min-h-0">
        <div className="flex items-center gap-3 flex-shrink-0 min-w-0">
          <img
            src="/Wmsu logo (4).png"
            alt="WMSU Logo"
            className="w-16 h-16 object-contain flex-shrink-0"
          />
          <div className="min-w-0">
            <h1 className="font-sans font-bold text-2xl leading-tight text-white">Western Mindanao State University</h1>
            <p className="text-base leading-tight text-red-200">Procurement System</p>
          </div>
        </div>
        <div className="flex items-center gap-4 sm:gap-6 text-sm flex-shrink-0 flex-wrap justify-end">
          <span className="whitespace-nowrap">📞 991-1771</span>
          <span className="whitespace-nowrap">✉️ procurement@wmsu.edu.ph</span>
          <div className="text-xs text-red-200 whitespace-nowrap">ISO 9001-2015</div>
        </div>
      </header>
      <Sidebar />
      <main className="ml-64 pt-32 px-10 pb-12">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;

