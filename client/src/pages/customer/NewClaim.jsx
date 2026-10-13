import { formatINR } from '../../utils/currency';
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  FilePlus,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  FileText,
  X,
  Sparkles,
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { RoleLayout } from '../../components/common/RoleLayout';
import { Header } from '../../components/common/Header';

export const NewClaim = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preSelectedPolicyId = searchParams.get('policyId');
  const { showToast } = useToast();

  const [policies, setPolicies] = useState([]);
  const [loadingPolicies, setLoadingPolicies] = useState(true);
  const [step, setStep] = useState(1);

  // Form State
  const [selectedPolicyId, setSelectedPolicyId] = useState(preSelectedPolicyId || '');
  const [claimType, setClaimType] = useState('REIMBURSEMENT');
  const [incidentDate, setIncidentDate] = useState('');
  const [incidentDescription, setIncidentDescription] = useState('');
  const [incidentLocation, setIncidentLocation] = useState('');
  const [requestedAmount, setRequestedAmount] = useState('');
  const [documentCategory, setDocumentCategory] = useState('MEDICAL_BILL');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        const res = await api.get('/customer-policies/my');
        if (res.data.success) {
          setPolicies(res.data.data);
          if (preSelectedPolicyId) {
            setSelectedPolicyId(preSelectedPolicyId);
          } else if (res.data.data.length > 0) {
            setSelectedPolicyId(res.data.data[0]._id);
          }
        }
      } catch (err) {
        console.error('Failed to load policies', err);
      } finally {
        setLoadingPolicies(false);
      }
    };
    fetchPolicies();
  }, [preSelectedPolicyId]);

  const selectedPolicy = policies.find((p) => p._id === selectedPolicyId);

  // File Handlers
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setUploadedFiles((prev) => [...prev, ...files]);
  };

  const removeFile = (index) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const validateStep = (currentStep) => {
    if (currentStep === 1) {
      if (!selectedPolicyId) {
        showToast('Please select an active policy to file claim against.', 'error');
        return false;
      }
      return true;
    }
    if (currentStep === 2) {
      if (!incidentDate || !incidentDescription || !requestedAmount) {
        showToast('Please fill out incident date, description, and requested claim amount.', 'error');
        return false;
      }
      if (Number(requestedAmount) <= 0) {
        showToast('Claim amount must be greater than zero.', 'error');
        return false;
      }
      return true;
    }
    if (currentStep === 3) {
      if (uploadedFiles.length === 0) {
        showToast('Please upload at least one supporting proof document (e.g. bill or repair invoice).', 'error');
        return false;
      }
      return true;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const handleBack = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmitClaim = async () => {
    try {
      setSubmitting(true);
      const data = new FormData();
      data.append('customerPolicyId', selectedPolicyId);
      data.append('claimType', claimType);
      data.append('incidentDate', incidentDate);
      data.append('incidentDescription', incidentDescription);
      data.append('incidentLocation', incidentLocation);
      data.append('requestedAmount', requestedAmount);
      data.append('documentCategory', documentCategory);

      for (const file of uploadedFiles) {
        data.append('documents', file);
      }

      const res = await api.post('/claims', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        showToast(`Claim ${res.data.data.claimReference} filed successfully! Automated document verification initiated.`, 'success');
        navigate(`/customer/claims/${res.data.data._id}`);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit claim', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Header
        title="Submit Insurance Claim"
        subtitle="Follow the step-by-step wizard to file an incident claim with supporting documents"
        actions={
          <Link
            to="/customer/claims"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#D9E1FA] bg-white hover:bg-[#F5F7FF] text-xs font-semibold text-slate-700 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to My Claims
          </Link>
        }
      />

      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Step Progress Bar */}
        <div className="bg-white p-4 rounded-2xl border border-[#D9E1FA] shadow-xs flex items-center justify-between text-xs">
          {[
            { num: 1, title: 'Select Policy' },
            { num: 2, title: 'Incident Details' },
            { num: 3, title: 'Upload Proof Documents' },
            { num: 4, title: 'Review & Pre-check' },
          ].map((item) => (
            <div key={item.num} className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                  step === item.num
                    ? 'bg-blue-600 text-white shadow-xs'
                    : step > item.num
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {step > item.num ? <CheckCircle2 className="w-4 h-4" /> : item.num}
              </div>
              <span className={`hidden sm:inline font-semibold ${step >= item.num ? 'text-[#101A38]' : 'text-slate-400'}`}>
                {item.title}
              </span>
            </div>
          ))}
        </div>

        {/* Wizard Card */}
        <div className="bg-white rounded-3xl border border-[#D9E1FA] p-8 shadow-xs">
          {/* STEP 1: SELECT POLICY */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-base font-bold text-[#101A38]">Step 1: Choose Insurance Policy</h3>
                <p className="text-xs text-slate-500 mt-0.5">Select from your registered platform policies or external policies</p>
              </div>

              {loadingPolicies ? (
                <div className="text-center py-8 text-slate-400 text-xs">Loading your policies...</div>
              ) : policies.length === 0 ? (
                <div className="p-6 text-center bg-[#F5F7FF] rounded-2xl border border-[#D9E1FA] text-xs text-slate-600">
                  <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="font-semibold text-slate-800">No active policies found on your account.</p>
                  <p className="mt-1 mb-4 text-slate-500">You must register an external policy or apply for a platform policy first.</p>
                  <div className="flex justify-center gap-2">
                    <Link to="/customer/policies/register-external" className="px-3.5 py-1.5 rounded-lg bg-slate-900 text-white font-semibold">
                      Register External Policy
                    </Link>
                    <Link to="/policies" className="px-3.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 font-semibold">
                      Browse Catalog
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {policies.map((pol) => {
                    const isSelected = selectedPolicyId === pol._id;
                    return (
                      <div
                        key={pol._id}
                        onClick={() => setSelectedPolicyId(pol._id)}
                        className={`p-4 rounded-2xl border cursor-pointer transition flex items-center justify-between gap-4 ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/40 shadow-xs'
                            : 'border-[#D9E1FA] bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="policySelect"
                            checked={isSelected}
                            onChange={() => setSelectedPolicyId(pol._id)}
                            className="w-4 h-4 text-[#0000FF] focus:ring-0"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-[#101A38]">{pol.insurerName}</span>
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-[#D9E1FA]">
                                {pol.category}
                              </span>
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                                {pol.policySource}
                              </span>
                            </div>
                            <div className="text-xs font-mono text-slate-500 mt-0.5">#{pol.policyNumber}</div>
                          </div>
                        </div>

                        <div className="text-right text-xs">
                          <div className="font-bold text-[#101A38]">{formatINR(pol.coverageAmount)}</div>
                          <div className="text-[10px] text-slate-400">Deductible: {formatINR(pol.deductible)}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* STEP 2: INCIDENT DETAILS */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-base font-bold text-[#101A38]">Step 2: Incident & Claim Particulars</h3>
                <p className="text-xs text-slate-500 mt-0.5">Describe what happened and specify the requested reimbursement amount</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Claim Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={claimType}
                    onChange={(e) => setClaimType(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-hidden focus:border-blue-600 bg-white"
                  >
                    <option value="REIMBURSEMENT">Reimbursement</option>
                    <option value="CASHLESS">Cashless Authorization</option>
                    <option value="ACCIDENTAL_DAMAGE">Accidental Damage</option>
                    <option value="PROPERTY_DAMAGE">Property Damage</option>
                    <option value="THEFT">Theft / Total Loss</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Date of Incident <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={incidentDate}
                    onChange={(e) => setIncidentDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-hidden focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Requested Claim Amount (₹) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={requestedAmount}
                    onChange={(e) => setRequestedAmount(e.target.value)}
                    placeholder="e.g. 2400.00"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-hidden focus:border-blue-600 font-bold"
                  />
                  {selectedPolicy && (
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Max policy coverage limit: {formatINR(selectedPolicy.coverageAmount)}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Location of Incident / Treatment Facility
                  </label>
                  <input
                    type="text"
                    value={incidentLocation}
                    onChange={(e) => setIncidentLocation(e.target.value)}
                    placeholder="e.g. Springfield Memorial Hospital, Highway 101"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-hidden focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Detailed Description of Incident <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={incidentDescription}
                  onChange={(e) => setIncidentDescription(e.target.value)}
                  placeholder="Provide an accurate, detailed explanation of how the loss or medical emergency occurred..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-hidden focus:border-blue-600"
                />
              </div>
            </div>
          )}

          {/* STEP 3: UPLOAD PROOF DOCUMENTS */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-base font-bold text-[#101A38]">Step 3: Upload Supporting Proof Documents</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Our OCR engine will extract text, detect totals and dates, and pre-verify your claim
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Document Category</label>
                <select
                  value={documentCategory}
                  onChange={(e) => setDocumentCategory(e.target.value)}
                  className="w-full sm:w-72 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-hidden focus:border-blue-600 bg-white"
                >
                  <option value="MEDICAL_BILL">Hospital / Medical Bill</option>
                  <option value="DISCHARGE_SUMMARY">Discharge Summary</option>
                  <option value="REPAIR_ESTIMATE">Workshop Repair Estimate / Invoice</option>
                  <option value="VEHICLE_RC">Vehicle Registration Certificate (RC)</option>
                  <option value="ACCIDENT_PHOTO">Accident Photograph</option>
                  <option value="PRESCRIPTION">Prescription & Diagnostic Report</option>
                  <option value="OTHER">Other Supporting Document</option>
                </select>
              </div>

              <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-8 text-center cursor-pointer transition bg-[#F5F7FF]">
                <input
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className="hidden"
                  id="claim-docs-input"
                />
                <label htmlFor="claim-docs-input" className="cursor-pointer">
                  <UploadCloud className="w-10 h-10 text-[#0000FF] mx-auto mb-2" />
                  <span className="text-xs font-bold text-slate-800 block">Click to upload receipts, bills, or PDFs</span>
                  <p className="text-[11px] text-slate-400 mt-0.5">Supports PDF, JPG, PNG up to 10MB per file</p>
                </label>
              </div>

              {/* Uploaded Files Queue */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-700 block">Selected Files ({uploadedFiles.length}):</span>
                  {uploadedFiles.map((f, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-[#F5F7FF] border border-[#D9E1FA] flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <FileText className="w-4 h-4 text-[#0000FF] flex-shrink-0" />
                        <span className="font-semibold text-slate-800 truncate">{f.name}</span>
                        <span className="text-slate-400 text-[10px]">({(f.size / 1024).toFixed(0)} KB)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        className="text-slate-400 hover:text-rose-600 transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 4: REVIEW & PRE-CHECK */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-base font-bold text-[#101A38]">Step 4: Final Review & Automated Pre-Check</h3>
                <p className="text-xs text-slate-500 mt-0.5">Review your claim summary before creating an auditable submission record</p>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-[#F5F7FF] border border-[#D9E1FA] space-y-2">
                  <div className="font-bold text-[#101A38] text-sm mb-2">Policy Summary</div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Insurer:</span>
                    <span className="font-bold text-slate-800">{selectedPolicy?.insurerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Policy Number:</span>
                    <span className="font-mono text-slate-800">{selectedPolicy?.policyNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Source:</span>
                    <span className="font-semibold text-[#0000FF]">{selectedPolicy?.policySource}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Coverage Limit:</span>
                    <span className="font-bold text-[#101A38]">{formatINR(selectedPolicy?.coverageAmount)}</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#F5F7FF] border border-[#D9E1FA] space-y-2">
                  <div className="font-bold text-[#101A38] text-sm mb-2">Claim Summary</div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Requested Amount:</span>
                    <span className="font-black text-[#101A38] text-sm">{formatINR(requestedAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Incident Date:</span>
                    <span className="font-semibold text-slate-800">{incidentDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Claim Type:</span>
                    <span className="font-semibold text-slate-800">{claimType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Uploaded Documents:</span>
                    <span className="font-bold text-[#0000FF]">{uploadedFiles.length} file(s)</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 text-xs text-blue-900 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-[#0000FF] flex-shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong>Automated Pipeline Notice:</strong> Upon clicking submit, our server executes background OCR extraction, runs 7 deterministic rule checks, and notifies your assigned verification officer. You will receive an official claim reference number immediately.
                </div>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex justify-between items-center pt-6 mt-6 border-t border-slate-100">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="px-4 py-2 rounded-xl border border-[#D9E1FA] text-slate-700 text-xs font-semibold hover:bg-[#F5F7FF] transition flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Previous Step
              </button>
            ) : (
              <div></div>
            )}

            {step < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs tracking-wide transition flex items-center gap-1.5 shadow-sm"
              >
                Continue <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmitClaim}
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-[#0000FF] hover:bg-[#0000D0] text-white font-bold shadow-md shadow-blue-800/30 glow-electric-hover text-xs tracking-wide transition shadow-md flex items-center gap-1.5 disabled:opacity-50"
              >
                {submitting ? 'Processing & Submitting...' : 'Submit Claim'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewClaim;
