import { formatINR } from '../../utils/currency';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  CheckCircle, AlertTriangle, Clock, ArrowRight, ShieldCheck, 
  DollarSign, TrendingUp, Layers, UserCheck, Eye, RefreshCw 
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
  const [error, setError] = useState(null);
  const { showToast } = useToast();

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get('/dashboard/manager');
        if (isMounted && res.data?.success) {
          setData(res.data.data);
        }
      } catch (err) {
        if (isMounted) {
          const msg = err.response?.data?.message || 'Failed to load manager dashboard data';
          setError(msg);
          showToast(msg, 'error');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/dashboard/manager');
      if (res.data?.success) {
        setData(res.data.data);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to load manager dashboard data';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0000FF]"></div>
        <p className="text-xs text-[#64708A] font-medium">Computing managerial governance metrics...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-8 rounded-2xl bg-white border border-rose-200 shadow-xs text-center max-w-xl mx-auto my-12 space-y-4">
        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Unable to Load Manager Dashboard</h2>
          <p className="text-xs text-slate-500 mt-1">{error}</p>
        </div>
        <button
          onClick={fetchMetrics}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#0000FF] hover:bg-[#0000D0] text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" /> Retry Loading Dashboard
        </button>
      </div>
    );
  }

  const COLORS = ['#0000FF', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  const categoryData = data?.categoryBreakdown?.map(item => ({
    name: item._id,
    value: item.count
  })) || [];

  const totalClaims = data?.counts?.total || 0;
  const approvedClaims = data?.counts?.approved || 0;
  const rejectedClaims = data?.counts?.rejected || 0;
  const approvalRatePercent = totalClaims > 0 ? Math.round((approvedClaims / totalClaims) * 100) : 0;
  const rejectionRatePercent = totalClaims > 0 ? Math.round((rejectedClaims / totalClaims) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 border border-[#D9E1FA] shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-2">
            <ShieldCheck className="w-3.5 h-3.5" /> Operations Oversight
          </div>
          <h1 className="text-2xl font-black text-[#020950] tracking-tight">Executive Claims Governance</h1>
          <p className="text-[#64708A] text-xs sm:text-sm mt-1">Review escalated high-exposure claims, authorize settlement disbursements, and track SLA turnaround times.</p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/manager/decisions"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold transition shadow-xs flex items-center gap-2 cursor-pointer"
          >
            Review Decisions Queue ({data?.counts?.pendingReview || 0})
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#D9E1FA] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Awaiting Decision</p>
            <p className="text-2xl font-black text-[#020950] mt-1">{data?.counts?.pendingReview || 0}</p>
            <span className="text-xs text-amber-600 font-medium flex items-center gap-1 mt-1">
              <Clock className="w-3.5 h-3.5" /> High priority reviews
            </span>
          </div>
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#D9E1FA] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Approved Value</p>
            <p className="text-2xl font-black text-[#020950] mt-1">
              {formatINR(data?.exposure?.totalApprovedAmount || 0)}
            </p>
            <span className="text-xs text-emerald-600 font-medium flex items-center gap-1 mt-1">
              <CheckCircle className="w-3.5 h-3.5" /> Cumulative authorizations
            </span>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#D9E1FA] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Approved Claims</p>
            <p className="text-2xl font-black text-[#020950] mt-1">{data?.counts?.approved || 0}</p>
            <span className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-1">
              Settlements ready/processed
            </span>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-[#0000FF] rounded-xl flex items-center justify-center">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#D9E1FA] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Settlements</p>
            <p className="text-2xl font-black text-[#020950] mt-1">{data?.counts?.pendingSettlements || 0}</p>
            <span className="text-xs text-indigo-600 font-medium flex items-center gap-1 mt-1">
              Disbursement pipeline
            </span>
          </div>
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-[#D9E1FA] shadow-xs">
          <h2 className="text-base font-bold text-[#020950] mb-4 flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#0B0EA6]" /> Claims Volume by Category
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

        <div className="bg-white p-5 rounded-2xl border border-[#D9E1FA] shadow-xs">
          <h2 className="text-base font-bold text-[#020950] mb-4 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-[#0B0EA6]" /> Operational Overview
          </h2>
          <div className="space-y-4">
            <div className="p-4 bg-[#F5F7FF] rounded-xl border border-[#D9E1FA]">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-semibold text-slate-700">Approval Rate</span>
                <span className="text-sm font-bold text-[#020950]">
                  {totalClaims > 0 ? `${approvalRatePercent}%` : 'N/A'}
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div 
                  className="bg-emerald-600 h-2 rounded-full transition-all duration-500" 
                  style={{ width: `${approvalRatePercent}%` }}
                ></div>
              </div>
            </div>

            <div className="p-4 bg-[#F5F7FF] rounded-xl border border-[#D9E1FA]">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-semibold text-slate-700">Rejection Rate</span>
                <span className="text-sm font-bold text-slate-700">
                  {totalClaims > 0 ? `${rejectionRatePercent}%` : 'N/A'}
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div 
                  className="bg-rose-500 h-2 rounded-full transition-all duration-500" 
                  style={{ width: `${rejectionRatePercent}%` }}
                ></div>
              </div>
            </div>

            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
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
      <div className="bg-white rounded-2xl border border-[#D9E1FA] shadow-xs overflow-hidden">
        <div className="p-5 border-b border-[#D9E1FA] flex justify-between items-center">
          <div>
            <h2 className="text-base font-bold text-[#020950]">Urgent Escalated Claims</h2>
            <p className="text-xs text-slate-500 mt-0.5">High-exposure submissions awaiting final managerial approval</p>
          </div>
          <Link
            to="/manager/decisions"
            className="text-xs font-semibold text-[#0000FF] hover:text-[#0000D0] flex items-center gap-1 transition"
          >
            View All ({data?.counts?.pendingReview || data?.pendingClaims?.length || 0}) <ArrowRight className="w-3.5 h-3.5" />
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
                    <td className="py-3 px-4 font-semibold text-[#020950]">
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
                    <td className="py-3 px-4 font-bold text-[#020950]">
                      {formatINR(claim.requestedAmount)}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={claim.status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/manager/claims/${claim._id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0000FF] hover:bg-[#0000D0] text-white rounded-lg text-xs font-semibold transition-colors shadow-2xs"
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
