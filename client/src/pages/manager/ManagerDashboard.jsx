import { formatINR } from '../../utils/currency';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  CheckCircle, AlertTriangle, Clock, ArrowRight, ShieldCheck, 
  DollarSign, TrendingUp, Layers, UserCheck, Eye 
} from 'lucide-react';
import api from '../../services/api';
import StatusBadge from '../../components/common/StatusBadge';
import { useToast } from '../../context/ToastContext';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';

export default function ManagerDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/manager');
      setData(res.data.data);
    } catch (err) {
      showToast('Failed to load manager dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-navy-700"></div>
      </div>
    );
  }

  const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  const categoryData = data?.categoryBreakdown?.map(item => ({
    name: item._id,
    value: item.count
  })) || [];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-navy-900 to-navy-800 rounded-xl p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-2">
            <ShieldCheck className="w-3.5 h-3.5" /> Operations Oversight
          </div>
          <h1 className="text-2xl font-bold">Executive Claims Governance</h1>
          <p className="text-navy-200 text-sm mt-1">Review escalated high-exposure claims, authorize settlement disbursements, and track SLA turnaround times.</p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/manager/decisions"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-semibold transition-all shadow-md flex items-center gap-2"
          >
            Review Decisions Queue ({data?.counts?.pendingReview || 0})
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-[#D9E1FA] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Awaiting Decision</p>
            <p className="text-2xl font-bold text-navy-900 mt-1">{data?.counts?.pendingReview || 0}</p>
            <span className="text-xs text-amber-600 font-medium flex items-center gap-1 mt-1">
              <Clock className="w-3.5 h-3.5" /> High priority reviews
            </span>
          </div>
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#D9E1FA] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Approved Value</p>
            <p className="text-2xl font-bold text-navy-900 mt-1">
              {formatINR(data?.exposure?.totalApprovedAmount || 0)}
            </p>
            <span className="text-xs text-emerald-600 font-medium flex items-center gap-1 mt-1">
              <CheckCircle className="w-3.5 h-3.5" /> Cumulative authorizations
            </span>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#D9E1FA] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Approved Claims</p>
            <p className="text-2xl font-bold text-navy-900 mt-1">{data?.counts?.approved || 0}</p>
            <span className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-1">
              Settlements ready/processed
            </span>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-[#0000FF] rounded-lg flex items-center justify-center">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#D9E1FA] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Settlements</p>
            <p className="text-2xl font-bold text-navy-900 mt-1">{data?.counts?.pendingSettlements || 0}</p>
            <span className="text-xs text-indigo-600 font-medium flex items-center gap-1 mt-1">
              Disbursement pipeline
            </span>
          </div>
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-xl border border-[#D9E1FA] shadow-sm">
          <h2 className="text-base font-bold text-navy-900 mb-4 flex items-center gap-2">
            <Layers className="w-5 h-5 text-navy-700" /> Claims Volume by Category
          </h2>
          {categoryData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
              No category data available
            </div>
          )}
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#D9E1FA] shadow-sm">
          <h2 className="text-base font-bold text-navy-900 mb-4 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-navy-700" /> Operational Overview
          </h2>
          <div className="space-y-4">
            <div className="p-4 bg-[#F5F7FF] rounded-lg border border-[#D9E1FA]">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-semibold text-slate-700">Approval Rate</span>
                <span className="text-sm font-bold text-navy-900">
                  {data?.counts?.total > 0
                    ? `${Math.round(((data?.counts?.approved || 0) / data.counts.total) * 100)}%`
                    : 'N/A'}
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div 
                  className="bg-emerald-600 h-2 rounded-full" 
                  style={{ width: `${data?.counts?.total > 0 ? ((data?.counts?.approved || 0) / data.counts.total) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            <div className="p-4 bg-[#F5F7FF] rounded-lg border border-[#D9E1FA]">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-semibold text-slate-700">Rejection Rate</span>
                <span className="text-sm font-bold text-slate-700">
                  {data?.counts?.total > 0
                    ? `${Math.round(((data?.counts?.rejected || 0) / data.counts.total) * 100)}%`
                    : 'N/A'}
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div 
                  className="bg-rose-500 h-2 rounded-full" 
                  style={{ width: `${data?.counts?.total > 0 ? ((data?.counts?.rejected || 0) / data.counts.total) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-8 h-8 text-emerald-600 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-emerald-900">Governance Controls Active</h4>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    Strict RBAC is enforced. Claims exceeding standard policy limits require dual-signoff and mandatory surveyor inspection reports.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Urgent Claims Requiring Manager Decision */}
      <div className="bg-white rounded-xl border border-[#D9E1FA] shadow-sm overflow-hidden">
        <div className="p-5 border-b border-[#D9E1FA] flex justify-between items-center">
          <div>
            <h2 className="text-base font-bold text-navy-900">Urgent Escalated Claims</h2>
            <p className="text-xs text-slate-500 mt-0.5">High-exposure submissions awaiting final managerial approval</p>
          </div>
          <Link
            to="/manager/decisions"
            className="text-xs font-semibold text-navy-700 hover:text-navy-900 flex items-center gap-1"
          >
            View All ({data?.pendingClaims?.length || 0}) <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-[#F5F7FF] border-b border-[#D9E1FA] text-xs font-semibold text-slate-700 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Claim Ref</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Requested Exposure</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {data?.pendingClaims && data.pendingClaims.length > 0 ? (
                data.pendingClaims.slice(0, 5).map((claim) => (
                  <tr key={claim._id} className="hover:bg-[#F5F7FF]/80 transition-colors">
                    <td className="py-3 px-4 font-semibold text-navy-900">
                      {claim.claimNumber}
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-slate-800">{claim.customer?.name || 'Customer'}</p>
                        <p className="text-xs text-slate-400">{claim.customer?.email}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700">
                      {claim.insuranceCategory}
                    </td>
                    <td className="py-3 px-4 font-bold text-navy-900">
                      {formatINR(claim.requestedAmount)}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={claim.status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/manager/claims/${claim._id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-navy-700 hover:bg-navy-800 text-white rounded text-xs font-medium transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" /> Decision File
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400 text-sm">
                    No claims currently awaiting manager decision.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export { ManagerDashboard };
