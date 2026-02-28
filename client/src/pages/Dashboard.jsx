import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const fmt = (val) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(
    parseFloat(val) || 0
  );

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [healthStatus, setHealthStatus] = useState(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [overheadCalcs, setOverheadCalcs] = useState(null);
  const [overheadLoading, setOverheadLoading] = useState(true);

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

    api.get('/overhead/calculations')
      .then((res) => {
        if (res.data.success) {
          setOverheadCalcs(res.data.data.calculations);
        }
      })
      .catch((err) => {
        // 404 is expected when no overhead data exists yet; log other errors
        if (err?.response?.status !== 404) {
          console.error('Failed to load overhead calculations:', err);
        }
        setOverheadCalcs(null);
      })
      .finally(() => {
        setOverheadLoading(false);
      });
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const hasOverheadData =
    overheadCalcs && parseFloat(overheadCalcs.finalBillableHourlyRate) > 0;

  return (
    <div>
      {/* Welcome header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          Welcome back, {user?.name}! 👋
        </h1>
        <p className="text-gray-500 mt-1">Here&apos;s your account overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
          </dl>
        </div>

        {/* Current Hourly Rate card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Current Hourly Rate</h2>
          {overheadLoading ? (
            <div className="flex items-center gap-2">
              <span className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-500 border-t-transparent" />
              <span className="text-sm text-gray-500">Loading…</span>
            </div>
          ) : hasOverheadData ? (
            <div>
              <p className="text-3xl font-bold text-indigo-600">
                {fmt(overheadCalcs.finalBillableHourlyRate)}
                <span className="text-base font-normal text-gray-400">/hr</span>
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Daily Target: {fmt(overheadCalcs.dailyRevenueTotal)}
              </p>
              <Link
                to="/overhead"
                className="inline-block mt-3 text-xs font-medium text-indigo-600 hover:underline"
              >
                Edit Overhead Calculator →
              </Link>
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-500 mb-3">No overhead data yet.</p>
              <Link
                to="/overhead"
                className="inline-block text-sm font-semibold text-indigo-600 hover:underline"
              >
                Set up your Overhead Calculator →
              </Link>
            </div>
          )}
        </div>

        {/* Daily Revenue Target card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Daily Revenue Target</h2>
          {overheadLoading ? (
            <div className="flex items-center gap-2">
              <span className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-500 border-t-transparent" />
              <span className="text-sm text-gray-500">Loading…</span>
            </div>
          ) : hasOverheadData ? (
            <div>
              <p className="text-3xl font-bold text-green-600">
                {fmt(overheadCalcs.dailyRevenuePerTruck)}
                <span className="text-base font-normal text-gray-400">/truck</span>
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Est. Yearly: {fmt(overheadCalcs.estYearlyGrossRevenue)}
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">Complete the Overhead Calculator to see your targets.</p>
          )}
        </div>

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
  );
}
