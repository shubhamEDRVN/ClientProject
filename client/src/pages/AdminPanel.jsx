import { useEffect, useState, useCallback } from 'react';
import api from '../api/axios';
import {
  Building2,
  Users,
  BookOpen,
  Shield,
  BarChart3,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  ToggleLeft,
  ToggleRight,
  UserCog,
} from 'lucide-react';

// ─── Overview Tab ─────────────────────────────────────────────────────

function OverviewTab() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/stats')
      .then((res) => setStats(res.data.data.stats))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-12 text-gray-400">Loading stats...</div>;
  if (!stats) return <div className="text-center py-12 text-gray-400">Failed to load stats.</div>;

  const cards = [
    { label: 'Total Companies', value: stats.totalCompanies, icon: Building2, color: 'blue' },
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'green' },
    { label: 'Learning Resources', value: stats.totalResources, icon: BookOpen, color: 'purple' },
    { label: 'Active Systems', value: stats.totalSystems, icon: BarChart3, color: 'indigo' },
    { label: 'Pending Moderation', value: stats.pendingModeration, icon: Shield, color: stats.pendingModeration > 0 ? 'orange' : 'gray' },
  ];

  const colorMap = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    orange: 'bg-orange-50 text-orange-600',
    gray: 'bg-gray-50 text-gray-400',
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-700 mb-4">Dashboard Overview</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-lg ${colorMap[card.color]}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-sm text-gray-500">{card.label}</span>
              </div>
              <p className="text-2xl font-bold text-gray-800">{card.value}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Business Management Tab ──────────────────────────────────────────

function BusinessTab() {
  const [companies, setCompanies] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null); // company detail view
  const [detailData, setDetailData] = useState(null);

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      params.set('page', page);
      params.set('limit', 10);
      const res = await api.get(`/admin/companies?${params.toString()}`);
      setCompanies(res.data.data.companies);
      setTotal(res.data.data.total);
      setTotalPages(res.data.data.totalPages);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page]);

  const fetchCompanyDetail = async (companyId) => {
    try {
      const res = await api.get(`/admin/companies/${companyId}`);
      setDetailData(res.data.data);
    } catch {
      // ignore
    }
  };

  useEffect(() => { fetchCompanies(); }, [fetchCompanies]);

  const handleToggle = async (companyId) => {
    try {
      await api.patch(`/admin/companies/${companyId}/toggle`);
      fetchCompanies();
      if (selected === companyId) fetchCompanyDetail(companyId);
    } catch {
      // ignore
    }
  };

  const handleRoleChange = async (userId, role) => {
    try {
      await api.put(`/admin/users/${userId}/role`, { role });
      if (selected) fetchCompanyDetail(selected);
    } catch {
      // ignore
    }
  };

  if (selected && detailData) {
    return (
      <div>
        <button onClick={() => { setSelected(null); setDetailData(null); }} className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 mb-4">
          <ChevronLeft className="w-4 h-4" /> Back to Companies
        </button>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-700">{detailData.company.name}</h2>
            <span className={`text-xs px-2 py-0.5 rounded-full ${detailData.company.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
              {detailData.company.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div><span className="text-gray-500">Industry:</span> <span className="text-gray-800">{detailData.company.industry || '—'}</span></div>
            <div><span className="text-gray-500">Phone:</span> <span className="text-gray-800">{detailData.company.phone || '—'}</span></div>
            <div><span className="text-gray-500">Address:</span> <span className="text-gray-800">{detailData.company.address || '—'}</span></div>
            <div><span className="text-gray-500">Created:</span> <span className="text-gray-800">{new Date(detailData.company.createdAt).toLocaleDateString()}</span></div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-700 mb-3">Users ({detailData.users.length})</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left">
                <th className="py-2 text-gray-500 font-medium">Name</th>
                <th className="py-2 text-gray-500 font-medium">Email</th>
                <th className="py-2 text-gray-500 font-medium">Role</th>
                <th className="py-2 text-gray-500 font-medium">Joined</th>
                <th className="py-2 text-gray-500 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {detailData.users.map((u) => (
                <tr key={u._id} className="border-b border-gray-100">
                  <td className="py-2 text-gray-800 font-medium">{u.name}</td>
                  <td className="py-2 text-gray-600">{u.email}</td>
                  <td className="py-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      u.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                      u.role === 'owner' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>{u.role}</span>
                  </td>
                  <td className="py-2 text-gray-500 text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="py-2">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u._id, e.target.value)}
                      className="text-xs border border-gray-300 rounded px-2 py-1"
                    >
                      <option value="owner">Owner</option>
                      <option value="admin">Admin</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-700 mb-4">Business Management</h2>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search companies..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="text-sm border border-gray-300 rounded-md px-3 py-2"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <span className="text-xs text-gray-400">{total} companies total</span>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left bg-gray-50">
                <th className="px-4 py-3 text-gray-500 font-medium">Company Name</th>
                <th className="px-4 py-3 text-gray-500 font-medium">Industry</th>
                <th className="px-4 py-3 text-gray-500 font-medium">Users</th>
                <th className="px-4 py-3 text-gray-500 font-medium">Status</th>
                <th className="px-4 py-3 text-gray-500 font-medium">Created</th>
                <th className="px-4 py-3 text-gray-500 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((c) => (
                <tr key={c._id} className={`border-b border-gray-100 ${!c.isActive ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3 text-gray-800 font-medium">{c.name}</td>
                  <td className="px-4 py-3 text-gray-600">{c.industry || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{c.userCount}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${c.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                      {c.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{new Date(c.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button
                        onClick={() => { setSelected(c._id); fetchCompanyDetail(c._id); }}
                        className="p-1 hover:bg-gray-100 rounded" title="View Details"
                      >
                        <Eye className="w-4 h-4 text-blue-500" />
                      </button>
                      <button
                        onClick={() => handleToggle(c._id)}
                        className="p-1 hover:bg-gray-100 rounded" title={c.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {c.isActive ? <ToggleRight className="w-4 h-4 text-green-500" /> : <ToggleLeft className="w-4 h-4 text-gray-400" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {companies.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No companies found.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-1 rounded hover:bg-gray-100 disabled:opacity-30"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-1 rounded hover:bg-gray-100 disabled:opacity-30"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Moderation Tab ───────────────────────────────────────────────────

function ModerationTab() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('pending');
  const [noteModal, setNoteModal] = useState(null); // { resourceId, action }
  const [note, setNote] = useState('');

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? `?status=${filter}` : '';
      const res = await api.get(`/admin/moderation${params}`);
      setResources(res.data.data.resources);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchQueue(); }, [fetchQueue]);

  const handleModerate = async (resourceId, action) => {
    try {
      await api.put(`/admin/moderation/${resourceId}/${action}`, { note: note || '' });
      setNoteModal(null);
      setNote('');
      fetchQueue();
    } catch {
      // ignore
    }
  };

  const openNoteModal = (resourceId, action) => {
    setNoteModal({ resourceId, action });
    setNote('');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-700">Content Moderation</h2>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {['pending', 'approved', 'rejected', 'all'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors capitalize ${
                filter === f ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left bg-gray-50">
                <th className="px-4 py-3 text-gray-500 font-medium">Title</th>
                <th className="px-4 py-3 text-gray-500 font-medium">Type</th>
                <th className="px-4 py-3 text-gray-500 font-medium">System</th>
                <th className="px-4 py-3 text-gray-500 font-medium">Status</th>
                <th className="px-4 py-3 text-gray-500 font-medium">Submitted</th>
                <th className="px-4 py-3 text-gray-500 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {resources.map((r) => (
                <tr key={r._id} className="border-b border-gray-100">
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-gray-800 font-medium">{r.title}</p>
                      {r.description && <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[200px]">{r.description}</p>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${r.type === 'video' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                      {r.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    {r.systemId?.name || '—'}
                    {r.systemId?.category && <span className="block text-gray-400">{r.systemId.category}</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      r.moderationStatus === 'approved' ? 'bg-green-100 text-green-700' :
                      r.moderationStatus === 'rejected' ? 'bg-red-100 text-red-600' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {r.moderationStatus}
                    </span>
                    {r.moderationNote && (
                      <p className="text-xs text-gray-400 mt-1 italic">"{r.moderationNote}"</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{new Date(r.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    {r.moderationStatus === 'pending' ? (
                      <div className="flex gap-1">
                        <button
                          onClick={() => openNoteModal(r._id, 'approve')}
                          className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 font-medium"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => openNoteModal(r._id, 'reject')}
                          className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 font-medium"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">
                        {r.moderatedBy?.name && `by ${r.moderatedBy.name}`}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {resources.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  {filter === 'pending' ? 'No pending items.' : 'No resources found.'}
                </td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Moderation Note Modal */}
      {noteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm">
            <div className="p-4 border-b">
              <h3 className="font-bold text-gray-800">
                {noteModal.action === 'approve' ? 'Approve Resource' : 'Reject Resource'}
              </h3>
            </div>
            <div className="p-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Note (optional)</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="Add a note..."
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex justify-end gap-2 p-4 border-t">
              <button onClick={() => setNoteModal(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md">
                Cancel
              </button>
              <button
                onClick={() => handleModerate(noteModal.resourceId, noteModal.action)}
                className={`px-4 py-2 text-sm text-white rounded-md font-medium ${
                  noteModal.action === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {noteModal.action === 'approve' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Admin Panel ─────────────────────────────────────────────────

const TABS = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'businesses', label: 'Businesses', icon: Building2 },
  { id: 'moderation', label: 'Moderation', icon: Shield },
];

export default function AdminPanel() {
  const [tab, setTab] = useState('overview');

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-xl font-bold text-gray-800 mb-4">Admin Panel</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6 w-fit">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                tab === t.id ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'overview' && <OverviewTab />}
      {tab === 'businesses' && <BusinessTab />}
      {tab === 'moderation' && <ModerationTab />}
    </div>
  );
}
