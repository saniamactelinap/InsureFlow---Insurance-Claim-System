import { formatINR } from '../../utils/currency';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarCheck, ArrowRight, Clock, MapPin, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import { RoleLayout } from '../../components/common/RoleLayout';
import { Header } from '../../components/common/Header';

export const SurveyorInspections = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInspections = async () => {
      try {
        setLoading(true);
        const res = await api.get('/survey/my-inspections');
        if (res.data.success) {
          setAssignments(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load inspections queue', err);
      } finally {
        setLoading(false);
      }
    };
    fetchInspections();
  }, []);

  return (
    <div className="space-y-6">
      <Header
        title="Field Inspection Assignments"
        subtitle="Schedule and execute certified technical damage assessments for assigned claims"
      />

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="bg-white rounded-2xl border border-[#D9E1FA] shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-16 text-center text-slate-400 text-xs">Loading inspection queue...</div>
          ) : assignments.length === 0 ? (
            <div className="p-16 text-center text-slate-400 text-xs">
              <CalendarCheck className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-slate-700">No inspections currently assigned to your profile.</p>
              <p className="text-slate-500 mt-1">New technical assessments will appear here once dispatched by an officer.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#F5F7FF] border-b border-slate-100 text-slate-500 font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="p-4">Claim Reference</th>
                    <th className="p-4">Customer</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Inspection Site</th>
                    <th className="p-4">Scheduled Date</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {assignments.map((a) => (
                    <tr key={a._id} className="hover:bg-[#F5F7FF]/70 transition">
                      <td className="p-4 font-mono font-bold text-[#101A38]">{a.claim?.claimReference}</td>
                      <td className="p-4">
                        <div className="font-semibold text-[#101A38]">{a.claim?.customer?.name}</div>
                        <div className="text-[10px] text-slate-400">{a.claim?.customer?.phone}</div>
                      </td>
                      <td className="p-4 font-semibold text-slate-700">{a.claim?.customerPolicy?.category}</td>
                      <td className="p-4 text-slate-600 truncate max-w-[180px]">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                          {a.inspectionLocation || 'Not provided'}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-[11px] text-slate-700">
                        {a.scheduledDate ? new Date(a.scheduledDate).toLocaleDateString() : (
                          <span className="text-amber-600 font-sans italic">Not scheduled</span>
                        )}
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
                          Open Inspection <ArrowRight className="w-3 h-3" />
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

export default SurveyorInspections;
