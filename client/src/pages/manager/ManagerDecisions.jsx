import { formatINR } from '../../utils/currency';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileCheck, Search, Filter, AlertCircle, Eye, 
  Calendar, DollarSign, Clock, ShieldAlert, ArrowRight, User 
} from 'lucide-react';
import api from '../../services/api';
import StatusBadge from '../../components/common/StatusBadge';
import { useToast } from '../../context/ToastContext';

export default function ManagerDecisions() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const { showToast } = useToast();

  useEffect(() => {
    fetchDecisionsQueue();
  }, [categoryFilter]);

  const fetchDecisionsQueue = async () => {
    try {
      setLoading(true);
      const params = { status: 'MANAGER_REVIEW' };
      if (categoryFilter) params.insuranceCategory = categoryFilter;
      const res = await api.get('/claims', { params });
      setClaims(res.data.data);
    } catch (err) {
      showToast('Failed to load manager decisions queue', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredClaims = claims.filter(c => 
    c.claimNumber?.toLowerCase().includes(search.toLowerCase()) ||
    c.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.policyNumber?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Manager Decisions Queue</h1>
          <p className="text-sm text-slate-500 mt-1">Review escalated claims, surveyor estimates, and authorize final settlements or rejections.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600 bg-white border border-[#D9E1FA] px-3 py-1.5 rounded-lg shadow-sm">
          <Clock className="w-4 h-4 text-amber-500" />
          <span>Pending Evaluation: <strong>{claims.length}</strong></span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#D9E1FA] shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by claim #, customer name, or policy number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-[#D9E1FA] rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-sm border border-[#D9E1FA] rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-navy-500"
          >
            <option value="">All Categories</option>
            <option value="HEALTH">Health</option>
            <option value="VEHICLE">Vehicle</option>
            <option value="PROPERTY">Property</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#D9E1FA] shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-700 mx-auto mb-2"></div>
            Loading escalated claims...
          </div>
        ) : filteredClaims.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <ShieldAlert className="w-12 h-12 mx-auto text-slate-300 mb-2" />
            <p className="font-medium text-slate-600">No claims awaiting manager review</p>
            <p className="text-xs text-slate-400 mt-1">Claims escalated by officers or with completed survey inspections will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-[#F5F7FF] border-b border-[#D9E1FA] text-xs font-semibold text-slate-700 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Claim Ref</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Exposure Amount</th>
                  <th className="py-3.5 px-4">Survey Status</th>
                  <th className="py-3.5 px-4">Submitted Date</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredClaims.map((claim) => (
                  <tr key={claim._id} className="hover:bg-[#F5F7FF]/80 transition-colors">
                    <td className="py-4 px-4 font-bold text-navy-900">
                      {claim.claimNumber}
                    </td>
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-medium text-[#101A38] flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          {claim.customer?.name || 'Customer'}
                        </p>
                        <p className="text-xs text-slate-400">{claim.customer?.email}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                        {claim.insuranceCategory}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-bold text-navy-900">
                      {formatINR(claim.requestedAmount)}
                    </td>
                    <td className="py-4 px-4">
                      {claim.surveyor ? (
                        <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-medium border border-emerald-200">
                          Survey Completed
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 italic">None required</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-xs text-slate-500">
                      {new Date(claim.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <Link
                        to={`/manager/claims/${claim._id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-navy-800 hover:bg-navy-900 text-white rounded text-xs font-semibold shadow-sm transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" /> Adjudicate File
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
  );
}

export { ManagerDecisions };
