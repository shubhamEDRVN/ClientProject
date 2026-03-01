import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../api/axios';

// Overhead line item definitions
const OVERHEAD_FIELDS = [
  { key: 'owner_salary', label: 'Owner Salary (if not in truck)' },
  { key: 'office_staff_1', label: 'Office Personnel 1 Salary' },
  { key: 'office_staff_2', label: 'Office Personnel 2 Salary' },
  { key: 'office_staff_3', label: 'Office Personnel 3 Salary' },
  { key: 'fuel', label: 'Fuel / Gas' },
  { key: 'vehicle_maintenance', label: 'Vehicle Maintenance' },
  { key: 'truck_1', label: 'Truck 1 Payment' },
  { key: 'truck_2', label: 'Truck 2 Payment' },
  { key: 'truck_3', label: 'Truck 3 Payment' },
  { key: 'loan_payments', label: 'Loan Payments' },
  { key: 'workers_comp', label: 'Workers Comp Insurance' },
  { key: 'liability_insurance', label: 'Liability Insurance' },
  { key: 'merchant_fees', label: 'Merchant / Credit Card Fees' },
  { key: 'shop_rent', label: 'Shop / Lease / Rent' },
  { key: 'cellular', label: 'Cellular Services' },
  { key: 'accounting', label: 'Accounting / Tax Prep' },
  { key: 'software_subs', label: 'Software Subscriptions' },
  { key: 'marketing', label: 'Marketing / Advertising' },
  { key: 'training', label: 'Training & Education' },
  { key: 'uniforms', label: 'Uniforms' },
  { key: 'tools', label: 'Tools / Small Equipment' },
  { key: 'payroll_processing', label: 'Payroll Processing' },
  { key: 'auto_insurance', label: 'Auto Insurance' },
  { key: 'licenses', label: 'License Renewals' },
  { key: 'misc', label: 'Miscellaneous Overhead' },
];

const TECH_FIELDS = [
  { key: 'highest_tech_salary', label: 'Highest Paid Technician Burdened Salary' },
  { key: 'helper_salary', label: 'Helper in Truck Burdened Salary (optional)' },
];

const OP_FIELDS = [
  { key: 'num_trucks', label: 'Number of Service Trucks', type: 'integer', min: 1 },
  { key: 'working_days_per_year', label: 'Billable Working Days per Year', min: 1 },
  { key: 'avg_hours_per_day', label: 'Avg Billable Hours per Day', min: 0.5, max: 24 },
];

const DEFAULT_VALUES = {
  owner_salary: 0, office_staff_1: 0, office_staff_2: 0, office_staff_3: 0,
  fuel: 0, vehicle_maintenance: 0, truck_1: 0, truck_2: 0, truck_3: 0,
  loan_payments: 0, workers_comp: 0, liability_insurance: 0,
  merchant_fees: 0, shop_rent: 0, cellular: 0, accounting: 0,
  software_subs: 0, marketing: 0, training: 0, uniforms: 0,
  tools: 0, payroll_processing: 0, auto_insurance: 0, licenses: 0, misc: 0,
  highest_tech_salary: 0, helper_salary: 0,
  num_trucks: 1, working_days_per_year: 125, avg_hours_per_day: 8,
  total_revenue_last_year: 0,
};

function formatCurrency(val) {
  if (val == null || isNaN(val)) return '$0.00';
  return '$' + Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatPct(val) {
  if (val == null || isNaN(val)) return '0.00%';
  return Number(val).toFixed(2) + '%';
}

// Client-side calculation mirroring the server logic
function calculate(inputs) {
  const overheadKeys = OVERHEAD_FIELDS.map((f) => f.key);
  const totalAnnualOverhead = overheadKeys.reduce((sum, key) => sum + (parseFloat(inputs[key]) || 0), 0);
  const numTrucks = parseInt(inputs.num_trucks) || 1;
  const workingDays = parseFloat(inputs.working_days_per_year) || 125;
  const avgHours = parseFloat(inputs.avg_hours_per_day) || 8;
  const highestTechSalary = parseFloat(inputs.highest_tech_salary) || 0;
  const totalRevLastYear = parseFloat(inputs.total_revenue_last_year) || 0;

  const totalBillableHours = numTrucks * workingDays * avgHours;
  const billableHoursPerTruck = workingDays * avgHours;
  const revenueTarget = totalBillableHours === 0 ? 0 : totalAnnualOverhead / 0.50;
  const overheadHourlyRate = totalBillableHours === 0 ? 0 : revenueTarget / totalBillableHours;
  const techHourlyAddon = billableHoursPerTruck === 0 ? 0 : highestTechSalary / billableHoursPerTruck;
  const finalBillableHourlyRate = overheadHourlyRate + techHourlyAddon;
  const estYearlyGross = finalBillableHourlyRate * totalBillableHours;
  const annualPerTruck = numTrucks === 0 ? 0 : estYearlyGross / numTrucks;
  const dailyRevenueTotal = workingDays === 0 ? 0 : estYearlyGross / workingDays;
  const dailyRevenuePerTruck = numTrucks === 0 ? 0 : dailyRevenueTotal / numTrucks;
  const overheadPctOfRevenue = totalRevLastYear === 0 ? 0 : (totalAnnualOverhead / totalRevLastYear) * 100;

  return {
    totalAnnualOverhead: Math.round(totalAnnualOverhead * 100) / 100,
    totalBillableHours: Math.round(totalBillableHours * 100) / 100,
    billableHoursPerTruck: Math.round(billableHoursPerTruck * 100) / 100,
    revenueTarget: Math.round(revenueTarget * 100) / 100,
    overheadHourlyRate: Math.round(overheadHourlyRate * 100) / 100,
    techHourlyAddon: Math.round(techHourlyAddon * 100) / 100,
    finalBillableHourlyRate: Math.round(finalBillableHourlyRate * 100) / 100,
    estYearlyGross: Math.round(estYearlyGross * 100) / 100,
    annualPerTruck: Math.round(annualPerTruck * 100) / 100,
    dailyRevenueTotal: Math.round(dailyRevenueTotal * 100) / 100,
    dailyRevenuePerTruck: Math.round(dailyRevenuePerTruck * 100) / 100,
    overheadPctOfRevenue: Math.round(overheadPctOfRevenue * 100) / 100,
  };
}

export default function OverheadCalculator() {
  const [inputs, setInputs] = useState(DEFAULT_VALUES);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const autoSaveTimer = useRef(null);
  const debounceTimer = useRef(null);
  const inputsRef = useRef(inputs);
  inputsRef.current = inputs;

  // Load saved data on mount
  useEffect(() => {
    api.get('/overhead/me')
      .then((res) => {
        if (res.data.success && res.data.data.inputs) {
          const saved = res.data.data.inputs;
          const merged = { ...DEFAULT_VALUES };
          Object.keys(merged).forEach((key) => {
            if (saved[key] !== undefined && saved[key] !== null) {
              merged[key] = saved[key];
            }
          });
          setInputs(merged);
          setResults(res.data.data.calculations);
        } else {
          setResults(calculate(DEFAULT_VALUES));
        }
      })
      .catch(() => {
        setResults(calculate(DEFAULT_VALUES));
      })
      .finally(() => setLoading(false));
  }, []);

  // Auto-save every 60 seconds
  useEffect(() => {
    autoSaveTimer.current = setInterval(() => {
      saveToServer(inputsRef.current);
    }, 60000);
    return () => clearInterval(autoSaveTimer.current);
  }, [saveToServer]);

  const saveToServer = useCallback(async (data) => {
    try {
      setSaving(true);
      const res = await api.post('/overhead/save', data);
      if (res.data.success) {
        setResults(res.data.data.calculations);
        setToast('Saved');
        setTimeout(() => setToast(''), 2000);
      }
    } catch {
      // silent fail on auto-save
    } finally {
      setSaving(false);
    }
  }, []);

  const handleChange = (key, rawValue) => {
    let value;
    if (key === 'num_trucks') {
      const parsed = parseInt(rawValue);
      value = isNaN(parsed) ? 1 : Math.max(1, parsed);
    } else {
      value = rawValue === '' ? 0 : parseFloat(rawValue) || 0;
    }
    const updated = { ...inputs, [key]: value };
    setInputs(updated);

    // Debounce calculation
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setResults(calculate(updated));
    }, 300);
  };

  const handleManualSave = () => {
    saveToServer(inputs);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Toast */}
      {toast && (
        <div className="fixed top-20 right-4 z-50 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium animate-fade-in">
          ✓ {toast}
        </div>
      )}

      {/* Page header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Overhead & Hourly Rate Calculator</h1>
          <p className="text-gray-500 text-sm mt-1">Calculate your billable hourly rate to hit profit targets</p>
        </div>
        <button
          onClick={handleManualSave}
          disabled={saving}
          className="inline-flex items-center gap-2 bg-indigo-600 text-white font-semibold px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 text-sm"
        >
          {saving ? (
            <>
              <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
              Saving...
            </>
          ) : (
            'Save'
          )}
        </button>
      </div>

      {/* Key Results Cards */}
      {results && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <ResultCard
            label="Final Billable Hourly Rate"
            value={formatCurrency(results.finalBillableHourlyRate)}
            sub="/hr"
            color="indigo"
            large
          />
          <ResultCard
            label="Daily Revenue — Total Company"
            value={formatCurrency(results.dailyRevenueTotal)}
            color="blue"
            large
          />
          <ResultCard
            label="Daily Revenue — Per Truck"
            value={formatCurrency(results.dailyRevenuePerTruck)}
            color="cyan"
            large
          />
          <ResultCard
            label="Total Annual Overhead"
            value={formatCurrency(results.totalAnnualOverhead)}
            color="amber"
          />
          <ResultCard
            label="Revenue Target (50% margin)"
            value={formatCurrency(results.revenueTarget)}
            color="green"
          />
          <ResultCard
            label="Overhead % of Revenue"
            value={formatPct(results.overheadPctOfRevenue)}
            color={results.overheadPctOfRevenue <= 50 ? 'green' : 'red'}
            sub={results.overheadPctOfRevenue <= 50 ? 'Healthy' : 'Over 50% — Review costs'}
          />
        </div>
      )}

      {/* Secondary Results */}
      {results && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          <MiniCard label="Overhead Hourly Rate" value={formatCurrency(results.overheadHourlyRate)} />
          <MiniCard label="Tech Hourly Add-on" value={formatCurrency(results.techHourlyAddon)} />
          <MiniCard label="Total Billable Hours" value={results.totalBillableHours?.toLocaleString()} />
          <MiniCard label="Est. Yearly Gross" value={formatCurrency(results.estYearlyGross)} />
          <MiniCard label="Annual Per Truck" value={formatCurrency(results.annualPerTruck)} />
          <MiniCard label="Hours Per Truck" value={results.billableHoursPerTruck?.toLocaleString()} />
        </div>
      )}

      {/* Input Forms */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Company Overhead */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800">Company Overhead (Annual)</h2>
            <p className="text-xs text-gray-500 mt-0.5">Enter all annual overhead costs</p>
          </div>
          <div className="p-5 space-y-3">
            {OVERHEAD_FIELDS.map((field) => (
              <CurrencyField
                key={field.key}
                label={field.label}
                value={inputs[field.key]}
                onChange={(v) => handleChange(field.key, v)}
              />
            ))}
          </div>
        </div>

        <div className="space-y-6">
          {/* Technician Salaries */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800">Technician Salaries (Annual)</h2>
              <p className="text-xs text-gray-500 mt-0.5">Used for hourly rate add-on calculation</p>
            </div>
            <div className="p-5 space-y-3">
              {TECH_FIELDS.map((field) => (
                <CurrencyField
                  key={field.key}
                  label={field.label}
                  value={inputs[field.key]}
                  onChange={(v) => handleChange(field.key, v)}
                />
              ))}
            </div>
          </div>

          {/* Operational Inputs */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800">Operational Inputs</h2>
            </div>
            <div className="p-5 space-y-3">
              {OP_FIELDS.map((field) => (
                <NumberField
                  key={field.key}
                  label={field.label}
                  value={inputs[field.key]}
                  onChange={(v) => handleChange(field.key, v)}
                  min={field.min}
                  max={field.max}
                  step={field.type === 'integer' ? 1 : 0.5}
                />
              ))}
            </div>
          </div>

          {/* Revenue Last Year */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800">Revenue Benchmark</h2>
              <p className="text-xs text-gray-500 mt-0.5">Used to calculate overhead % of revenue</p>
            </div>
            <div className="p-5">
              <CurrencyField
                label="Total Revenue Last Year"
                value={inputs.total_revenue_last_year}
                onChange={(v) => handleChange('total_revenue_last_year', v)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Sub-components ---

function ResultCard({ label, value, sub, color = 'indigo', large }) {
  const colorMap = {
    indigo: 'bg-indigo-50 border-indigo-200 text-indigo-700',
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    cyan: 'bg-cyan-50 border-cyan-200 text-cyan-700',
    amber: 'bg-amber-50 border-amber-200 text-amber-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    red: 'bg-red-50 border-red-200 text-red-700',
  };
  return (
    <div className={`rounded-xl border p-5 ${colorMap[color] || colorMap.indigo}`}>
      <p className="text-xs font-medium uppercase tracking-wide opacity-75">{label}</p>
      <p className={`${large ? 'text-2xl sm:text-3xl' : 'text-xl'} font-bold mt-1`}>
        {value}
        {sub && <span className="text-sm font-normal ml-1 opacity-70">{sub}</span>}
      </p>
    </div>
  );
}

function MiniCard({ label, value }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-sm font-bold text-gray-800">{value}</p>
    </div>
  );
}

function CurrencyField({ label, value, onChange }) {
  return (
    <div>
      <label className="block text-sm text-gray-600 mb-1">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
        <input
          type="number"
          min="0"
          step="0.01"
          value={value || ''}
          onChange={(e) => onChange(e.target.value === '' ? 0 : parseFloat(e.target.value))}
          placeholder="0.00"
          className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>
    </div>
  );
}

function NumberField({ label, value, onChange, min, max, step = 1 }) {
  return (
    <div>
      <label className="block text-sm text-gray-600 mb-1">{label}</label>
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value || ''}
        onChange={(e) => onChange(e.target.value === '' ? 0 : parseFloat(e.target.value))}
        placeholder="0"
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
      />
    </div>
  );
}
