import { formatINR } from '../../utils/currency';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarCheck, Clock, CheckCircle2, AlertCircle, ArrowRight, Camera, Wrench } from 'lucide-react';
import api from '../../services/api';
import { RoleLayout } from '../../components/common/RoleLayout';
import { Header } from '../../components/common/Header';

export const SurveyorDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await api.get('/dashboard/stats');
        if (res.data.success) {
          setStats(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load surveyor stats', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <Header
        title="Surveyor Field Inspection Dashboard"
        subtitle="Manage assigned technical damage assessments, inspection schedules, and repair estimates"
        actions={
          <Link
            to="/surveyor/inspections"
            className="px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs tracking-wide flex items-center gap-1.5 transition shadow-xs"
          >
            <CalendarCheck className="w-3.5 h-3.5" /> View Inspection Queue
          </Link>
        }
      />

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {loading ? (
          <div className="p-16 text-center text-slate-400 text-xs">Loading surveyor assignments...</div>
        ) : (
          <>
            {/* Stat Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-[#D9E1FA] shadow-xs">
                <span className="text-[10px] uppercase font-bold text-purple-600 tracking-wider">Total Assigned</span>
                <div className="text-2xl font-black text-[#101A38] mt-1">{stats?.totalAssigned || 0}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">All-time inspections</div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-[#D9E1FA] shadow-xs">
                <span className="text-[10px] uppercase font-bold text-[#0000FF] tracking-wider">Scheduled</span>
                <div className="text-2xl font-black text-[#0000FF] mt-1">{stats?.scheduledInspections || 0}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Date confirmed</div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-[#D9E1FA] shadow-xs">
                <span className="text-[10px] uppercase font-bold text-amber-700 tracking-wider">Pending Reports</span>
                <div className="text-2xl font-black text-amber-600 mt-1">{stats?.reportsPending || 0}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Assessment form due</div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-[#D9E1FA] shadow-xs">
                <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">Completed Reports</span>
                <div className="text-2xl font-black text-emerald-600 mt-1">{stats?.completedReports || 0}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Submitted to officer/manager</div>
              </div>
            </div>

            {/* Assignments List */}
            <div className="bg-white rounded-2xl border border-[#D9E1FA] shadow-xs overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#101A38]">Recent Inspection Tasks</h3>
                  <p className="text-xs text-slate-500">Live assigned inspections queried from MongoDB</p>
                </div>
                <Link
                  to="/surveyor/inspections"
                  className="text-xs font-bold text-purple-600 hover:text-purple-800 flex items-center gap-1"
                >
                  View All Assignments <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#F5F7FF] border-b border-slate-100 text-slate-500 font-semibold uppercase text-[10px]">
                    <tr>
                      <th className="p-4">Claim Ref</th>
                      <th className="p-4">Policyholder</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Location</th>
                      <th className="p-4">Scheduled Date</th>
                      <th className="p-4">Assignment Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stats?.recentAssignments?.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400">
                          No active survey assignments on your roster.
                        </td>
                      </tr>
                    ) : (
                      stats?.recentAssignments?.map((a) => (
                        <tr key={a._id} className="hover:bg-[#F5F7FF]/70 transition">
                          <td className="p-4 font-mono font-bold text-[#101A38]">{a.claim?.claimReference}</td>
                          <td className="p-4 font-semibold text-slate-800">{a.claim?.customer?.name}</td>
                          <td className="p-4 font-semibold text-slate-600">{a.claim?.customerPolicy?.category}</td>
                          <td className="p-4 text-slate-500 truncate max-w-[150px]">{a.inspectionLocation || 'Not specified'}</td>
                          <td className="p-4 text-slate-600 font-mono text-[11px]">
                            {a.scheduledDate ? new Date(a.scheduledDate).toLocaleDateString() : 'Unscheduled'}
                          </td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                              {a.status?.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <Link
                              to={`/surveyor/inspections/${a._id}`}
                              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition inline-flex items-center gap-1"
                            >
                              Conduct Survey
                            </Link>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SurveyorDashboard;
