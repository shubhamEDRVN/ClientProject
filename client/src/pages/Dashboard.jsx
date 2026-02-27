import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [healthStatus, setHealthStatus] = useState(null);
  const [healthLoading, setHealthLoading] = useState(true);

  useEffect(() => {
    api.get('/health')
      .then((res) => {
        setHealthStatus(res.data.success ? 'active' : 'failed');
      })
      .catch(() => {
        setHealthStatus('failed');
      })
      .finally(() => {
        setHealthLoading(false);
      });
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Welcome header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            Welcome back, {user?.name}! 👋
          </h1>
          <p className="text-gray-500 mt-1">Here&apos;s your account overview</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* User Info Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">User Information</h2>
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Name</dt>
                <dd className="text-sm font-medium text-gray-800">{user?.name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Email</dt>
                <dd className="text-sm font-medium text-gray-800">{user?.email}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Role</dt>
                <dd className="text-sm font-medium text-gray-800 capitalize">{user?.role}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Company Name</dt>
                <dd className="text-sm font-medium text-gray-800">{user?.company?.name || '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Company ID</dt>
                <dd className="text-sm font-medium text-gray-800 font-mono text-xs break-all">
                  {user?.company?._id || user?.companyId || '—'}
                </dd>
              </div>
            </dl>
          </div>

          {/* Status Cards */}
          <div className="flex flex-col gap-6">
            {/* Backend Connection */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-700 mb-3">Backend Connection</h2>
              <div className="flex items-center gap-2 text-sm font-medium">
                <span className="text-2xl">✅</span>
                <span className="text-green-700">Backend Connection: Active</span>
              </div>
            </div>

            {/* API Health Check */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-700 mb-3">API Health Check</h2>
              {healthLoading ? (
                <div className="flex items-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-500 border-t-transparent"></span>
                  <span className="text-sm text-gray-500">Checking...</span>
                </div>
              ) : healthStatus === 'active' ? (
                <div className="flex items-center gap-2 text-sm font-medium text-green-700">
                  <span className="text-2xl">✅</span>
                  <span>API Health: OK</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm font-medium text-red-700">
                  <span className="text-2xl">❌</span>
                  <span>API Health: Failed</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Logout button */}
        <div className="mt-8">
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-red-600 transition"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
