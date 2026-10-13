import { formatINR } from '../../utils/currency';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DollarSign, CheckCircle2, Clock, AlertCircle, ArrowRight } from 'lucide-react';
import api from '../../services/api';
import { RoleLayout } from '../../components/common/RoleLayout';
import { Header } from '../../components/common/Header';

export const CustomerSettlements = () => {
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettlements = async () => {
      try {
        setLoading(true);
        const res = await api.get('/settlements/my');
        if (res.data.success) {
          setSettlements(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load settlements', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettlements();
  }, []);

  return (
    <div className="space-y-6">
      <Header
        title="Settlement Disbursements & Payouts"
        subtitle="Track financial disbursements for your approved insurance claims"
      />

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="bg-white rounded-2xl border border-[#D9E1FA] shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-16 text-center text-slate-400 text-xs">Loading settlement records...</div>
          ) : settlements.length === 0 ? (
            <div className="p-16 text-center text-slate-400 text-xs">
              <DollarSign className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-slate-700">No settlement payouts on file yet.</p>
              <p className="mt-1 text-slate-500">Settlement vouchers are issued once a manager approves your claim.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#F5F7FF] border-b border-slate-100 text-slate-500 font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="p-4">Settlement Reference</th>
                    <th className="p-4">Claim Ref</th>
                    <th className="p-4">Approved Amount</th>
                    <th className="p-4">Payment Method</th>
                    <th className="p-4">Txn / Bank Ref</th>
                    <th className="p-4">Disbursement Status</th>
                    <th className="p-4">Authorized Date</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {settlements.map((s) => (
                    <tr key={s._id} className="hover:bg-[#F5F7FF]/70 transition">
                      <td className="p-4 font-mono font-bold text-[#101A38]">{s.settlementReference}</td>
                      <td className="p-4 font-mono text-slate-600">{s.claim?.claimReference || 'N/A'}</td>
                      <td className="p-4 font-black text-emerald-600 text-sm">
                        {formatINR(s.approvedAmount)}
                      </td>
                      <td className="p-4 text-slate-700">{s.paymentMethod?.replace('_', ' ')}</td>
                      <td className="p-4 font-mono text-slate-500">
                        {s.paymentReference || <span className="text-amber-600 italic">Processing</span>}
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            s.status === 'COMPLETED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : s.status === 'PROCESSING'
                              ? 'bg-cyan-50 text-cyan-800 border-cyan-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td className="p-4 text-slate-500">
                        {new Date(s.authorizedAt).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-right">
                        {s.claim?._id && (
                          <Link
                            to={`/customer/claims/${s.claim._id}`}
                            className="px-2.5 py-1 rounded-lg border border-[#D9E1FA] text-slate-700 hover:bg-slate-100 font-semibold text-[11px] inline-flex items-center gap-1"
                          >
                            Claim <ArrowRight className="w-3 h-3" />
                          </Link>
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
    </div>
  );
};

export default CustomerSettlements;
