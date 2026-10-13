import { formatINR } from '../../utils/currency';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Files, Plus, Search, Filter, ArrowRight, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import { RoleLayout } from '../../components/common/RoleLayout';
import { Header } from '../../components/common/Header';
import { StatusBadge } from '../../components/common/StatusBadge';

export const CustomerClaimsList = () => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    const fetchClaims = async () => {
      try {
        setLoading(true);
        const res = await api.get('/claims/my');
        if (res.data.success) {
          setClaims(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load my claims', err);
      } finally {
        setLoading(false);
      }
    };
    fetchClaims();
  }, []);

  const filteredClaims = claims.filter((c) => {
    const matchesSearch =
      c.claimReference.toLowerCase().includes(search.toLowerCase()) ||
      c.incidentDescription.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <Header
        title="My Claims History"
        subtitle="Track submitted reimbursement requests, document reviews, and final settlement statuses"
        actions={
          <Link
            to="/customer/claims/new"
            className="px-3.5 py-1.5 rounded-lg bg-[#0000FF] hover:bg-[#0000D0] text-white font-bold shadow-md shadow-blue-800/30 glow-electric-hover text-xs tracking-wide flex items-center gap-1.5 transition shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" /> File New Claim
          </Link>
        }
      />

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Filter Controls */}
        <div className="bg-white p-4 rounded-2xl border border-[#D9E1FA] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by reference or description..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-[#D9E1FA] text-xs focus:outline-hidden focus:border-blue-600"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-slate-500 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-[#D9E1FA] text-xs bg-white text-slate-700 focus:outline-hidden"
            >
              <option value="ALL">All Statuses</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="DOCUMENTS_REQUIRED">Documents Required</option>
              <option value="MANAGER_REVIEW">Manager Review</option>
              <option value="APPROVED">Approved</option>
              <option value="SETTLED">Settled</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>

        {/* Claims Table / List */}
        <div className="bg-white rounded-2xl border border-[#D9E1FA] shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-16 text-center text-slate-400 text-xs">Loading claims record...</div>
          ) : filteredClaims.length === 0 ? (
            <div className="p-16 text-center text-slate-400 text-xs">
              <Files className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-slate-700">No claims match the filter criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#F5F7FF] border-b border-slate-100 text-slate-500 font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="p-4">Reference</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Policy #</th>
                    <th className="p-4">Incident Date</th>
                    <th className="p-4">Requested</th>
                    <th className="p-4">Approved</th>
                    <th className="p-4">Current Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredClaims.map((claim) => (
                    <tr key={claim._id} className="hover:bg-[#F5F7FF]/70 transition">
                      <td className="p-4 font-mono font-bold text-[#101A38]">{claim.claimReference}</td>
                      <td className="p-4 font-semibold text-slate-700">{claim.category}</td>
                      <td className="p-4 font-mono text-slate-500">{claim.customerPolicy?.policyNumber || 'N/A'}</td>
                      <td className="p-4 text-slate-600">
                        {new Date(claim.incidentDate).toISOString().split('T')[0]}
                      </td>
                      <td className="p-4 font-bold text-[#101A38]">{formatINR(claim.requestedAmount)}</td>
                      <td className="p-4 font-bold text-emerald-600">
                        {claim.approvedAmount > 0 ? formatINR(claim.approvedAmount) : '-'}
                      </td>
                      <td className="p-4">
                        <StatusBadge status={claim.status} />
                      </td>
                      <td className="p-4 text-right">
                        <Link
                          to={`/customer/claims/${claim._id}`}
                          className="px-3 py-1.5 rounded-lg border border-[#D9E1FA] text-slate-700 hover:bg-slate-100 font-semibold text-xs transition inline-flex items-center gap-1"
                        >
                          View Details <ArrowRight className="w-3 h-3" />
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

export default CustomerClaimsList;
