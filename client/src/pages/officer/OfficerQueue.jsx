import { formatINR } from '../../utils/currency';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, ClipboardList, ArrowRight, UserCheck, Shield, Sparkles } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { RoleLayout } from '../../components/common/RoleLayout';
import { Header } from '../../components/common/Header';
import { StatusBadge } from '../../components/common/StatusBadge';

export const OfficerQueue = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [policySource, setPolicySource] = useState('');

  const fetchClaims = async () => {
    try {
      setLoading(true);
      let url = '/claims?';
      if (search) url += `search=${encodeURIComponent(search)}&`;
      if (category) url += `category=${category}&`;
      if (status) url += `status=${status}&`;
      if (policySource) url += `policySource=${policySource}&`;

      const res = await api.get(url);
      if (res.data.success) {
        setClaims(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load claims queue', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, [category, status, policySource]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchClaims();
  };

  const handleAssignToMe = async (claimId) => {
    try {
      const res = await api.patch(`/claims/${claimId}/assign-officer`, { officerId: user.id });
      if (res.data.success) {
        showToast('Claim assigned to your active queue.', 'success');
        fetchClaims();
      }
    } catch (err) {
      showToast('Failed to assign claim', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <Header
        title="Insurance Claims Work Queue"
        subtitle="Search, filter, assign, and adjudicate incoming claims and document verifications"
      />

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Filter Controls Bar */}
        <div className="bg-white p-4 rounded-2xl border border-[#D9E1FA] shadow-xs flex flex-wrap items-center justify-between gap-4">
          <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reference or description..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-[#D9E1FA] text-xs focus:outline-hidden focus:border-blue-600"
            />
          </form>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-[#D9E1FA] text-xs bg-white text-slate-700 focus:outline-hidden"
            >
              <option value="">All Categories</option>
              <option value="HEALTH">Health</option>
              <option value="VEHICLE">Vehicle</option>
              <option value="PROPERTY">Property</option>
            </select>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-[#D9E1FA] text-xs bg-white text-slate-700 focus:outline-hidden"
            >
              <option value="">All Statuses</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="DOCUMENTS_REQUIRED">Documents Required</option>
              <option value="SURVEYOR_ASSIGNED">Surveyor Assigned</option>
              <option value="SURVEY_REPORT_SUBMITTED">Survey Report Ready</option>
              <option value="MANAGER_REVIEW">Manager Review</option>
              <option value="APPROVED">Approved</option>
              <option value="SETTLED">Settled</option>
              <option value="REJECTED">Rejected</option>
            </select>

            <select
              value={policySource}
              onChange={(e) => setPolicySource(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-[#D9E1FA] text-xs bg-white text-slate-700 focus:outline-hidden"
            >
              <option value="">All Policy Sources</option>
              <option value="PLATFORM">Platform Policies</option>
              <option value="EXTERNAL">External Third-Party</option>
            </select>
          </div>
        </div>

        {/* Claims Table */}
        <div className="bg-white rounded-2xl border border-[#D9E1FA] shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-16 text-center text-slate-400 text-xs">Filtering work queue...</div>
          ) : claims.length === 0 ? (
            <div className="p-16 text-center text-slate-400 text-xs">
              <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-slate-700">No claims match the specified criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#F5F7FF] border-b border-slate-100 text-slate-500 font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="p-4">Reference</th>
                    <th className="p-4">Policyholder</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Source</th>
                    <th className="p-4">Requested</th>
                    <th className="p-4">Assigned Officer</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Validation</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {claims.map((claim) => (
                    <tr key={claim._id} className="hover:bg-[#F5F7FF]/70 transition">
                      <td className="p-4 font-mono font-bold text-[#101A38]">{claim.claimReference}</td>
                      <td className="p-4">
                        <div className="font-semibold text-[#101A38]">{claim.customer?.name}</div>
                        <div className="text-[10px] text-slate-400">{claim.customer?.email}</div>
                      </td>
                      <td className="p-4 font-semibold text-slate-700">{claim.category}</td>
                      <td className="p-4">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                            claim.policySource === 'EXTERNAL'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}
                        >
                          {claim.policySource}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-[#101A38]">{formatINR(claim.requestedAmount)}</td>
                      <td className="p-4">
                        {claim.assignedOfficer ? (
                          <span className="font-semibold text-slate-800">{claim.assignedOfficer.name}</span>
                        ) : (
                          <button
                            onClick={() => handleAssignToMe(claim._id)}
                            className="px-2 py-0.5 rounded bg-blue-50 text-[#0000FF] hover:bg-blue-100 text-[10px] font-bold border border-blue-200"
                          >
                            Assign to Me
                          </button>
                        )}
                      </td>
                      <td className="p-4">
                        <StatusBadge status={claim.status} />
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            claim.automatedValidation?.status === 'PASS'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : claim.automatedValidation?.status === 'FAIL'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          {claim.automatedValidation?.status || 'PENDING'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <Link
                          to={`/officer/claims/${claim._id}`}
                          className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition inline-flex items-center gap-1"
                        >
                          Review File <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OfficerQueue;
