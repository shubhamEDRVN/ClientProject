import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../api/axios';

const DEFAULTS = {
  ownerSalary: 0,
  officeStaff1: 0,
  officeStaff2: 0,
  officeStaff3: 0,
  fuel: 0,
  vehicleMaintenance: 0,
  truck1: 0,
  truck2: 0,
  truck3: 0,
  loanPayments: 0,
  workersComp: 0,
  liabilityInsurance: 0,
  merchantFees: 0,
  autoInsurance: 0,
  shopRent: 0,
  cellular: 0,
  accounting: 0,
  softwareSubs: 0,
  marketing: 0,
  training: 0,
  uniforms: 0,
  tools: 0,
  payrollProcessing: 0,
  licenses: 0,
  misc: 0,
  highestTechSalary: 0,
  helperSalary: 0,
  numTrucks: 1,
  workingDaysPerYear: 125,
  avgHoursPerDay: 8,
  totalRevenueLastYear: 0,
};

const EMPTY_CALCS = {
  totalAnnualOverhead: '0.00',
  totalBillableHours: '0.00',
  revenueTarget: '0.00',
  overheadHourlyRate: '0.00',
  techHourlyAddon: '0.00',
  helperHourlyAddon: '0.00',
  finalBillableHourlyRate: '0.00',
  estYearlyGrossRevenue: '0.00',
  annualPerTruck: '0.00',
  dailyRevenueTotal: '0.00',
  dailyRevenuePerTruck: '0.00',
  overheadPercentOfLastYear: '0.00',
  billableHoursPerTruck: '0.00',
};

const fmt = (val) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(
    parseFloat(val) || 0
  );

const fmtNum = (val) =>
  new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(
    parseFloat(val) || 0
  );

function InputField({ label, name, value, onChange, onBlur, isInteger = false }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-600">{label}</label>
      <div className="relative">
        {!isInteger && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
        )}
        <input
          type="number"
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          min={0}
          step={isInteger ? 1 : 'any'}
          className={`w-full border border-gray-200 rounded-lg py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white ${
            isInteger ? 'pl-3' : 'pl-7'
          } pr-3`}
        />
      </div>
    </div>
  );
}

function SectionCard({ title, children }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-3 bg-gray-50 hover:bg-gray-100 transition"
        type="button"
      >
        <span className="font-semibold text-gray-700 text-sm">{title}</span>
        <span className="text-gray-400">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">{children}</div>}
    </div>
  );
}

export default function OverheadCalculator() {
  const [form, setForm] = useState(DEFAULTS);
  const [calcs, setCalcs] = useState(EMPTY_CALCS);
  const [saveStatus, setSaveStatus] = useState('idle'); // idle | saving | saved | error
  const [loading, setLoading] = useState(true);
  const hasChanges = useRef(false);
  const autoSaveTimer = useRef(null);

  // Load existing data on mount
  useEffect(() => {
    api
      .get('/overhead/calculations')
      .then((res) => {
        if (res.data.success) {
          const { inputs, calculations } = res.data.data;
          if (inputs && Object.keys(inputs).length > 0) {
            const merged = { ...DEFAULTS };
            Object.keys(DEFAULTS).forEach((k) => {
              if (inputs[k] !== undefined) merged[k] = inputs[k];
            });
            setForm(merged);
          }
          if (calculations) setCalcs(calculations);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Client-side calculation (instant preview)
  const calcLocally = useCallback((data) => {
    // Simple client-side sum for instant feedback
    const overheadFields = [
      'ownerSalary', 'officeStaff1', 'officeStaff2', 'officeStaff3',
      'fuel', 'vehicleMaintenance', 'truck1', 'truck2', 'truck3',
      'loanPayments', 'workersComp', 'liabilityInsurance', 'merchantFees',
      'shopRent', 'cellular', 'accounting', 'softwareSubs', 'marketing',
      'training', 'uniforms', 'tools', 'payrollProcessing', 'autoInsurance',
      'licenses', 'misc',
    ];
    const total = overheadFields.reduce((s, k) => s + (parseFloat(data[k]) || 0), 0);
    const trucks = Math.max(1, parseInt(data.numTrucks) || 1);
    const days = Math.max(1, parseInt(data.workingDaysPerYear) || 125);
    const hours = Math.max(1, parseFloat(data.avgHoursPerDay) || 8);
    const billableHoursPerTruck = days * hours;
    const totalBillableHours = trucks * billableHoursPerTruck;
    const revenueTarget = total / 0.5;
    const overheadHourlyRate = totalBillableHours > 0 ? revenueTarget / totalBillableHours : 0;
    const techAddon = billableHoursPerTruck > 0 ? (parseFloat(data.highestTechSalary) || 0) / billableHoursPerTruck : 0;
    const helperAddon = parseFloat(data.helperSalary) > 0 && billableHoursPerTruck > 0
      ? (parseFloat(data.helperSalary) || 0) / billableHoursPerTruck
      : 0;
    const finalRate = Math.round((overheadHourlyRate + techAddon + helperAddon) * 100) / 100;
    const estYearly = Math.round(finalRate * totalBillableHours * 100) / 100;
    const dailyTotal = days > 0 ? Math.round((estYearly / days) * 100) / 100 : 0;
    const dailyPerTruck = trucks > 0 ? Math.round((dailyTotal / trucks) * 100) / 100 : 0;
    const lastYear = parseFloat(data.totalRevenueLastYear) || 0;
    const overheadPct = lastYear > 0 ? Math.round((total / lastYear) * 10000) / 100 : 0;

    setCalcs({
      totalAnnualOverhead: total.toFixed(2),
      totalBillableHours: totalBillableHours.toFixed(2),
      revenueTarget: revenueTarget.toFixed(2),
      overheadHourlyRate: overheadHourlyRate.toFixed(2),
      techHourlyAddon: techAddon.toFixed(2),
      helperHourlyAddon: helperAddon.toFixed(2),
      finalBillableHourlyRate: finalRate.toFixed(2),
      estYearlyGrossRevenue: estYearly.toFixed(2),
      annualPerTruck: (trucks > 0 ? estYearly / trucks : 0).toFixed(2),
      dailyRevenueTotal: dailyTotal.toFixed(2),
      dailyRevenuePerTruck: dailyPerTruck.toFixed(2),
      overheadPercentOfLastYear: overheadPct.toFixed(2),
      billableHoursPerTruck: billableHoursPerTruck.toFixed(2),
    });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...form, [name]: value === '' ? 0 : parseFloat(value) || 0 };
    setForm(updated);
    calcLocally(updated);
    hasChanges.current = true;
  };

  const saveToServer = useCallback(
    async (data) => {
      setSaveStatus('saving');
      try {
        const res = await api.post('/overhead/save', data);
        if (res.data.success) {
          if (res.data.data?.calculations) setCalcs(res.data.data.calculations);
          setSaveStatus('saved');
          hasChanges.current = false;
          setTimeout(() => setSaveStatus('idle'), 3000);
        }
      } catch {
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    },
    []
  );

  const handleBlur = () => {
    if (hasChanges.current) {
      saveToServer(form);
    }
  };

  // Track latest form in a ref so the interval can access it without being a dependency
  const latestForm = useRef(form);
  useEffect(() => {
    latestForm.current = form;
  }, [form]);

  // Auto-save every 60 seconds if there are changes
  useEffect(() => {
    autoSaveTimer.current = setInterval(() => {
      if (hasChanges.current) {
        saveToServer(latestForm.current);
      }
    }, 60000);
    return () => clearInterval(autoSaveTimer.current);
  }, [saveToServer]);

  const overheadPct = parseFloat(calcs.overheadPercentOfLastYear) || 0;
  const pctColor =
    overheadPct === 0 ? 'text-gray-500' :
    overheadPct < 50 ? 'text-green-600' :
    overheadPct <= 60 ? 'text-yellow-600' :
    'text-red-600';
  const pctBg =
    overheadPct === 0 ? 'bg-gray-50' :
    overheadPct < 50 ? 'bg-green-50' :
    overheadPct <= 60 ? 'bg-yellow-50' :
    'bg-red-50';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  const inputProps = (name, isInteger = false) => ({
    name,
    value: form[name],
    onChange: handleChange,
    onBlur: handleBlur,
    isInteger,
  });

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Overhead &amp; Hourly Rate Calculator</h1>
          <p className="text-gray-500 text-sm mt-1">
            Enter your annual overhead costs to calculate your required billable hourly rate.
          </p>
        </div>
        <div className="text-sm font-medium">
          {saveStatus === 'saving' && <span className="text-indigo-500">Saving…</span>}
          {saveStatus === 'saved' && <span className="text-green-600">Saved ✅</span>}
          {saveStatus === 'error' && <span className="text-red-500">Save failed ❌</span>}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: Input form */}
        <div className="flex-1 space-y-4">
          <SectionCard title="Personnel Costs">
            <InputField label="Owner Salary" {...inputProps('ownerSalary')} />
            <InputField label="Office Staff 1" {...inputProps('officeStaff1')} />
            <InputField label="Office Staff 2" {...inputProps('officeStaff2')} />
            <InputField label="Office Staff 3" {...inputProps('officeStaff3')} />
          </SectionCard>

          <SectionCard title="Vehicle & Equipment">
            <InputField label="Fuel / Gas" {...inputProps('fuel')} />
            <InputField label="Vehicle Maintenance" {...inputProps('vehicleMaintenance')} />
            <InputField label="Truck 1 Payment" {...inputProps('truck1')} />
            <InputField label="Truck 2 Payment" {...inputProps('truck2')} />
            <InputField label="Truck 3 Payment" {...inputProps('truck3')} />
          </SectionCard>

          <SectionCard title="Insurance & Financial">
            <InputField label="Loan Payments" {...inputProps('loanPayments')} />
            <InputField label="Workers Comp" {...inputProps('workersComp')} />
            <InputField label="Liability Insurance" {...inputProps('liabilityInsurance')} />
            <InputField label="Merchant / CC Fees" {...inputProps('merchantFees')} />
            <InputField label="Auto Insurance" {...inputProps('autoInsurance')} />
          </SectionCard>

          <SectionCard title="Facilities & Operations">
            <InputField label="Shop / Lease / Rent" {...inputProps('shopRent')} />
            <InputField label="Cellular Services" {...inputProps('cellular')} />
            <InputField label="Accounting / Tax Prep" {...inputProps('accounting')} />
            <InputField label="Software Subscriptions" {...inputProps('softwareSubs')} />
          </SectionCard>

          <SectionCard title="Growth & Maintenance">
            <InputField label="Marketing / Advertising" {...inputProps('marketing')} />
            <InputField label="Training & Education" {...inputProps('training')} />
            <InputField label="Uniforms" {...inputProps('uniforms')} />
            <InputField label="Tools / Small Equipment" {...inputProps('tools')} />
            <InputField label="Payroll Processing" {...inputProps('payrollProcessing')} />
            <InputField label="License Renewals" {...inputProps('licenses')} />
            <InputField label="Miscellaneous" {...inputProps('misc')} />
          </SectionCard>

          <SectionCard title="Technician Costs (not in overhead sum)">
            <InputField label="Highest Paid Tech Burdened Salary (annual)" {...inputProps('highestTechSalary')} />
            <InputField label="Helper in Truck Burdened Salary (annual, optional)" {...inputProps('helperSalary')} />
          </SectionCard>

          <SectionCard title="Operational Settings">
            <InputField label="Number of Service Trucks" {...inputProps('numTrucks', true)} />
            <InputField label="Billable Working Days per Year" {...inputProps('workingDaysPerYear', true)} />
            <InputField label="Avg Billable Hours per Day" {...inputProps('avgHoursPerDay', true)} />
            <InputField label="Total Revenue Last Year" {...inputProps('totalRevenueLastYear')} />
          </SectionCard>
        </div>

        {/* Right: Results */}
        <div className="lg:w-80 xl:w-96 space-y-4">
          {/* Primary card */}
          <div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-md">
            <p className="text-indigo-200 text-sm font-medium mb-1">Final Billable Hourly Rate</p>
            <p className="text-4xl font-bold">
              {fmt(calcs.finalBillableHourlyRate)}
              <span className="text-xl font-normal text-indigo-200">/hr</span>
            </p>
            <p className="text-indigo-300 text-xs mt-2">
              Overhead: {fmt(calcs.overheadHourlyRate)}/hr
              {parseFloat(calcs.techHourlyAddon) > 0 && ` + Tech: ${fmt(calcs.techHourlyAddon)}/hr`}
              {parseFloat(calcs.helperHourlyAddon) > 0 && ` + Helper: ${fmt(calcs.helperHourlyAddon)}/hr`}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Daily Revenue Total */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <p className="text-xs text-gray-500 mb-1">Daily Revenue (Company)</p>
              <p className="text-xl font-bold text-gray-800">{fmt(calcs.dailyRevenueTotal)}</p>
            </div>

            {/* Daily Revenue Per Truck */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <p className="text-xs text-gray-500 mb-1">Daily Revenue / Truck</p>
              <p className="text-xl font-bold text-gray-800">{fmt(calcs.dailyRevenuePerTruck)}</p>
            </div>

            {/* Total Annual Overhead */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <p className="text-xs text-gray-500 mb-1">Total Annual Overhead</p>
              <p className="text-xl font-bold text-gray-800">{fmt(calcs.totalAnnualOverhead)}</p>
            </div>

            {/* Revenue Target */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <p className="text-xs text-gray-500 mb-1">Revenue Target (50% Margin)</p>
              <p className="text-xl font-bold text-gray-800">{fmt(calcs.revenueTarget)}</p>
            </div>
          </div>

          {/* Overhead % */}
          <div className={`rounded-xl border shadow-sm p-4 ${pctBg}`}>
            <p className="text-xs text-gray-500 mb-1">Overhead % of Last Year Revenue</p>
            <p className={`text-2xl font-bold ${pctColor}`}>
              {overheadPct === 0 ? '—' : `${calcs.overheadPercentOfLastYear}%`}
            </p>
            {overheadPct > 0 && (
              <p className={`text-xs mt-1 ${pctColor}`}>
                {overheadPct < 50 ? '✅ Healthy' : overheadPct <= 60 ? '⚠️ Borderline' : '🚨 Too High'}
              </p>
            )}
          </div>

          {/* Additional metrics */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">Additional Metrics</h3>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Total Billable Hours</span>
              <span className="font-medium text-gray-800">{fmtNum(calcs.totalBillableHours)} hrs</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Hours Per Truck</span>
              <span className="font-medium text-gray-800">{fmtNum(calcs.billableHoursPerTruck)} hrs</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Est. Yearly Gross Revenue</span>
              <span className="font-medium text-gray-800">{fmt(calcs.estYearlyGrossRevenue)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Annual Amount Per Truck</span>
              <span className="font-medium text-gray-800">{fmt(calcs.annualPerTruck)}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => saveToServer(form)}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl transition"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
