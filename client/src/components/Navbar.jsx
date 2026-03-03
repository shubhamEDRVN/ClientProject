import { Link } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <nav className="bg-white border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-xl text-blue-500 font-semibold tracking-tight">
          Profit Paybook Pro
        </Link>
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <span className="text-gray-600 text-sm">
                Hello, <span className="font-semibold text-gray-900">{user?.name}</span>
              </span>
              <button
                onClick={logout}
                className="bg-blue-500 text-white text-sm font-semibold px-4 py-1.5 rounded-md hover:bg-blue-600 transition-all duration-200 inline-flex items-center gap-1.5"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm font-medium text-gray-600 hover:text-blue-500 transition-all duration-200"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="bg-blue-500 text-white text-sm font-semibold px-4 py-1.5 rounded-md hover:bg-blue-600 transition-all duration-200"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
