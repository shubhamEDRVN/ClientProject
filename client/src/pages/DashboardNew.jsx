import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

function formatCurrency(val) {
  if (val == null || isNaN(val)) return '$0.00';
  return '$' + Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatPct(val) {
  if (val == null || isNaN(val)) return '0.00%';
  return Number(val).toFixed(2) + '%';
}

export default function Dashboard() {
  const { user } = useAuth();
  const [overhead, setOverhead] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/overhead/me')
      .then((res) => {
        if (res.data.success && res.data.data.calculations) {
          setOverhead(res.data.data.calculations);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* Welcome header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Welcome back, {user?.name}! 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">Here&apos;s your business overview</p>
      </div>

      {/* Summary Cards */}
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <span className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-500 border-t-transparent"></span>
          Loading summary...
        </div>
      ) : overhead ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <SummaryCard
            icon="🧮"
            label="Current Hourly Rate"
            value={formatCurrency(overhead.finalBillableHourlyRate)}
            sub="/hr"
            color="indigo"
            linkTo="/overhead-calculator"
          />
          <SummaryCard
            icon="📅"
            label="Daily Revenue Target"
            value={formatCurrency(overhead.dailyRevenuePerTruck)}
            sub="per truck"
            color="blue"
            linkTo="/overhead-calculator"
          />
          <SummaryCard
            icon="📈"
            label="Business Health Score"
            value="—"
            sub="Coming soon"
            color="amber"
          />
          <SummaryCard
            icon="💰"
            label="Last Job COGS"
            value="—"
            sub="Coming soon"
            color="green"
          />
        </div>
      ) : (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6 mb-8">
          <h3 className="text-indigo-800 font-semibold">Get Started</h3>
          <p className="text-indigo-600 text-sm mt-1">
            Set up your overhead costs to see your billable hourly rate and daily revenue targets.
          </p>
          <Link
            to="/overhead-calculator"
            className="inline-block mt-3 bg-indigo-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
          >
            Open Overhead Calculator →
          </Link>
        </div>
      )}

      {/* Info cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">User Information</h2>
          <dl className="space-y-3">
            <InfoRow label="Name" value={user?.name} />
            <InfoRow label="Email" value={user?.email} />
            <InfoRow label="Role" value={user?.role} capitalize />
            <InfoRow label="Company" value={user?.companyName || user?.company?.name || '—'} />
          </dl>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Quick Actions</h2>
          <div className="space-y-2">
            <QuickLink to="/overhead-calculator" icon="🧮" label="Overhead & Hourly Rate Calculator" />
            <QuickLink to="/pricing-matrix" icon="📋" label="Pricing Matrix" />
            <QuickLink to="#" icon="💰" label="Job Costing" disabled />
            <QuickLink to="#" icon="📈" label="Business Scorecard" disabled />
            <QuickLink to="#" icon="🎯" label="Revenue Plan" disabled />
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ icon, label, value, sub, color = 'indigo', linkTo }) {
  const colorMap = {
    indigo: 'border-indigo-200 bg-indigo-50',
    blue: 'border-blue-200 bg-blue-50',
    amber: 'border-amber-200 bg-amber-50',
    green: 'border-green-200 bg-green-50',
  };
  const textMap = {
    indigo: 'text-indigo-700',
    blue: 'text-blue-700',
    amber: 'text-amber-700',
    green: 'text-green-700',
  };

  const content = (
    <div className={`rounded-xl border p-5 ${colorMap[color]} transition hover:shadow-md`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{icon}</span>
        <span className={`text-xs font-medium uppercase tracking-wide ${textMap[color]} opacity-75`}>{label}</span>
      </div>
      <p className={`text-2xl font-bold ${textMap[color]}`}>
        {value}
        {sub && <span className="text-sm font-normal ml-1 opacity-70">{sub}</span>}
      </p>
    </div>
  );

  return linkTo ? <Link to={linkTo}>{content}</Link> : content;
}

function InfoRow({ label, value, capitalize }) {
  return (
    <div className="flex justify-between">
      <dt className="text-sm text-gray-500">{label}</dt>
      <dd className={`text-sm font-medium text-gray-800 ${capitalize ? 'capitalize' : ''}`}>
        {value || '—'}
      </dd>
    </div>
  );
}

function QuickLink({ to, icon, label, disabled }) {
  if (disabled) {
    return (
      <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 cursor-not-allowed">
        <span>{icon}</span>
        <span>{label}</span>
        <span className="ml-auto text-xs bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded">Soon</span>
      </div>
    );
  }
  return (
    <Link
      to={to}
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition font-medium"
    >
      <span>{icon}</span>
      <span>{label}</span>
      <span className="ml-auto text-gray-400">→</span>
    </Link>
  );
}
