import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../api/axios';

const CATEGORIES = [
  { value: 'hvac', label: 'HVAC' },
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'general', label: 'General' },
];

const EMPTY_SERVICE = {
  name: '',
  category: 'general',
  description: '',
  material_cost: 0,
  material_markup_pct: 25,
  labor_hours: 1,
  hourly_rate_override: null,
};

function formatCurrency(val) {
  if (val == null || isNaN(val)) return '$0.00';
  return '$' + Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatPct(val) {
  if (val == null || isNaN(val)) return '0.0%';
  return Number(val).toFixed(1) + '%';
}

// Client-side calculation mirroring the server logic
function calculateItem(svc, fallbackRate) {
  const materialCost = parseFloat(svc.material_cost) || 0;
  const markupPct = parseFloat(svc.material_markup_pct) ?? 25;
  const laborHours = parseFloat(svc.labor_hours) || 0;
  const rate = svc.hourly_rate_override != null ? parseFloat(svc.hourly_rate_override) : fallbackRate;

  const materialPrice = materialCost * (1 + markupPct / 100);
  const laborPrice = laborHours * rate;
  const totalPrice = materialPrice + laborPrice;
  const grossProfit = totalPrice - materialCost;
  const marginPct = totalPrice === 0 ? 0 : (grossProfit / totalPrice) * 100;

  return {
    hourly_rate_used: Math.round(rate * 100) / 100,
    material_price: Math.round(materialPrice * 100) / 100,
    labor_price: Math.round(laborPrice * 100) / 100,
    total_price: Math.round(totalPrice * 100) / 100,
    gross_profit: Math.round(grossProfit * 100) / 100,
    margin_pct: Math.round(marginPct * 10) / 10,
  };
}

export default function PricingMatrix() {
  const [services, setServices] = useState([]);
  const [defaultMarkup, setDefaultMarkup] = useState(25);
  const [hourlyRate, setHourlyRate] = useState(0);
  const [calculations, setCalculations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const autoSaveTimer = useRef(null);
  const servicesRef = useRef(services);
  const defaultMarkupRef = useRef(defaultMarkup);
  servicesRef.current = services;
  defaultMarkupRef.current = defaultMarkup;

  // Load saved data on mount
  useEffect(() => {
    api.get('/pricing/me')
      .then((res) => {
        if (res.data.success && res.data.data.inputs) {
          const saved = res.data.data.inputs;
          setServices(saved.services || []);
          setDefaultMarkup(saved.default_markup_pct ?? 25);
          setHourlyRate(res.data.data.hourlyRate || 0);
          setCalculations(res.data.data.calculations || []);
        } else {
          setHourlyRate(res.data.data?.hourlyRate || 0);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Recalculate when services or rate change
  useEffect(() => {
    if (!loading) {
      const calcs = services.map((svc) => calculateItem(svc, hourlyRate));
      setCalculations(calcs);
    }
  }, [services, hourlyRate, loading]);

  const saveToServer = useCallback(async (svcData, markupData) => {
    try {
      setSaving(true);
      const payload = {
        services: svcData,
        default_markup_pct: markupData,
      };
      const res = await api.post('/pricing/save', payload);
      if (res.data.success) {
        setCalculations(res.data.data.calculations || []);
        setHourlyRate(res.data.data.hourlyRate || 0);
        setToast('Saved');
        setTimeout(() => setToast(''), 2000);
      }
    } catch {
      // silent fail on auto-save
    } finally {
      setSaving(false);
    }
  }, []);

  // Auto-save every 60 seconds
  useEffect(() => {
    autoSaveTimer.current = setInterval(() => {
      if (servicesRef.current.length > 0) {
        saveToServer(servicesRef.current, defaultMarkupRef.current);
      }
    }, 60000);
    return () => clearInterval(autoSaveTimer.current);
  }, [saveToServer]);

  const handleManualSave = () => {
    saveToServer(services, defaultMarkup);
  };

  const addService = () => {
    setServices([
      ...services,
      { ...EMPTY_SERVICE, material_markup_pct: defaultMarkup },
    ]);
  };

  const removeService = (index) => {
    setServices(services.filter((_, i) => i !== index));
  };

  const updateService = (index, field, rawValue) => {
    const updated = [...services];
    if (['material_cost', 'material_markup_pct', 'labor_hours'].includes(field)) {
      updated[index] = { ...updated[index], [field]: rawValue === '' ? 0 : parseFloat(rawValue) || 0 };
    } else if (field === 'hourly_rate_override') {
      updated[index] = { ...updated[index], [field]: rawValue === '' ? null : parseFloat(rawValue) || null };
    } else {
      updated[index] = { ...updated[index], [field]: rawValue };
    }
    setServices(updated);
  };

  const duplicateService = (index) => {
    const copy = { ...services[index], name: services[index].name + ' (Copy)' };
    delete copy._id;
    const updated = [...services];
    updated.splice(index + 1, 0, copy);
    setServices(updated);
  };

  // Summary calculations
  const totals = calculations.reduce(
    (acc, c) => ({
      totalRevenue: acc.totalRevenue + (c.total_price || 0),
      totalProfit: acc.totalProfit + (c.gross_profit || 0),
      totalMaterial: acc.totalMaterial + (c.material_price || 0),
      totalLabor: acc.totalLabor + (c.labor_price || 0),
    }),
    { totalRevenue: 0, totalProfit: 0, totalMaterial: 0, totalLabor: 0 }
  );
  const avgMargin = totals.totalRevenue === 0 ? 0 : (totals.totalProfit / totals.totalRevenue) * 100;

  const filteredIndices = services
    .map((_, i) => i)
    .filter((i) => filterCategory === 'all' || services[i].category === filterCategory);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Toast */}
      {toast && (
        <div className="fixed top-20 right-4 z-50 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium">
          ✓ {toast}
        </div>
      )}

      {/* Page header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Pricing Matrix</h1>
          <p className="text-gray-500 text-sm mt-1">
            Build your service pricing using your{' '}
            <span className="font-semibold text-indigo-600">
              {formatCurrency(hourlyRate)}/hr
            </span>{' '}
            billable rate
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={addService}
            className="inline-flex items-center gap-2 bg-white border border-gray-300 text-gray-700 font-medium px-4 py-2.5 rounded-lg hover:bg-gray-50 transition text-sm"
          >
            + Add Service
          </button>
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
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <SummaryCard
          label="Hourly Rate"
          value={formatCurrency(hourlyRate)}
          sub="/hr from Overhead"
          color="indigo"
        />
        <SummaryCard
          label="Total Services"
          value={services.length.toString()}
          sub={services.length === 1 ? 'service' : 'services'}
          color="blue"
        />
        <SummaryCard
          label="Avg Margin"
          value={formatPct(avgMargin)}
          color={avgMargin >= 40 ? 'green' : avgMargin >= 20 ? 'amber' : 'red'}
          sub={avgMargin >= 40 ? 'Healthy' : avgMargin >= 20 ? 'Moderate' : 'Low'}
        />
        <SummaryCard
          label="Total Revenue (All)"
          value={formatCurrency(totals.totalRevenue)}
          color="green"
        />
        <SummaryCard
          label="Total Profit (All)"
          value={formatCurrency(totals.totalProfit)}
          color="cyan"
        />
      </div>

      {/* Default Markup + Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600 whitespace-nowrap">Default Material Markup:</label>
          <div className="relative w-24">
            <input
              type="number"
              min="0"
              max="500"
              step="1"
              value={defaultMarkup}
              onChange={(e) => setDefaultMarkup(e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
              className="w-full pr-7 pl-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Filter:</label>
          <div className="flex gap-1">
            {[{ value: 'all', label: 'All' }, ...CATEGORIES].map((cat) => (
              <button
                key={cat.value}
                onClick={() => setFilterCategory(cat.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  filterCategory === cat.value
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Service Items */}
      {services.length === 0 ? (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-8 text-center">
          <p className="text-3xl mb-3">📋</p>
          <h3 className="text-indigo-800 font-semibold text-lg">No services yet</h3>
          <p className="text-indigo-600 text-sm mt-1 mb-4">
            Add your first service to start building your pricing matrix.
          </p>
          <button
            onClick={addService}
            className="inline-flex items-center gap-2 bg-indigo-600 text-white font-semibold px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition text-sm"
          >
            + Add First Service
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredIndices.map((idx) => {
            const svc = services[idx];
            const calc = calculations[idx] || {};
            return (
              <ServiceCard
                key={svc._id || idx}
                index={idx}
                service={svc}
                calc={calc}
                hourlyRate={hourlyRate}
                onUpdate={updateService}
                onRemove={removeService}
                onDuplicate={duplicateService}
              />
            );
          })}
        </div>
      )}

      {/* Bottom summary table when there are services */}
      {services.length > 0 && (
        <div className="mt-8 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800">Pricing Summary</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-4 py-3 font-medium text-gray-600">Service</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Category</th>
                  <th className="px-4 py-3 font-medium text-gray-600 text-right">Material</th>
                  <th className="px-4 py-3 font-medium text-gray-600 text-right">Labor</th>
                  <th className="px-4 py-3 font-medium text-gray-600 text-right">Total Price</th>
                  <th className="px-4 py-3 font-medium text-gray-600 text-right">Profit</th>
                  <th className="px-4 py-3 font-medium text-gray-600 text-right">Margin</th>
                </tr>
              </thead>
              <tbody>
                {services.map((svc, idx) => {
                  const calc = calculations[idx] || {};
                  return (
                    <tr key={svc._id || idx} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">{svc.name || 'Untitled'}</td>
                      <td className="px-4 py-3">
                        <CategoryBadge category={svc.category} />
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700">{formatCurrency(calc.material_price)}</td>
                      <td className="px-4 py-3 text-right text-gray-700">{formatCurrency(calc.labor_price)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-800">{formatCurrency(calc.total_price)}</td>
                      <td className="px-4 py-3 text-right text-green-600 font-medium">{formatCurrency(calc.gross_profit)}</td>
                      <td className="px-4 py-3 text-right">
                        <MarginBadge value={calc.margin_pct} />
                      </td>
                    </tr>
                  );
                })}
                {/* Totals row */}
                <tr className="border-t-2 border-gray-300 bg-gray-50 font-semibold">
                  <td className="px-4 py-3 text-gray-800">Totals</td>
                  <td className="px-4 py-3"></td>
                  <td className="px-4 py-3 text-right text-gray-700">{formatCurrency(totals.totalMaterial)}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{formatCurrency(totals.totalLabor)}</td>
                  <td className="px-4 py-3 text-right text-gray-800">{formatCurrency(totals.totalRevenue)}</td>
                  <td className="px-4 py-3 text-right text-green-600">{formatCurrency(totals.totalProfit)}</td>
                  <td className="px-4 py-3 text-right">
                    <MarginBadge value={avgMargin} />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Sub-components ---

function ServiceCard({ index, service, calc, hourlyRate, onUpdate, onRemove, onDuplicate }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      {/* Card header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-gray-400 hover:text-gray-600 transition"
          title={expanded ? 'Collapse' : 'Expand'}
        >
          <svg
            className={`w-5 h-5 transition-transform ${expanded ? 'rotate-90' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <span className="text-sm text-gray-400 font-mono">#{index + 1}</span>
        <span className="font-semibold text-gray-800 flex-1 truncate">
          {service.name || 'New Service'}
        </span>
        <CategoryBadge category={service.category} />
        <span className="text-lg font-bold text-indigo-600">{formatCurrency(calc.total_price)}</span>
        <MarginBadge value={calc.margin_pct} />
        <div className="flex gap-1 ml-2">
          <button
            onClick={() => onDuplicate(index)}
            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition"
            title="Duplicate"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
          <button
            onClick={() => onRemove(index)}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition"
            title="Remove"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Card body (collapsible) */}
      {expanded && (
        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Inputs */}
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Service Name</label>
                <input
                  type="text"
                  value={service.name}
                  onChange={(e) => onUpdate(index, 'name', e.target.value)}
                  placeholder="e.g. AC Repair — Standard"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Category</label>
                  <select
                    value={service.category}
                    onChange={(e) => onUpdate(index, 'category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Description</label>
                  <input
                    type="text"
                    value={service.description}
                    onChange={(e) => onUpdate(index, 'description', e.target.value)}
                    placeholder="Optional notes"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Material Cost</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={service.material_cost || ''}
                      onChange={(e) => onUpdate(index, 'material_cost', e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Material Markup</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="500"
                      step="1"
                      value={service.material_markup_pct || ''}
                      onChange={(e) => onUpdate(index, 'material_markup_pct', e.target.value)}
                      placeholder="25"
                      className="w-full pr-7 pl-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Labor Hours</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={service.labor_hours || ''}
                    onChange={(e) => onUpdate(index, 'labor_hours', e.target.value)}
                    placeholder="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Rate Override
                    <span className="text-xs text-gray-400 ml-1">(optional)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={service.hourly_rate_override ?? ''}
                      onChange={(e) => onUpdate(index, 'hourly_rate_override', e.target.value)}
                      placeholder={hourlyRate ? hourlyRate.toFixed(2) : '0.00'}
                      className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Calculated results */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Pricing Breakdown</h3>
              <div className="space-y-2">
                <PricingRow label="Material Cost" value={formatCurrency(service.material_cost)} />
                <PricingRow label={`+ Markup (${service.material_markup_pct || 0}%)`} value={formatCurrency((calc.material_price || 0) - (service.material_cost || 0))} muted />
                <PricingRow label="= Material Price" value={formatCurrency(calc.material_price)} bold />
                <div className="border-t border-gray-200 my-2"></div>
                <PricingRow label={`Labor (${service.labor_hours || 0}h × ${formatCurrency(calc.hourly_rate_used)}/hr)`} value={formatCurrency(calc.labor_price)} />
                <div className="border-t border-gray-200 my-2"></div>
                <PricingRow label="Total Price" value={formatCurrency(calc.total_price)} bold large />
                <PricingRow label="Gross Profit" value={formatCurrency(calc.gross_profit)} green />
                <PricingRow label="Margin" value={formatPct(calc.margin_pct)} green />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, sub, color = 'indigo' }) {
  const colorMap = {
    indigo: 'bg-indigo-50 border-indigo-200 text-indigo-700',
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    amber: 'bg-amber-50 border-amber-200 text-amber-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    red: 'bg-red-50 border-red-200 text-red-700',
    cyan: 'bg-cyan-50 border-cyan-200 text-cyan-700',
  };
  return (
    <div className={`rounded-xl border p-5 ${colorMap[color] || colorMap.indigo}`}>
      <p className="text-xs font-medium uppercase tracking-wide opacity-75">{label}</p>
      <p className="text-2xl font-bold mt-1">
        {value}
        {sub && <span className="text-sm font-normal ml-1 opacity-70">{sub}</span>}
      </p>
    </div>
  );
}

function PricingRow({ label, value, bold, large, muted, green }) {
  return (
    <div className="flex justify-between items-center">
      <span className={`text-sm ${muted ? 'text-gray-400' : 'text-gray-600'}`}>{label}</span>
      <span
        className={`text-sm ${bold ? 'font-bold text-gray-800' : ''} ${large ? 'text-lg' : ''} ${
          green ? 'text-green-600 font-medium' : ''
        } ${muted ? 'text-gray-400' : ''}`}
      >
        {value}
      </span>
    </div>
  );
}

function CategoryBadge({ category }) {
  const colors = {
    hvac: 'bg-orange-100 text-orange-700',
    plumbing: 'bg-blue-100 text-blue-700',
    electrical: 'bg-yellow-100 text-yellow-700',
    general: 'bg-gray-100 text-gray-600',
  };
  const labels = { hvac: 'HVAC', plumbing: 'Plumbing', electrical: 'Electrical', general: 'General' };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors[category] || colors.general}`}>
      {labels[category] || category}
    </span>
  );
}

function MarginBadge({ value }) {
  const v = value || 0;
  let color = 'bg-red-100 text-red-700';
  if (v >= 40) color = 'bg-green-100 text-green-700';
  else if (v >= 20) color = 'bg-amber-100 text-amber-700';
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${color}`}>
      {formatPct(v)}
    </span>
  );
}
