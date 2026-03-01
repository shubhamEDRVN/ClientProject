import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const CATEGORIES = [
  { value: 'hvac', label: 'HVAC' },
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'general', label: 'General' },
];

const STATUSES = [
  { value: 'draft', label: 'Draft', color: 'bg-gray-100 text-gray-700' },
  { value: 'sent', label: 'Sent', color: 'bg-blue-100 text-blue-700' },
  { value: 'accepted', label: 'Accepted', color: 'bg-green-100 text-green-700' },
  { value: 'completed', label: 'Completed', color: 'bg-indigo-100 text-indigo-700' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-700' },
];

const EMPTY_LINE_ITEM = {
  name: '',
  category: 'general',
  description: '',
  material_cost: 0,
  material_markup_pct: 25,
  labor_hours: 0,
  hourly_rate_override: null,
  quantity: 1,
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
function calculateItem(item, fallbackRate) {
  const materialCost = parseFloat(item.material_cost) || 0;
  const markupPct = parseFloat(item.material_markup_pct) ?? 25;
  const laborHours = parseFloat(item.labor_hours) || 0;
  const rate = item.hourly_rate_override != null ? parseFloat(item.hourly_rate_override) : fallbackRate;
  const quantity = parseInt(item.quantity) || 1;

  const materialPrice = materialCost * (1 + markupPct / 100);
  const laborPrice = laborHours * rate;
  const unitPrice = materialPrice + laborPrice;
  const lineTotal = unitPrice * quantity;
  const lineCost = materialCost * quantity;
  const lineProfit = lineTotal - lineCost;
  const marginPct = lineTotal === 0 ? 0 : (lineProfit / lineTotal) * 100;

  return {
    hourly_rate_used: Math.round(rate * 100) / 100,
    material_price: Math.round(materialPrice * 100) / 100,
    labor_price: Math.round(laborPrice * 100) / 100,
    unit_price: Math.round(unitPrice * 100) / 100,
    line_total: Math.round(lineTotal * 100) / 100,
    line_cost: Math.round(lineCost * 100) / 100,
    line_profit: Math.round(lineProfit * 100) / 100,
    margin_pct: Math.round(marginPct * 10) / 10,
  };
}

function calculateTotals(calculations) {
  return calculations.reduce(
    (acc, c) => ({
      total_materials: acc.total_materials + (c.line_cost || 0),
      total_revenue: acc.total_revenue + (c.line_total || 0),
      total_profit: acc.total_profit + (c.line_profit || 0),
    }),
    { total_materials: 0, total_revenue: 0, total_profit: 0 }
  );
}

export default function JobCosting() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list'); // 'list' | 'detail'
  const [activeJob, setActiveJob] = useState(null);
  const [hourlyRate, setHourlyRate] = useState(0);
  const [calculations, setCalculations] = useState([]);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  // Load jobs list
  const loadJobs = useCallback(async () => {
    try {
      const res = await api.get('/jobs');
      if (res.data.success) {
        setJobs(res.data.data.jobs || []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  // Load a single job with calculations
  const openJob = async (jobId) => {
    try {
      setLoading(true);
      const res = await api.get(`/jobs/${jobId}`);
      if (res.data.success) {
        setActiveJob(res.data.data.job);
        setCalculations(res.data.data.calculations || []);
        setHourlyRate(res.data.data.hourlyRate || 0);
        setView('detail');
      }
    } catch {
      showToast('Failed to load job');
    } finally {
      setLoading(false);
    }
  };

  // Create new job
  const createJob = async () => {
    try {
      setSaving(true);
      const res = await api.post('/jobs', {
        job_name: 'New Job',
        customer_name: '',
        status: 'draft',
        line_items: [],
        notes: '',
      });
      if (res.data.success) {
        setActiveJob(res.data.data.job);
        setCalculations(res.data.data.calculations || []);
        setHourlyRate(res.data.data.hourlyRate || 0);
        setView('detail');
        showToast('Job created');
      }
    } catch {
      showToast('Failed to create job');
    } finally {
      setSaving(false);
    }
  };

  // Save active job
  const saveJob = async () => {
    if (!activeJob) return;
    try {
      setSaving(true);
      const payload = {
        job_name: activeJob.job_name,
        customer_name: activeJob.customer_name,
        status: activeJob.status,
        line_items: activeJob.line_items,
        notes: activeJob.notes,
      };
      const res = await api.put(`/jobs/${activeJob._id}`, payload);
      if (res.data.success) {
        setActiveJob(res.data.data.job);
        setCalculations(res.data.data.calculations || []);
        setHourlyRate(res.data.data.hourlyRate || 0);
        showToast('Job saved');
      }
    } catch {
      showToast('Failed to save job');
    } finally {
      setSaving(false);
    }
  };

  // Delete a job
  const deleteJob = async (jobId) => {
    try {
      await api.delete(`/jobs/${jobId}`);
      setJobs(jobs.filter((j) => j._id !== jobId));
      if (activeJob && activeJob._id === jobId) {
        setActiveJob(null);
        setView('list');
      }
      showToast('Job deleted');
    } catch {
      showToast('Failed to delete job');
    }
  };

  // Go back to list
  const backToList = () => {
    setActiveJob(null);
    setView('list');
    loadJobs();
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2000);
  };

  // Update active job fields
  const updateJobField = (field, value) => {
    setActiveJob((prev) => ({ ...prev, [field]: value }));
  };

  // Line item operations
  const addLineItem = () => {
    const updated = { ...activeJob, line_items: [...activeJob.line_items, { ...EMPTY_LINE_ITEM }] };
    setActiveJob(updated);
  };

  const removeLineItem = (index) => {
    const updated = { ...activeJob, line_items: activeJob.line_items.filter((_, i) => i !== index) };
    setActiveJob(updated);
  };

  const updateLineItem = (index, field, rawValue) => {
    const items = [...activeJob.line_items];
    if (['material_cost', 'material_markup_pct', 'labor_hours'].includes(field)) {
      items[index] = { ...items[index], [field]: rawValue === '' ? 0 : parseFloat(rawValue) || 0 };
    } else if (field === 'hourly_rate_override') {
      const parsed = parseFloat(rawValue);
      items[index] = { ...items[index], [field]: rawValue === '' ? null : isNaN(parsed) ? null : parsed };
    } else if (field === 'quantity') {
      items[index] = { ...items[index], [field]: rawValue === '' ? 1 : Math.max(1, parseInt(rawValue) || 1) };
    } else {
      items[index] = { ...items[index], [field]: rawValue };
    }
    setActiveJob({ ...activeJob, line_items: items });
  };

  const duplicateLineItem = (index) => {
    const copy = { ...activeJob.line_items[index], name: activeJob.line_items[index].name + ' (Copy)' };
    delete copy._id;
    const items = [...activeJob.line_items];
    items.splice(index + 1, 0, copy);
    setActiveJob({ ...activeJob, line_items: items });
  };

  // Recalculate when active job line items change
  useEffect(() => {
    if (activeJob && activeJob.line_items) {
      const calcs = activeJob.line_items.map((item) => calculateItem(item, hourlyRate));
      setCalculations(calcs);
    }
  }, [activeJob?.line_items, hourlyRate]);

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

      {view === 'list' ? (
        <JobList
          jobs={jobs}
          onOpen={openJob}
          onCreate={createJob}
          onDelete={deleteJob}
          saving={saving}
        />
      ) : (
        <JobDetail
          job={activeJob}
          calculations={calculations}
          hourlyRate={hourlyRate}
          saving={saving}
          onBack={backToList}
          onSave={saveJob}
          onUpdateField={updateJobField}
          onAddLineItem={addLineItem}
          onRemoveLineItem={removeLineItem}
          onUpdateLineItem={updateLineItem}
          onDuplicateLineItem={duplicateLineItem}
        />
      )}
    </div>
  );
}

// --- Job List View ---

function JobList({ jobs, onOpen, onCreate, onDelete, saving }) {
  const [confirmDelete, setConfirmDelete] = useState(null);

  const handleDelete = (jobId) => {
    onDelete(jobId);
    setConfirmDelete(null);
  };

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Job Costing</h1>
          <p className="text-gray-500 text-sm mt-1">Create and manage job estimates with detailed cost breakdowns</p>
        </div>
        <button
          onClick={onCreate}
          disabled={saving}
          className="inline-flex items-center gap-2 bg-indigo-600 text-white font-semibold px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 text-sm"
        >
          {saving ? (
            <>
              <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
              Creating...
            </>
          ) : (
            '+ New Job'
          )}
        </button>
      </div>

      {jobs.length === 0 ? (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-8 text-center">
          <p className="text-3xl mb-3">💰</p>
          <h3 className="text-indigo-800 font-semibold text-lg">No jobs yet</h3>
          <p className="text-indigo-600 text-sm mt-1 mb-4">
            Create your first job to start building estimates with accurate cost breakdowns.
          </p>
          <button
            onClick={onCreate}
            disabled={saving}
            className="inline-flex items-center gap-2 bg-indigo-600 text-white font-semibold px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 text-sm"
          >
            + Create First Job
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => {
            const status = STATUSES.find((s) => s.value === job.status) || STATUSES[0];
            const lineCount = job.line_items?.length || 0;
            return (
              <div
                key={job._id}
                className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition p-5 flex flex-col sm:flex-row sm:items-center gap-4"
              >
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onOpen(job._id)}>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-base font-semibold text-gray-800 truncate">{job.job_name}</h3>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${status.color}`}>
                      {status.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    {job.customer_name && <span>👤 {job.customer_name}</span>}
                    <span>📋 {lineCount} {lineCount === 1 ? 'item' : 'items'}</span>
                    <span>📅 {new Date(job.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onOpen(job._id)}
                    className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition"
                  >
                    Open
                  </button>
                  {confirmDelete === job._id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDelete(job._id)}
                        className="px-3 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(job._id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Delete"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// --- Job Detail View ---

function JobDetail({
  job,
  calculations,
  hourlyRate,
  saving,
  onBack,
  onSave,
  onUpdateField,
  onAddLineItem,
  onRemoveLineItem,
  onUpdateLineItem,
  onDuplicateLineItem,
}) {
  const totals = calculateTotals(calculations);
  const overallMargin = totals.total_revenue === 0 ? 0 : (totals.total_profit / totals.total_revenue) * 100;
  const status = STATUSES.find((s) => s.value === job.status) || STATUSES[0];

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
            title="Back to Jobs"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{job.job_name || 'Untitled Job'}</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Using <span className="font-semibold text-indigo-600">{formatCurrency(hourlyRate)}/hr</span> billable rate
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onAddLineItem}
            className="inline-flex items-center gap-2 bg-white border border-gray-300 text-gray-700 font-medium px-4 py-2.5 rounded-lg hover:bg-gray-50 transition text-sm"
          >
            + Add Item
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="inline-flex items-center gap-2 bg-indigo-600 text-white font-semibold px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 text-sm"
          >
            {saving ? (
              <>
                <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                Saving...
              </>
            ) : (
              'Save Job'
            )}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <SummaryCard label="Total Revenue" value={formatCurrency(totals.total_revenue)} color="indigo" />
        <SummaryCard label="Total Materials (COGS)" value={formatCurrency(totals.total_materials)} color="amber" />
        <SummaryCard label="Total Profit" value={formatCurrency(totals.total_profit)} color="green" />
        <SummaryCard
          label="Overall Margin"
          value={formatPct(overallMargin)}
          color={overallMargin >= 40 ? 'green' : overallMargin >= 20 ? 'amber' : 'red'}
        />
        <SummaryCard label="Line Items" value={String(job.line_items?.length || 0)} color="blue" />
      </div>

      {/* Job Details Form */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">Job Details</h2>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Job Name</label>
            <input
              type="text"
              value={job.job_name || ''}
              onChange={(e) => onUpdateField('job_name', e.target.value)}
              placeholder="e.g. Smith Residence AC Install"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Customer Name</label>
            <input
              type="text"
              value={job.customer_name || ''}
              onChange={(e) => onUpdateField('customer_name', e.target.value)}
              placeholder="e.g. John Smith"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Status</label>
            <select
              value={job.status || 'draft'}
              onChange={(e) => onUpdateField('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
            >
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Notes</label>
            <input
              type="text"
              value={job.notes || ''}
              onChange={(e) => onUpdateField('notes', e.target.value)}
              placeholder="Optional notes"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Line Items */}
      {(!job.line_items || job.line_items.length === 0) ? (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-8 text-center">
          <p className="text-3xl mb-3">📋</p>
          <h3 className="text-indigo-800 font-semibold text-lg">No line items yet</h3>
          <p className="text-indigo-600 text-sm mt-1 mb-4">
            Add line items to build your job estimate.
          </p>
          <button
            onClick={onAddLineItem}
            className="inline-flex items-center gap-2 bg-indigo-600 text-white font-semibold px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition text-sm"
          >
            + Add First Item
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {job.line_items.map((item, idx) => {
            const calc = calculations[idx] || {};
            return (
              <LineItemCard
                key={item._id || idx}
                index={idx}
                item={item}
                calc={calc}
                hourlyRate={hourlyRate}
                onUpdate={onUpdateLineItem}
                onRemove={onRemoveLineItem}
                onDuplicate={onDuplicateLineItem}
              />
            );
          })}
        </div>
      )}

      {/* Summary Table */}
      {job.line_items && job.line_items.length > 0 && (
        <div className="mt-8 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800">Job Cost Summary</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-4 py-3 font-medium text-gray-600">Item</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Category</th>
                  <th className="px-4 py-3 font-medium text-gray-600 text-right">Qty</th>
                  <th className="px-4 py-3 font-medium text-gray-600 text-right">Unit Price</th>
                  <th className="px-4 py-3 font-medium text-gray-600 text-right">Line Total</th>
                  <th className="px-4 py-3 font-medium text-gray-600 text-right">COGS</th>
                  <th className="px-4 py-3 font-medium text-gray-600 text-right">Profit</th>
                  <th className="px-4 py-3 font-medium text-gray-600 text-right">Margin</th>
                </tr>
              </thead>
              <tbody>
                {job.line_items.map((item, idx) => {
                  const calc = calculations[idx] || {};
                  return (
                    <tr key={item._id || idx} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">{item.name || 'Untitled'}</td>
                      <td className="px-4 py-3">
                        <CategoryBadge category={item.category} />
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700">{item.quantity || 1}</td>
                      <td className="px-4 py-3 text-right text-gray-700">{formatCurrency(calc.unit_price)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-800">{formatCurrency(calc.line_total)}</td>
                      <td className="px-4 py-3 text-right text-amber-600">{formatCurrency(calc.line_cost)}</td>
                      <td className="px-4 py-3 text-right text-green-600 font-medium">{formatCurrency(calc.line_profit)}</td>
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
                  <td className="px-4 py-3"></td>
                  <td className="px-4 py-3"></td>
                  <td className="px-4 py-3 text-right text-gray-800">{formatCurrency(totals.total_revenue)}</td>
                  <td className="px-4 py-3 text-right text-amber-600">{formatCurrency(totals.total_materials)}</td>
                  <td className="px-4 py-3 text-right text-green-600">{formatCurrency(totals.total_profit)}</td>
                  <td className="px-4 py-3 text-right">
                    <MarginBadge value={overallMargin} />
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

// --- Line Item Card ---

function LineItemCard({ index, item, calc, hourlyRate, onUpdate, onRemove, onDuplicate }) {
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
          {item.name || 'New Item'}
        </span>
        <CategoryBadge category={item.category} />
        {(item.quantity || 1) > 1 && (
          <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
            ×{item.quantity}
          </span>
        )}
        <span className="text-lg font-bold text-indigo-600">{formatCurrency(calc.line_total)}</span>
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
                <label className="block text-sm text-gray-600 mb-1">Item Name</label>
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) => onUpdate(index, 'name', e.target.value)}
                  placeholder="e.g. AC Condenser Unit"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Category</label>
                  <select
                    value={item.category}
                    onChange={(e) => onUpdate(index, 'category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={item.quantity || 1}
                    onChange={(e) => onUpdate(index, 'quantity', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Description</label>
                <input
                  type="text"
                  value={item.description}
                  onChange={(e) => onUpdate(index, 'description', e.target.value)}
                  placeholder="Optional notes"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
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
                      value={item.material_cost || ''}
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
                      value={item.material_markup_pct || ''}
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
                    value={item.labor_hours || ''}
                    onChange={(e) => onUpdate(index, 'labor_hours', e.target.value)}
                    placeholder="0"
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
                      value={item.hourly_rate_override ?? ''}
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
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Cost Breakdown</h3>
              <div className="space-y-2">
                <PricingRow label="Material Cost" value={formatCurrency(item.material_cost)} />
                <PricingRow label={`+ Markup (${item.material_markup_pct || 0}%)`} value={formatCurrency((calc.material_price || 0) - (item.material_cost || 0))} muted />
                <PricingRow label="= Material Price" value={formatCurrency(calc.material_price)} bold />
                <div className="border-t border-gray-200 my-2"></div>
                <PricingRow label={`Labor (${item.labor_hours || 0}h × ${formatCurrency(calc.hourly_rate_used)}/hr)`} value={formatCurrency(calc.labor_price)} />
                <div className="border-t border-gray-200 my-2"></div>
                <PricingRow label="Unit Price" value={formatCurrency(calc.unit_price)} bold />
                {(item.quantity || 1) > 1 && (
                  <PricingRow label={`× Quantity (${item.quantity})`} value={formatCurrency(calc.line_total)} bold large />
                )}
                {(item.quantity || 1) === 1 && (
                  <PricingRow label="Line Total" value={formatCurrency(calc.line_total)} bold large />
                )}
                <div className="border-t border-gray-200 my-2"></div>
                <PricingRow label="COGS (Materials)" value={formatCurrency(calc.line_cost)} amber />
                <PricingRow label="Profit" value={formatCurrency(calc.line_profit)} green />
                <PricingRow label="Margin" value={formatPct(calc.margin_pct)} green />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Sub-components ---

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

function PricingRow({ label, value, bold, large, muted, green, amber }) {
  return (
    <div className="flex justify-between items-center">
      <span className={`text-sm ${muted ? 'text-gray-400' : 'text-gray-600'}`}>{label}</span>
      <span
        className={`text-sm ${bold ? 'font-bold text-gray-800' : ''} ${large ? 'text-lg' : ''} ${
          green ? 'text-green-600 font-medium' : ''
        } ${amber ? 'text-amber-600 font-medium' : ''} ${muted ? 'text-gray-400' : ''}`}
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
