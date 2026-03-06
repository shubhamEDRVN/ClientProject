import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

function formatCurrency(val) {
  if (val == null || isNaN(val)) return '$0.00';
  return '$' + Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function DashboardNew() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [overhead, setOverhead] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      api.get('/overhead/me'),
      api.get('/jobs'),
    ]).then(([overheadRes, jobsRes]) => {
      if (overheadRes.status === 'fulfilled' && overheadRes.value.data?.success) {
        setOverhead(overheadRes.value.data.data);
      }
      if (jobsRes.status === 'fulfilled' && jobsRes.value.data?.success) {
        setJobs(jobsRes.value.data.data.jobs || []);
      }
    }).finally(() => setLoading(false));
  }, []);

  const calc = overhead?.calculations;
  const hasOverhead = !!overhead?.inputs;
  const totalJobs = jobs.length;

  const MODULES = [
    {
      to: '/overhead-calculator',
      icon: '🧮',
      title: 'Overhead Calculator',
      desc: 'Set your billable hourly rate',
      color: 'indigo',
      badge: hasOverhead ? 'Configured' : 'Setup Required',
      badgeOk: hasOverhead,
    },
    {
      to: '/pricing-matrix',
      icon: '📋',
      title: 'Pricing Matrix',
      desc: 'Build your service price list',
      color: 'purple',
      badge: hasOverhead ? 'Ready' : 'Needs Overhead First',
      badgeOk: hasOverhead,
    },
    {
      to: '/job-costing',
      icon: '💰',
      title: 'Job Costing',
      desc: 'Track profit on every install job',
      color: 'teal',
      badge: totalJobs > 0 ? `${totalJobs} job${totalJobs !== 1 ? 's' : ''}` : 'No jobs yet',
      badgeOk: totalJobs > 0,
    },
  ];

  const COLORS = {
    indigo: { bg: 'bg-indigo-50 border-indigo-200', iconBg: 'bg-indigo-100', btn: 'bg-indigo-600 hover:bg-indigo-700', text: 'text-indigo-700' },
    purple: { bg: 'bg-purple-50 border-purple-200', iconBg: 'bg-purple-100', btn: 'bg-purple-600 hover:bg-purple-700', text: 'text-purple-700' },
    teal:   { bg: 'bg-teal-50 border-teal-200',     iconBg: 'bg-teal-100',   btn: 'bg-teal-600 hover:bg-teal-700',   text: 'text-teal-700'   },
  };

  return (
    <div className="max-w-6xl mx-auto">

      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Welcome back, {user?.name}! 👋</h1>
        <p className="text-gray-500 text-sm mt-1">{user?.companyName || 'Your Company'}</p>
      </div>

      {/* Setup Banner — only shown when overhead not configured */}
      {!loading && !hasOverhead && (
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <span className="text-2xl">⚠️</span>
          <div className="flex-1">
            <p className="font-semibold text-amber-800">Complete your setup first</p>
            <p className="text-sm text-amber-600 mt-0.5">
              Enter your overhead costs to unlock your hourly rate, pricing matrix, and job costing.
            </p>
          </div>
          <button
            onClick={() => navigate('/overhead-calculator')}
            className="whitespace-nowrap bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
          >
            Set Up Now →
          </button>
        </div>
      )}

      {/* Key Metrics Row */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard label="Hourly Rate"      value={hasOverhead ? formatCurrency(calc?.finalBillableHourlyRate) : null} sub="/hr"     color="indigo" />
          <MetricCard label="Daily Target"     value={hasOverhead ? formatCurrency(calc?.dailyRevenueTotal)         : null} sub="total"   color="blue"   />
          <MetricCard label="Per Truck / Day"  value={hasOverhead ? formatCurrency(calc?.dailyRevenuePerTruck)      : null}               color="cyan"   />
          <MetricCard label="Revenue Target"   value={hasOverhead ? formatCurrency(calc?.revenueTarget)             : null} sub="annual"  color="green"  />
        </div>
      )}

      {/* Module Cards */}
      <h2 className="text-base font-semibold text-gray-700 mb-3">Modules</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {MODULES.map((mod) => {
          const c = COLORS[mod.color];
          return (
            <div key={mod.to} className={`rounded-xl border p-5 flex flex-col gap-4 ${c.bg}`}>
              <div className="flex items-start justify-between">
                <div className={`w-10 h-10 rounded-xl ${c.iconBg} flex items-center justify-center text-xl`}>
                  {mod.icon}
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  mod.badgeOk ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {mod.badge}
                </span>
              </div>
              <div>
                <h3 className={`font-semibold ${c.text}`}>{mod.title}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{mod.desc}</p>
              </div>
              <Link
                to={mod.to}
                className={`block text-center text-sm font-semibold text-white py-2 rounded-lg transition ${c.btn}`}
              >
                Open →
              </Link>
            </div>
          );
        })}
      </div>

      {/* Recent Jobs — only shown when jobs exist */}
      {jobs.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-800">Recent Jobs</h2>
            <Link to="/job-costing" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
              View All →
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {jobs.slice(0, 5).map((job) => (
              <div key={job._id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50 transition cursor-pointer"
                onClick={() => navigate('/job-costing')}>
                <div>
                  <p className="text-sm font-medium text-gray-800">{job.job_name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {job.customer_name && `${job.customer_name} · `}
                    {new Date(job.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <StatusBadge status={job.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* User info card — bottom, always shown */}
      <div className="mt-6 bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Account</h2>
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <InfoItem label="Name"    value={user?.name} />
          <InfoItem label="Email"   value={user?.email} />
          <InfoItem label="Role"    value={user?.role} capitalize />
          <InfoItem label="Company" value={user?.companyName || '—'} />
        </dl>
      </div>

    </div>
  );
}

// --- Sub-components ---

function MetricCard({ label, value, sub, color }) {
  const COLORS = {
    indigo: 'bg-indigo-50 border-indigo-200 text-indigo-700',
    blue:   'bg-blue-50 border-blue-200 text-blue-700',
    cyan:   'bg-cyan-50 border-cyan-200 text-cyan-700',
    green:  'bg-green-50 border-green-200 text-green-700',
  };
  return (
    <div className={`rounded-xl border p-4 ${COLORS[color]}`}>
      <p className="text-xs font-medium uppercase tracking-wide opacity-70 mb-1">{label}</p>
      {value ? (
        <p className="text-xl font-bold">
          {value}
          {sub && <span className="text-xs font-normal ml-1 opacity-60">{sub}</span>}
        </p>
      ) : (
        <p className="text-sm font-medium opacity-50">Not set up</p>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const MAP = {
    draft:     'bg-gray-100 text-gray-600',
    sent:      'bg-blue-100 text-blue-700',
    accepted:  'bg-green-100 text-green-700',
    completed: 'bg-indigo-100 text-indigo-700',
    cancelled: 'bg-red-100 text-red-600',
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${MAP[status] || MAP.draft}`}>
      {status}
    </span>
  );
}

function InfoItem({ label, value, capitalize }) {
  return (
    <div>
      <dt className="text-xs text-gray-400">{label}</dt>
      <dd className={`font-medium text-gray-800 mt-0.5 ${capitalize ? 'capitalize' : ''}`}>{value || '—'}</dd>
    </div>
  );
}
