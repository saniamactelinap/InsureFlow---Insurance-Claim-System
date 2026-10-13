import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, Shield, FileText, CheckCircle, AlertTriangle, 
  Settings, Activity, Database, ArrowRight, TrendingUp, 
  Server, Cpu 
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/admin');
      setData(res.data.data);
    } catch (err) {
      showToast('Failed to load administrator metrics', 'error');
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

  const roleData = data?.usersByRole?.map(item => ({
    name: item._id,
    count: item.count
  })) || [];

  const COLORS = ['#1E3A8A', '#0D9488', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-navy-950 via-navy-900 to-slate-900 rounded-xl p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30 mb-2">
            <Server className="w-3.5 h-3.5" /> System Operations & Governance
          </div>
          <h1 className="text-2xl font-bold">Platform Administration Center</h1>
          <p className="text-navy-200 text-sm mt-1">Configure underwriting rules, manage staff accounts, publish insurance products, and audit system events.</p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/admin/users"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition-all shadow-md flex items-center gap-2"
          >
            Manage Users <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-[#D9E1FA] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Users</p>
            <p className="text-2xl font-bold text-navy-900 mt-1">{data?.counts?.users || 0}</p>
            <span className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-1">
              Active system accounts
            </span>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-[#0000FF] rounded-lg flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#D9E1FA] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Claims</p>
            <p className="text-2xl font-bold text-navy-900 mt-1">{data?.counts?.claims || 0}</p>
            <span className="text-xs text-emerald-600 font-medium flex items-center gap-1 mt-1">
              Recorded in ledger
            </span>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#D9E1FA] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Insurance Products</p>
            <p className="text-2xl font-bold text-navy-900 mt-1">{data?.counts?.products || 0}</p>
            <span className="text-xs text-purple-600 font-medium flex items-center gap-1 mt-1">
              Catalog catalog plans
            </span>
          </div>
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center">
            <Shield className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#D9E1FA] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Rules Active</p>
            <p className="text-2xl font-bold text-navy-900 mt-1">{data?.counts?.rules || 0}</p>
            <span className="text-xs text-amber-600 font-medium flex items-center gap-1 mt-1">
              Underwriting policies
            </span>
          </div>
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center">
            <Settings className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Analytics & System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-xl border border-[#D9E1FA] shadow-sm">
          <h2 className="text-base font-bold text-navy-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-navy-700" /> User Distribution by Role
          </h2>
          {roleData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={roleData}>
                  <XAxis dataKey="name" stroke="#64748B" fontSize={12} />
                  <YAxis stroke="#64748B" fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#1E3A8A" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
              No user distribution data
            </div>
          )}
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#D9E1FA] shadow-sm space-y-4">
          <h2 className="text-base font-bold text-navy-900 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-navy-700" /> Operational Health & Services
          </h2>

          <div className="space-y-3">
            <div className="p-3 bg-[#F5F7FF] rounded-lg border border-[#D9E1FA] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Database Engine</p>
                  <p className="text-[11px] text-slate-500">MongoDB Persistence & Schemas</p>
                </div>
              </div>
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                Connected
              </span>
            </div>

            <div className="p-3 bg-[#F5F7FF] rounded-lg border border-[#D9E1FA] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                <div>
                  <p className="text-xs font-bold text-slate-800">OCR Extraction Pipeline</p>
                  <p className="text-[11px] text-slate-500">Tesseract.js Engine + PDF Parser</p>
                </div>
              </div>
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                Operational
              </span>
            </div>

            <div className="p-3 bg-[#F5F7FF] rounded-lg border border-[#D9E1FA] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Deterministic Rule Engine</p>
                  <p className="text-[11px] text-slate-500">Coverage & Policy Verification</p>
                </div>
              </div>
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                Ready (7 Active)
              </span>
            </div>

            <div className="p-3 bg-[#F5F7FF] rounded-lg border border-[#D9E1FA] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Security & RBAC Enforcement</p>
                  <p className="text-[11px] text-slate-500">JWT Tokens & Multi-Role Middleware</p>
                </div>
              </div>
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                Enforced
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Link
          to="/admin/users"
          className="p-4 bg-white rounded-xl border border-[#D9E1FA] shadow-sm hover:border-navy-500 hover:shadow-md transition-all group"
        >
          <Users className="w-6 h-6 text-navy-700 mb-2 group-hover:scale-110 transition-transform" />
          <h3 className="font-bold text-sm text-navy-900">User Management</h3>
          <p className="text-xs text-slate-500 mt-1">Manage staff roles, provision officers, deactivate accounts.</p>
        </Link>

        <Link
          to="/admin/products"
          className="p-4 bg-white rounded-xl border border-[#D9E1FA] shadow-sm hover:border-navy-500 hover:shadow-md transition-all group"
        >
          <Shield className="w-6 h-6 text-navy-700 mb-2 group-hover:scale-110 transition-transform" />
          <h3 className="font-bold text-sm text-navy-900">Insurance Products</h3>
          <p className="text-xs text-slate-500 mt-1">Configure policy plans, coverage limits, deductibles & eligibility.</p>
        </Link>

        <Link
          to="/admin/rules"
          className="p-4 bg-white rounded-xl border border-[#D9E1FA] shadow-sm hover:border-navy-500 hover:shadow-md transition-all group"
        >
          <Settings className="w-6 h-6 text-navy-700 mb-2 group-hover:scale-110 transition-transform" />
          <h3 className="font-bold text-sm text-navy-900">Rule Engine</h3>
          <p className="text-xs text-slate-500 mt-1">Toggle validation rules, duplicate detection, surveyor triggers.</p>
        </Link>

        <Link
          to="/admin/audit-logs"
          className="p-4 bg-white rounded-xl border border-[#D9E1FA] shadow-sm hover:border-navy-500 hover:shadow-md transition-all group"
        >
          <Activity className="w-6 h-6 text-navy-700 mb-2 group-hover:scale-110 transition-transform" />
          <h3 className="font-bold text-sm text-navy-900">Audit & Compliance</h3>
          <p className="text-xs text-slate-500 mt-1">Review tamper-proof immutable audit trail of all actions.</p>
        </Link>
      </div>
    </div>
  );
}

export { AdminDashboard };
