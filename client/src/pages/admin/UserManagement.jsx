import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Search, Shield, CheckCircle, XCircle, 
  Key, Mail, Phone, Filter, ShieldAlert 
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'OFFICER',
    password: '',
    phone: ''
  });

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = {};
      if (roleFilter) params.role = roleFilter;
      const res = await api.get('/users', { params });
      setUsers(res.data.data);
    } catch (err) {
      showToast('Failed to load user directory', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (user) => {
    try {
      const newStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await api.patch(`/users/${user._id}/status`, { status: newStatus });
      showToast(`User status updated to ${newStatus}`, 'success');
      fetchUsers();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update user status', 'error');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.post('/users', newUser);
      showToast('Staff account created successfully', 'success');
      setShowCreateModal(false);
      setNewUser({ name: '', email: '', role: 'OFFICER', password: '', phone: '' });
      fetchUsers();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create user', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">User & Staff Management</h1>
          <p className="text-sm text-slate-500 mt-1">Provision officers, surveyors, managers, and manage permissions.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-navy-800 hover:bg-navy-900 text-white rounded-lg text-sm font-semibold transition-all shadow-md flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" /> Provision Staff Account
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl border border-[#D9E1FA] shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-[#D9E1FA] rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="text-sm border border-[#D9E1FA] rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-navy-500"
          >
            <option value="">All Roles</option>
            <option value="CUSTOMER">Customer</option>
            <option value="OFFICER">Insurance Officer</option>
            <option value="SURVEYOR">Surveyor</option>
            <option value="MANAGER">Manager</option>
            <option value="ADMIN">Administrator</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-[#D9E1FA] shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-700 mx-auto mb-2"></div>
            Loading user directory...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Users className="w-12 h-12 mx-auto text-slate-300 mb-2" />
            <p className="font-medium text-slate-600">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-[#F5F7FF] border-b border-[#D9E1FA] text-xs font-semibold text-slate-700 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">User</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Created Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredUsers.map((u) => (
                  <tr key={u._id} className="hover:bg-[#F5F7FF]/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div>
                        <p className="font-bold text-navy-900">{u.name}</p>
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3" /> {u.email}
                        </p>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      {u.phone || 'N/A'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        u.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' :
                        u.role === 'MANAGER' ? 'bg-indigo-100 text-indigo-800' :
                        u.role === 'OFFICER' ? 'bg-blue-100 text-blue-800' :
                        u.role === 'SURVEYOR' ? 'bg-teal-100 text-teal-800' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        u.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-400">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleToggleStatus(u)}
                        className={`px-3 py-1 rounded text-xs font-semibold border transition-colors ${
                          u.status === 'ACTIVE'
                            ? 'border-rose-200 text-rose-600 hover:bg-rose-50'
                            : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                        }`}
                      >
                        {u.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Provision User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-navy-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-navy-900">Provision Staff Account</h3>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-[#D9E1FA] rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Corporate Email</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-[#D9E1FA] rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Role / Function</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-[#D9E1FA] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-navy-500"
                >
                  <option value="OFFICER">Insurance Officer</option>
                  <option value="SURVEYOR">Surveyor (Inspecting Assessor)</option>
                  <option value="MANAGER">Claims Manager</option>
                  <option value="ADMIN">System Administrator</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Temporary Password</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-[#D9E1FA] rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Phone Number (Optional)</label>
                <input
                  type="text"
                  value={newUser.phone}
                  onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-[#D9E1FA] rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-[#D9E1FA] rounded-lg text-xs font-semibold text-slate-600 hover:bg-[#F5F7FF]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-navy-800 hover:bg-navy-900 text-white rounded-lg text-xs font-semibold shadow-md"
                >
                  {submitting ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export { UserManagement };
