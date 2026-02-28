import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: '🏠', enabled: true },
  { label: 'Overhead Calculator', path: '/overhead', icon: '🧮', enabled: true },
  { label: 'Pricing Matrix', path: '/pricing', icon: '📋', enabled: false },
  { label: 'Job Costing', path: '/job-costing', icon: '📎', enabled: false },
  { label: 'Scorecard', path: '/scorecard', icon: '📊', enabled: false },
  { label: 'Revenue Plan', path: '/revenue-plan', icon: '📈', enabled: false },
  { label: 'Settings', path: '/settings', icon: '⚙️', enabled: false },
];

export default function Sidebar({ currentPath }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* App name */}
      <div className="px-6 py-5 border-b border-indigo-700">
        <span className="text-xl font-bold text-white tracking-tight">BizManager</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) =>
          item.enabled ? (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                currentPath === item.path
                  ? 'bg-indigo-700 text-white'
                  : 'text-indigo-100 hover:bg-indigo-700 hover:text-white'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          ) : (
            <div
              key={item.path}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-indigo-400 cursor-not-allowed"
              title="Coming soon"
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
              <span className="ml-auto text-xs bg-indigo-700 text-indigo-300 px-1.5 py-0.5 rounded">
                Soon
              </span>
            </div>
          )
        )}
      </nav>

      {/* User info + logout */}
      <div className="px-4 py-4 border-t border-indigo-700">
        <div className="mb-3">
          <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
          <p className="text-xs text-indigo-300 truncate">{user?.company?.name || 'My Company'}</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full bg-indigo-700 hover:bg-indigo-600 text-white text-sm font-medium px-3 py-2 rounded-lg transition"
        >
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-indigo-800 px-4 py-3 flex items-center justify-between">
        <span className="text-white font-bold text-lg">BizManager</span>
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="text-white focus:outline-none"
          aria-label="Toggle menu"
        >
          {mobileOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-20 bg-black bg-opacity-50"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div
        className={`md:hidden fixed top-0 left-0 h-full w-64 z-30 bg-indigo-800 transform transition-transform duration-200 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="pt-14 h-full">
          <SidebarContent />
        </div>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-64 md:fixed md:inset-y-0 bg-indigo-800">
        <SidebarContent />
      </aside>
    </>
  );
}
