import { formatINR } from '../../utils/currency';
import React, { useState, useEffect } from 'react';
import { 
  IndianRupee, CheckCircle2, Clock, AlertCircle, Search, 
  ExternalLink, Filter, ShieldCheck, ArrowUpRight 
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

export default function ManagerSettlements() {
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const { showToast } = useToast();

  useEffect(() => {
    fetchSettlements();
  }, [statusFilter]);

  const fetchSettlements = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/settlements', { params });
      setSettlements(res.data.data);
    } catch (err) {
      showToast('Failed to load settlement disbursement ledger', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      setUpdatingId(id);
      await api.patch(`/settlements/${id}/status`, {
        status: newStatus,
        transactionReference: `TRX-${Date.now().toString().slice(-8)}`
      });
      showToast(`Settlement updated to ${newStatus}`, 'success');
      fetchSettlements();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update settlement status', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredSettlements = settlements.filter(s =>
    s.settlementNumber?.toLowerCase().includes(search.toLowerCase()) ||
    s.claim?.claimNumber?.toLowerCase().includes(search.toLowerCase()) ||
    s.customer?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const totalDisbursed = settlements
    .filter(s => s.status === 'COMPLETED')
    .reduce((acc, curr) => acc + (curr.approvedAmount || 0), 0);

  const pendingDisbursements = settlements
    .filter(s => s.status === 'PENDING' || s.status === 'PROCESSING')
    .reduce((acc, curr) => acc + (curr.approvedAmount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header & Stats Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Settlements & Disbursements Ledger</h1>
          <p className="text-sm text-slate-500 mt-1">Audit and execute authorized claim pay-outs across bank wire and voucher channels.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-[#D9E1FA] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Disbursed</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{formatINR(totalDisbursed)}</p>
            <p className="text-xs text-slate-400 mt-0.5">Completed pay-outs</p>
          </div>
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#D9E1FA] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Release</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{formatINR(pendingDisbursements)}</p>
            <p className="text-xs text-slate-400 mt-0.5">In authorization queue</p>
          </div>
          <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#D9E1FA] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Vouchers</p>
            <p className="text-2xl font-bold text-navy-900 mt-1">{settlements.length}</p>
            <p className="text-xs text-slate-400 mt-0.5">Total settlement files</p>
          </div>
          <div className="w-10 h-10 bg-blue-50 text-[#0000FF] rounded-lg flex items-center justify-center">
            <IndianRupee className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#D9E1FA] shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search voucher #, claim #, or customer name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-[#D9E1FA] rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm border border-[#D9E1FA] rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-navy-500"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="PROCESSING">Processing</option>
            <option value="COMPLETED">Completed</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-xl border border-[#D9E1FA] shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-700 mx-auto mb-2"></div>
            Loading settlements...
          </div>
        ) : filteredSettlements.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <IndianRupee className="w-12 h-12 mx-auto text-slate-300 mb-2" />
            <p className="font-medium text-slate-600">No settlement records found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-[#F5F7FF] border-b border-[#D9E1FA] text-xs font-semibold text-slate-700 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Voucher Ref</th>
                  <th className="py-3.5 px-4">Claim Ref</th>
                  <th className="py-3.5 px-4">Beneficiary</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Channel</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Disbursement Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredSettlements.map((s) => (
                  <tr key={s._id} className="hover:bg-[#F5F7FF]/80 transition-colors">
                    <td className="py-4 px-4 font-bold text-navy-900">
                      {s.settlementNumber}
                    </td>
                    <td className="py-4 px-4 font-medium text-slate-800">
                      {s.claim?.claimNumber}
                    </td>
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-semibold text-[#101A38]">{s.customer?.name || 'Customer'}</p>
                        <p className="text-xs text-slate-400">{s.customer?.email}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4 font-bold text-navy-900 text-base">
                      {formatINR(s.approvedAmount)}
                    </td>
                    <td className="py-4 px-4 text-xs font-medium text-slate-600">
                      {s.paymentMethod || 'BANK_TRANSFER'}
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        s.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                        s.status === 'PROCESSING' ? 'bg-blue-100 text-blue-800' :
                        s.status === 'FAILED' ? 'bg-rose-100 text-rose-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      {s.status === 'PENDING' && (
                        <button
                          onClick={() => handleUpdateStatus(s._id, 'PROCESSING')}
                          disabled={updatingId === s._id}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold shadow-xs"
                        >
                          Initiate Transfer
                        </button>
                      )}
                      {s.status === 'PROCESSING' && (
                        <button
                          onClick={() => handleUpdateStatus(s._id, 'COMPLETED')}
                          disabled={updatingId === s._id}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold shadow-xs"
                        >
                          Mark Disbursed
                        </button>
                      )}
                      {s.status === 'COMPLETED' && (
                        <span className="text-xs text-emerald-600 font-semibold flex items-center justify-end gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Disbursed
                        </span>
                      )}
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

export { ManagerSettlements };
