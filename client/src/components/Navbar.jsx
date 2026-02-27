import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <nav className="bg-indigo-600 text-white shadow-md">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold tracking-tight">
          BizManager
        </Link>
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <span className="text-indigo-200 text-sm">
                Hello, <span className="font-semibold text-white">{user?.name}</span>
              </span>
              <button
                onClick={logout}
                className="bg-white text-indigo-600 text-sm font-semibold px-4 py-1.5 rounded-lg hover:bg-indigo-50 transition"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm font-medium text-indigo-100 hover:text-white transition"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="bg-white text-indigo-600 text-sm font-semibold px-4 py-1.5 rounded-lg hover:bg-indigo-50 transition"
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
