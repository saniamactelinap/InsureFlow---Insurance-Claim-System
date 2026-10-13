import { formatINR } from '../../utils/currency';
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  CalendarCheck,
  ArrowLeft,
  Camera,
  Wrench,
  CheckCircle2,
  DollarSign,
  MapPin,
  Clock,
  UploadCloud,
  X,
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { RoleLayout } from '../../components/common/RoleLayout';
import { Header } from '../../components/common/Header';

export const SurveyorReportWorkspace = () => {
  const { id } = useParams(); // Assignment ID
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);

  // Scheduling State
  const [scheduledDate, setScheduledDate] = useState('');
  const [inspectionLocation, setInspectionLocation] = useState('');
  const [savingSchedule, setSavingSchedule] = useState(false);

  // Report Submission State
  const [reportForm, setReportForm] = useState({
    inspectionDate: new Date().toISOString().split('T')[0],
    damageSummary: '',
    detailedFindings: '',
    estimatedRepairCost: '',
    recommendedSettlementAmount: '',
    salvageValue: '0',
    liabilityAssessment: 'PARTIAL_LOSS',
  });
  const [photos, setPhotos] = useState([]);
  const [submittingReport, setSubmittingReport] = useState(false);

  useEffect(() => {
    const fetchAssignment = async () => {
      try {
        setLoading(true);
        // Find assignment from list
        const res = await api.get('/survey/my-inspections');
        if (res.data.success) {
          const found = res.data.data.find((a) => a._id === id);
          if (found) {
            setAssignment(found);
            if (found.scheduledDate) {
              setScheduledDate(new Date(found.scheduledDate).toISOString().split('T')[0]);
            }
            setInspectionLocation(found.inspectionLocation || '');
            if (found.claim?.requestedAmount) {
              setReportForm((prev) => ({
                ...prev,
                estimatedRepairCost: found.claim.requestedAmount,
                recommendedSettlementAmount: found.claim.requestedAmount,
              }));
            }
          }
        }
      } catch (err) {
        console.error('Failed to load assignment', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAssignment();
  }, [id]);

  const handleSaveSchedule = async (e) => {
    e.preventDefault();
    if (!scheduledDate) {
      showToast('Please select a scheduled inspection date.', 'error');
      return;
    }
    try {
      setSavingSchedule(true);
      const res = await api.patch(`/survey/assignments/${id}/schedule`, {
        scheduledDate,
        inspectionLocation,
      });
      if (res.data.success) {
        showToast('Inspection date and location saved successfully!', 'success');
        setAssignment(res.data.data);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save schedule', 'error');
    } finally {
      setSavingSchedule(false);
    }
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    setPhotos((prev) => [...prev, ...files]);
  };

  const removePhoto = (index) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    if (!reportForm.damageSummary || !reportForm.detailedFindings || !reportForm.estimatedRepairCost || !reportForm.recommendedSettlementAmount) {
      showToast('Please complete all mandatory report fields.', 'error');
      return;
    }

    try {
      setSubmittingReport(true);
      const data = new FormData();
      data.append('assignmentId', id);
      data.append('inspectionDate', reportForm.inspectionDate);
      data.append('inspectionLocation', inspectionLocation || 'Workshop Site');
      data.append('damageSummary', reportForm.damageSummary);
      data.append('detailedFindings', reportForm.detailedFindings);
      data.append('estimatedRepairCost', reportForm.estimatedRepairCost);
      data.append('recommendedSettlementAmount', reportForm.recommendedSettlementAmount);
      data.append('salvageValue', reportForm.salvageValue);
      data.append('liabilityAssessment', reportForm.liabilityAssessment);

      for (const p of photos) {
        data.append('photos', p);
      }

      const res = await api.post('/survey/reports', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        showToast('Technical survey report submitted successfully to officer & manager!', 'success');
        navigate('/surveyor/inspections');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit report', 'error');
    } finally {
      setSubmittingReport(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-400 text-xs">Loading inspection workspace...</div>
    );
  }

  if (!assignment) {
    return (
      <div className="p-16 text-center">
        <h3 className="font-bold text-slate-800 text-base">Assignment Record Not Found</h3>
        <Link to="/surveyor/inspections" className="text-[#0000FF] text-xs font-semibold underline mt-2 block">
          Return to Inspection Queue
        </Link>
      </div>
    );
  }

  const claim = assignment.claim;

  return (
    <div className="space-y-6">
      <Header
        title={`Survey Assessment: Claim ${claim?.claimReference}`}
        subtitle={`Policyholder: ${claim?.customer?.name} | Category: ${claim?.customerPolicy?.category}`}
        actions={
          <Link
            to="/surveyor/inspections"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#D9E1FA] bg-white hover:bg-[#F5F7FF] text-xs font-semibold text-slate-700 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Queue
          </Link>
        }
      />

      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Scheduling Bar */}
        <div className="bg-white rounded-3xl border border-[#D9E1FA] p-6 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            Schedule Field Inspection
          </h3>
          <form onSubmit={handleSaveSchedule} className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1 w-full">
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Scheduled Inspection Date</label>
              <input
                type="date"
                required
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>

            <div className="flex-1 w-full">
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Inspection Location / Site</label>
              <input
                type="text"
                value={inspectionLocation}
                onChange={(e) => setInspectionLocation(e.target.value)}
                placeholder="e.g. Authorized Repair Garage, 450 Elm Street"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={savingSchedule}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition"
            >
              {savingSchedule ? 'Saving...' : 'Confirm Schedule'}
            </button>
          </form>
        </div>

        {/* Claim Background Information */}
        <div className="bg-white rounded-3xl border border-[#D9E1FA] p-6 shadow-xs text-xs space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Claim Incident Background</h3>
          <div className="p-3 bg-[#F5F7FF] rounded-xl border border-slate-100 text-slate-700 leading-relaxed">
            {claim?.incidentDescription}
          </div>
          <div className="flex gap-6 text-slate-500 pt-1">
            <span>Customer Claimed Amount: <strong>{formatINR(claim?.requestedAmount)}</strong></span>
            <span>Policy Limit: <strong>{formatINR(claim?.customerPolicy?.coverageAmount)}</strong></span>
          </div>
        </div>

        {/* Technical Survey Report Form */}
        <div className="bg-white rounded-3xl border border-[#D9E1FA] p-8 shadow-xs">
          <div className="border-b border-slate-100 pb-4 mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#101A38]">Technical Survey Report Template</h2>
              <p className="text-xs text-slate-500">Record engineering observations, repair invoices, and liability assessment</p>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 font-bold text-xs border border-purple-200">
              Certified Report
            </span>
          </div>

          <form onSubmit={handleSubmitReport} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Damage Summary (Brief) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={reportForm.damageSummary}
                  onChange={(e) => setReportForm({ ...reportForm, damageSummary: e.target.value })}
                  placeholder="e.g. Severe front bumper impact, crushed radiator, intact chassis"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-hidden focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Liability Assessment <span className="text-rose-500">*</span>
                </label>
                <select
                  value={reportForm.liabilityAssessment}
                  onChange={(e) => setReportForm({ ...reportForm, liabilityAssessment: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs bg-white font-semibold"
                >
                  <option value="PARTIAL_LOSS">PARTIAL LOSS (Standard Repairable)</option>
                  <option value="TOTAL_LOSS">TOTAL LOSS (Constructive Total Loss)</option>
                  <option value="STANDARD_REPAIR">STANDARD REPAIR (Minor Scratches/Dents)</option>
                  <option value="THIRD_PARTY_FAULT">THIRD PARTY FAULT (Subrogation Applicable)</option>
                  <option value="NO_INSURER_LIABILITY">NO INSURER LIABILITY (Excluded Per Policy)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Detailed Technical Findings & Inspection Notes <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={4}
                required
                value={reportForm.detailedFindings}
                onChange={(e) => setReportForm({ ...reportForm, detailedFindings: e.target.value })}
                placeholder="Itemize OEM parts replacement, labour hours, paint estimate, and structural integrity findings..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-hidden focus:border-purple-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Estimated Repair Cost (₹) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={reportForm.estimatedRepairCost}
                  onChange={(e) => setReportForm({ ...reportForm, estimatedRepairCost: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Recommended Settlement (₹) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={reportForm.recommendedSettlementAmount}
                  onChange={(e) => setReportForm({ ...reportForm, recommendedSettlementAmount: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-purple-300 text-xs font-black text-purple-700 bg-purple-50/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Estimated Salvage Value (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={reportForm.salvageValue}
                  onChange={(e) => setReportForm({ ...reportForm, salvageValue: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs"
                />
              </div>
            </div>

            {/* Photo Evidence Upload */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Upload Field Inspection Photographs
              </label>
              <div className="border-2 border-dashed border-slate-300 hover:border-purple-500 rounded-2xl p-6 text-center cursor-pointer transition bg-[#F5F7FF]">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  id="survey-photos-input"
                />
                <label htmlFor="survey-photos-input" className="cursor-pointer">
                  <Camera className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <span className="text-xs font-bold text-slate-800 block">Click to upload damage photographs</span>
                  <p className="text-[10px] text-slate-400 mt-0.5">Attach timestamped photographs of damages and repair progress</p>
                </label>
              </div>

              {photos.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {photos.map((p, i) => (
                    <div key={i} className="px-2.5 py-1 rounded-lg bg-purple-50 border border-purple-200 text-purple-800 text-xs flex items-center gap-1.5">
                      <span>{p.name}</span>
                      <button type="button" onClick={() => removePhoto(i)} className="text-purple-400 hover:text-rose-600">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Link
                to="/surveyor/inspections"
                className="px-4 py-2.5 rounded-xl border border-[#D9E1FA] text-slate-700 text-xs font-semibold"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submittingReport}
                className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs tracking-wide transition shadow-sm disabled:opacity-50"
              >
                {submittingReport ? 'Submitting Report...' : 'Submit Survey Report'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SurveyorReportWorkspace;
