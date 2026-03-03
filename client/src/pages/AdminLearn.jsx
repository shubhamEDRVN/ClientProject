import { useEffect, useState, useCallback } from 'react';
import api from '../api/axios';
import { Plus, Pencil, Trash2, RotateCcw, PlayCircle, FileText, X } from 'lucide-react';

function FormModal({ title, fields, values, onChange, onSave, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-bold text-gray-800">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-4 space-y-3">
          {fields.map((f) => (
            <div key={f.name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
              {f.type === 'select' ? (
                <select
                  value={values[f.name] || ''}
                  onChange={(e) => onChange(f.name, e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select...</option>
                  {f.options.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              ) : f.type === 'radio' ? (
                <div className="flex gap-3">
                  {f.options.map((o) => (
                    <label key={o.value} className="flex items-center gap-1 text-sm">
                      <input
                        type="radio"
                        name={f.name}
                        value={o.value}
                        checked={values[f.name] === o.value}
                        onChange={() => onChange(f.name, o.value)}
                      />
                      {o.label}
                    </label>
                  ))}
                </div>
              ) : f.type === 'textarea' ? (
                <textarea
                  value={values[f.name] || ''}
                  onChange={(e) => onChange(f.name, e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <input
                  type={f.type || 'text'}
                  value={values[f.name] || ''}
                  onChange={(e) => onChange(f.name, e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2 p-4 border-t">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md">
            Cancel
          </button>
          <button onClick={onSave} className="px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-md font-medium">
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

const CATEGORIES = [
  'Marketing & Lead Generation',
  'Sales & Conversion',
  'Operations & Dispatch',
  'Financial Systems',
  'Human Resources',
  'Customer Experience',
  'Leadership & Growth',
];

export default function AdminLearn() {
  const [tab, setTab] = useState('systems');
  const [systems, setSystems] = useState([]);
  const [resources, setResources] = useState([]);
  const [selectedSystemId, setSelectedSystemId] = useState('');
  const [loading, setLoading] = useState(false);

  // Modal state
  const [modal, setModal] = useState(null); // { type: 'system'|'resource', mode: 'create'|'edit', data: {} }
  const [formValues, setFormValues] = useState({});

  const fetchSystems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/systems');
      setSystems(res.data.data.systems);
    } catch (err) {
      console.error('Failed to fetch systems:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchResources = useCallback(async (systemId) => {
    if (!systemId) { setResources([]); return; }
    setLoading(true);
    try {
      const res = await api.get(`/admin/systems/${systemId}/resources`);
      setResources(res.data.data.resources);
    } catch (err) {
      console.error('Failed to fetch resources:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSystems(); }, [fetchSystems]);
  useEffect(() => { if (tab === 'resources' && selectedSystemId) fetchResources(selectedSystemId); }, [tab, selectedSystemId, fetchResources]);

  const handleFormChange = (name, value) => {
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  // ─── System CRUD ──────────────────────────────────────────────
  const openCreateSystem = () => {
    setFormValues({ category: '', name: '', description: '', sortOrder: 0 });
    setModal({ type: 'system', mode: 'create' });
  };

  const openEditSystem = (sys) => {
    setFormValues({ category: sys.category, name: sys.name, description: sys.description, sortOrder: sys.sortOrder });
    setModal({ type: 'system', mode: 'edit', data: sys });
  };

  const saveSystem = async () => {
    try {
      if (modal.mode === 'create') {
        await api.post('/admin/systems', formValues);
      } else {
        await api.put(`/admin/systems/${modal.data._id}`, formValues);
      }
      setModal(null);
      fetchSystems();
    } catch (err) {
      console.error('Failed to save system:', err);
    }
  };

  const toggleSystemActive = async (sys) => {
    try {
      if (sys.isActive) {
        await api.delete(`/admin/systems/${sys._id}`);
      } else {
        await api.put(`/admin/systems/${sys._id}`, { isActive: true });
      }
      fetchSystems();
    } catch (err) {
      console.error('Failed to toggle system:', err);
    }
  };

  // ─── Resource CRUD ────────────────────────────────────────────
  const openCreateResource = () => {
    setFormValues({ type: 'video', title: '', description: '', url: '', sortOrder: 0 });
    setModal({ type: 'resource', mode: 'create' });
  };

  const openEditResource = (res) => {
    setFormValues({ type: res.type, title: res.title, description: res.description, url: res.url, sortOrder: res.sortOrder });
    setModal({ type: 'resource', mode: 'edit', data: res });
  };

  const saveResource = async () => {
    try {
      if (modal.mode === 'create') {
        await api.post(`/admin/systems/${selectedSystemId}/resources`, formValues);
      } else {
        await api.put(`/admin/resources/${modal.data._id}`, formValues);
      }
      setModal(null);
      fetchResources(selectedSystemId);
    } catch (err) {
      console.error('Failed to save resource:', err);
    }
  };

  const toggleResourceActive = async (res) => {
    try {
      if (res.isActive) {
        await api.delete(`/admin/resources/${res._id}`);
      } else {
        await api.put(`/admin/resources/${res._id}`, { isActive: true });
      }
      fetchResources(selectedSystemId);
    } catch (err) {
      console.error('Failed to toggle resource:', err);
    }
  };

  // Resource count per system
  const resourceCounts = {};
  for (const sys of systems) {
    resourceCounts[sys._id] = 0;
  }

  const systemFields = [
    { name: 'category', label: 'Category', type: 'select', options: CATEGORIES.map((c) => ({ value: c, label: c })) },
    { name: 'name', label: 'System Name', type: 'text' },
    { name: 'description', label: 'Description', type: 'textarea' },
    { name: 'sortOrder', label: 'Sort Order', type: 'number' },
  ];

  const resourceFields = [
    { name: 'type', label: 'Type', type: 'radio', options: [{ value: 'video', label: 'Video' }, { value: 'pdf', label: 'PDF' }] },
    { name: 'title', label: 'Title', type: 'text' },
    { name: 'description', label: 'Description (optional)', type: 'textarea' },
    { name: 'url', label: 'URL', type: 'text' },
    { name: 'sortOrder', label: 'Sort Order', type: 'number' },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-xl font-bold text-gray-800 mb-4">Admin — Learning Content</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6 w-fit">
        <button
          onClick={() => setTab('systems')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            tab === 'systems' ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Systems Manager
        </button>
        <button
          onClick={() => setTab('resources')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            tab === 'resources' ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Resources Manager
        </button>
      </div>

      {tab === 'systems' && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-700">All Systems ({systems.length})</h2>
            <button onClick={openCreateSystem} className="inline-flex items-center gap-1 bg-blue-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700">
              <Plus className="w-4 h-4" /> Add System
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left">
                  <th className="py-2 text-gray-500 font-medium">Category</th>
                  <th className="py-2 text-gray-500 font-medium">System Name</th>
                  <th className="py-2 text-gray-500 font-medium">Order</th>
                  <th className="py-2 text-gray-500 font-medium">Status</th>
                  <th className="py-2 text-gray-500 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {systems.map((sys) => (
                  <tr key={sys._id} className={`border-b border-gray-100 ${!sys.isActive ? 'opacity-50' : ''}`}>
                    <td className="py-2 text-gray-600 text-xs">{sys.category}</td>
                    <td className="py-2 text-gray-800 font-medium">{sys.name}</td>
                    <td className="py-2 text-gray-600">{sys.sortOrder}</td>
                    <td className="py-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${sys.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {sys.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-2">
                      <div className="flex gap-1">
                        <button onClick={() => openEditSystem(sys)} className="p-1 hover:bg-gray-100 rounded" title="Edit">
                          <Pencil className="w-4 h-4 text-gray-500" />
                        </button>
                        <button onClick={() => toggleSystemActive(sys)} className="p-1 hover:bg-gray-100 rounded" title={sys.isActive ? 'Deactivate' : 'Restore'}>
                          {sys.isActive ? <Trash2 className="w-4 h-4 text-red-500" /> : <RotateCcw className="w-4 h-4 text-green-500" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'resources' && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-4 mb-4">
            <select
              value={selectedSystemId}
              onChange={(e) => { setSelectedSystemId(e.target.value); fetchResources(e.target.value); }}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm flex-1 max-w-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a system...</option>
              {systems.filter((s) => s.isActive).map((sys) => (
                <option key={sys._id} value={sys._id}>{sys.category} — {sys.name}</option>
              ))}
            </select>
            {selectedSystemId && (
              <button onClick={openCreateResource} className="inline-flex items-center gap-1 bg-blue-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700">
                <Plus className="w-4 h-4" /> Add Resource
              </button>
            )}
          </div>

          {selectedSystemId && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left">
                    <th className="py-2 text-gray-500 font-medium">Type</th>
                    <th className="py-2 text-gray-500 font-medium">Title</th>
                    <th className="py-2 text-gray-500 font-medium">URL</th>
                    <th className="py-2 text-gray-500 font-medium">Order</th>
                    <th className="py-2 text-gray-500 font-medium">Status</th>
                    <th className="py-2 text-gray-500 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {resources.map((res) => (
                    <tr key={res._id} className={`border-b border-gray-100 ${!res.isActive ? 'opacity-50' : ''}`}>
                      <td className="py-2">
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded ${res.type === 'video' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                          {res.type === 'video' ? <PlayCircle className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                          {res.type}
                        </span>
                      </td>
                      <td className="py-2 text-gray-800 font-medium">{res.title}</td>
                      <td className="py-2 text-gray-500 truncate max-w-[200px]">
                        <a href={res.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-xs">{res.url}</a>
                      </td>
                      <td className="py-2 text-gray-600">{res.sortOrder}</td>
                      <td className="py-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${res.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {res.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-2">
                        <div className="flex gap-1">
                          <button onClick={() => openEditResource(res)} className="p-1 hover:bg-gray-100 rounded" title="Edit">
                            <Pencil className="w-4 h-4 text-gray-500" />
                          </button>
                          <button onClick={() => toggleResourceActive(res)} className="p-1 hover:bg-gray-100 rounded" title={res.isActive ? 'Deactivate' : 'Restore'}>
                            {res.isActive ? <Trash2 className="w-4 h-4 text-red-500" /> : <RotateCcw className="w-4 h-4 text-green-500" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {resources.length === 0 && (
                    <tr><td colSpan={6} className="py-6 text-center text-gray-400">No resources for this system yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {!selectedSystemId && (
            <p className="text-center text-gray-400 py-8">Select a system to manage its resources.</p>
          )}
        </div>
      )}

      {/* Form Modal */}
      {modal && modal.type === 'system' && (
        <FormModal
          title={modal.mode === 'create' ? 'Add System' : 'Edit System'}
          fields={systemFields}
          values={formValues}
          onChange={handleFormChange}
          onSave={saveSystem}
          onClose={() => setModal(null)}
        />
      )}
      {modal && modal.type === 'resource' && (
        <FormModal
          title={modal.mode === 'create' ? 'Add Resource' : 'Edit Resource'}
          fields={resourceFields}
          values={formValues}
          onChange={handleFormChange}
          onSave={saveResource}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
