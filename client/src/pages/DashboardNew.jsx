import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import {
  DollarSign,
  TrendingUp,
  Activity,
  Briefcase,
  Calculator,
  Grid3X3,
  ArrowRight,
  User,
  Mail,
  Shield,
  Building2,
  Award,
  Target,
} from 'lucide-react';

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
          Welcome back, {user?.name}
        </h1>
        <p className="text-gray-500 text-sm mt-1">Here&apos;s your business overview</p>
      </div>

      {/* Summary Cards */}
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <span className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></span>
          Loading summary...
        </div>
      ) : overhead ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <SummaryCard
            icon={DollarSign}
            label="Current Hourly Rate"
            value={formatCurrency(overhead.finalBillableHourlyRate)}
            sub="/hr"
            color="blue"
            linkTo="/overhead-calculator"
          />
          <SummaryCard
            icon={TrendingUp}
            label="Daily Revenue Target"
            value={formatCurrency(overhead.dailyRevenuePerTruck)}
            sub="per truck"
            color="emerald"
            linkTo="/overhead-calculator"
          />
          <SummaryCard
            icon={Activity}
            label="Business Health Score"
            value="—"
            sub="Coming soon"
            color="amber"
          />
          <SummaryCard
            icon={Briefcase}
            label="Last Job COGS"
            value="—"
            sub="Open Job Costing"
            color="green"
            linkTo="/job-costing"
          />
        </div>
      ) : (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h3 className="text-blue-800 font-semibold">Get Started</h3>
          <p className="text-blue-600 text-sm mt-1">
            Set up your overhead costs to see your billable hourly rate and daily revenue targets.
          </p>
          <Link
            to="/overhead-calculator"
            className="inline-flex items-center gap-1.5 mt-3 bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-blue-600 transition-all duration-200"
          >
            Open Overhead Calculator
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Info cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">User Information</h2>
          <dl className="space-y-3">
            <InfoRow icon={User} label="Name" value={user?.name} />
            <InfoRow icon={Mail} label="Email" value={user?.email} />
            <InfoRow icon={Shield} label="Role" value={user?.role} capitalize />
            <InfoRow icon={Building2} label="Company" value={user?.companyName || user?.company?.name || '—'} />
          </dl>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Quick Actions</h2>
          <div className="space-y-2">
            <QuickLink to="/overhead-calculator" icon={Calculator} label="Overhead & Hourly Rate Calculator" />
            <QuickLink to="/pricing-matrix" icon={Grid3X3} label="Pricing Matrix" />
            <QuickLink to="/job-costing" icon={DollarSign} label="Job Costing" />
            <QuickLink to="#" icon={Award} label="Business Scorecard" disabled />
            <QuickLink to="#" icon={Target} label="Revenue Plan" disabled />
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, sub, color = 'blue', linkTo }) {
  const borderMap = {
    blue: 'border-l-blue-500',
    emerald: 'border-l-emerald-500',
    amber: 'border-l-amber-500',
    green: 'border-l-green-500',
  };
  const iconBgMap = {
    blue: 'bg-blue-50 text-blue-500',
    emerald: 'bg-emerald-50 text-emerald-500',
    amber: 'bg-amber-50 text-amber-500',
    green: 'bg-green-50 text-green-500',
  };

  const content = (
    <div className={`bg-white rounded-lg border border-gray-100 border-l-4 ${borderMap[color]} p-5 shadow-sm transition-all duration-200 hover:shadow-md`}>
      <div className="flex items-center gap-2.5 mb-2">
        <div className={`w-8 h-8 rounded-md flex items-center justify-center ${iconBgMap[color]}`}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</span>
      </div>
      <p className="text-2xl font-bold text-gray-800">
        {value}
        {sub && <span className="text-sm font-normal ml-1 text-gray-400">{sub}</span>}
      </p>
    </div>
  );

  return linkTo ? <Link to={linkTo}>{content}</Link> : content;
}

function InfoRow({ icon: Icon, label, value, capitalize }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="flex items-center gap-2 text-sm text-gray-500">
        <Icon className="w-3.5 h-3.5 text-gray-400" />
        {label}
      </dt>
      <dd className={`text-sm font-medium text-gray-800 ${capitalize ? 'capitalize' : ''}`}>
        {value || '—'}
      </dd>
    </div>
  );
}

function QuickLink({ to, icon: Icon, label, disabled }) {
  if (disabled) {
    return (
      <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 cursor-not-allowed">
        <Icon className="w-4 h-4" />
        <span>{label}</span>
        <span className="ml-auto text-xs bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-md">Soon</span>
      </div>
    );
  }
  return (
    <Link
      to={to}
      className="group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-all duration-200 font-medium"
    >
      <Icon className="w-4 h-4 text-gray-500" />
      <span>{label}</span>
      <ArrowRight className="ml-auto w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-all duration-200" />
    </Link>
  );
}
