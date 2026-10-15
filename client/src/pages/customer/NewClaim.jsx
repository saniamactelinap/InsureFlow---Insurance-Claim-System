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
  AlertTriangle,
  FileText,
  X,
  Sparkles,
  RefreshCw,
  Edit3,
  Eye,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { RoleLayout } from '../../components/common/RoleLayout';
import { Header } from '../../components/common/Header';

export const NewClaim = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preSelectedPolicyId = searchParams.get('policyId');
  const { user } = useAuth();
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
  
  // OCR & Document Upload State
  // Array of: { id, file, originalName, sizeBytes, mimeType, status, progress, ocrResult, correctedFields, userEdited, rawTextExpanded, errorMsg }
  const [scannedDocs, setScannedDocs] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

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

  // File Upload & Real-time OCR Execution
  const handleFileUpload = async (filesToProcess) => {
    const validFiles = [];
    const maxSizeBytes = 10 * 1024 * 1024; // 10MB limit

    for (const file of filesToProcess) {
      if (file.size > maxSizeBytes) {
        showToast(`File "${file.name}" exceeds the 10MB size limit.`, 'error');
        continue;
      }
      const ext = file.name.split('.').pop().toLowerCase();
      if (!['pdf', 'jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
        showToast(`File "${file.name}" has an unsupported format. Please upload PDF, JPG, or PNG.`, 'error');
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    for (const file of validFiles) {
      const docId = `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const newDocEntry = {
        id: docId,
        file,
        originalName: file.name,
        sizeBytes: file.size,
        mimeType: file.type || 'application/octet-stream',
        documentCategory,
        status: 'UPLOADING', // 'UPLOADING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
        progress: 0,
        ocrResult: null,
        correctedFields: {},
        userEdited: false,
        rawTextExpanded: false,
        errorMsg: '',
      };

      setScannedDocs((prev) => [...prev, newDocEntry]);

      // Execute upload & OCR processing
      runOcrForDocument(docId, file, documentCategory);
    }
  };

  const runOcrForDocument = async (docId, file, category) => {
    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('documentCategory', category);
      formData.append('category', selectedPolicy?.category || 'HEALTH');

      // Update state to UPLOADING with progress
      setScannedDocs((prev) =>
        prev.map((d) => (d.id === docId ? { ...d, status: 'UPLOADING', progress: 30 } : d))
      );

      // Transition to PROCESSING
      setTimeout(() => {
        setScannedDocs((prev) =>
          prev.map((d) => (d.id === docId && d.status === 'UPLOADING' ? { ...d, status: 'PROCESSING', progress: 70 } : d))
        );
      }, 400);

      const res = await api.post('/ocr/scan', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        const ocrData = res.data;
        setScannedDocs((prev) =>
          prev.map((d) => {
            if (d.id !== docId) return d;
            return {
              ...d,
              status: 'COMPLETED',
              progress: 100,
              ocrResult: ocrData,
              correctedFields: { ...(ocrData.fields || {}) },
              fileMeta: ocrData.fileMeta,
            };
          })
        );
        showToast(`Document "${file.name}" scanned successfully with ${res.data.extractionMethod}!`, 'success');
      } else {
        throw new Error(res.data.error || 'OCR extraction failed on the document.');
      }
    } catch (err) {
      console.error('[OCR Upload Error]', err);
      const errMsg = err.response?.data?.message || err.message || 'Optical processing failed.';
      setScannedDocs((prev) =>
        prev.map((d) => (d.id === docId ? { ...d, status: 'FAILED', errorMsg: errMsg } : d))
      );
      showToast(`Failed to scan "${file.name}": ${errMsg}`, 'error');
    }
  };

  const handleFieldChange = (docId, fieldKey, value) => {
    setScannedDocs((prev) =>
      prev.map((d) => {
        if (d.id !== docId) return d;
        return {
          ...d,
          userEdited: true,
          correctedFields: {
            ...d.correctedFields,
            [fieldKey]: value,
          },
        };
      })
    );
  };

  const removeDoc = (docId) => {
    setScannedDocs((prev) => prev.filter((d) => d.id !== docId));
  };

  const retryDoc = (docId) => {
    const doc = scannedDocs.find((d) => d.id === docId);
    if (doc) {
      runOcrForDocument(docId, doc.file, doc.documentCategory);
    }
  };

  const toggleRawText = (docId) => {
    setScannedDocs((prev) =>
      prev.map((d) => (d.id === docId ? { ...d, rawTextExpanded: !d.rawTextExpanded } : d))
    );
  };

  const copyText = (docId, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(docId);
    setTimeout(() => setCopiedId(null), 2000);
    showToast('Raw document text copied to clipboard.', 'success');
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
      if (scannedDocs.length === 0) {
        showToast('Please upload at least one supporting proof document (e.g. bill or repair invoice).', 'error');
        return false;
      }
      const pendingOrUploading = scannedDocs.some((d) => d.status === 'UPLOADING' || d.status === 'PROCESSING');
      if (pendingOrUploading) {
        showToast('Please wait for active document scanning to complete before proceeding.', 'warning');
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

      // Serialize pre-scanned documents with OCR results and user corrections
      const preScannedPayload = scannedDocs.map((d) => ({
        originalName: d.originalName,
        fileName: d.fileMeta?.fileName || d.file?.name,
        filePath: d.fileMeta?.filePath || '',
        fileUrl: d.fileMeta?.fileUrl || '',
        mimeType: d.mimeType,
        sizeBytes: d.sizeBytes,
        documentCategory: d.documentCategory,
        status: d.status,
        confidenceScore: d.ocrResult?.confidenceScore ?? 0,
        opticalConfidence: d.ocrResult?.opticalConfidence ?? 0,
        fieldExtractionConfidence: d.ocrResult?.fieldExtractionConfidence ?? 0,
        reviewStatus: d.ocrResult?.reviewStatus ?? 'NEEDS_MANUAL_REVIEW',
        extractionMethod: d.ocrResult?.extractionMethod || 'unknown',
        rawText: d.ocrResult?.rawText || '',
        fields: d.ocrResult?.fields || {},
        correctedFields: d.correctedFields || {},
        hasUserCorrections: d.userEdited,
        durationMs: d.ocrResult?.durationMs || 0,
        warnings: d.ocrResult?.warnings || [],
        fileMeta: d.fileMeta,
      }));

      data.append('preScannedDocs', JSON.stringify(preScannedPayload));

      // Also append original files as fallback multipart
      for (const doc of scannedDocs) {
        if (doc.file) {
          data.append('documents', doc.file);
        }
      }

      const res = await api.post('/claims', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        showToast(`Claim ${res.data.data.claimReference} filed successfully! Document verification linked.`, 'success');
        navigate(`/customer/claims/${res.data.data._id}`);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit claim', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Helper to format extraction method badge
  const getMethodBadge = (method) => {
    switch (method) {
      case 'pdf_text':
      case 'pdf_text_repaired':
        return { label: 'Digital PDF Text Layer', color: 'bg-blue-100 text-blue-800 border-blue-200' };
      case 'scanned_pdf_image_ocr':
        return { label: 'Scanned PDF Image OCR', color: 'bg-amber-100 text-amber-800 border-amber-200' };
      case 'multi_page_scanned_pdf_ocr':
        return { label: 'Multi-Page Scanned PDF OCR', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' };
      case 'tesseract_ocr':
        return { label: 'Tesseract OCR Engine', color: 'bg-purple-100 text-purple-800 border-purple-200' };
      default:
        return { label: method || 'Optical Extraction', color: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  return (
    <div className="space-y-6">
      <Header
        title="Submit Insurance Claim"
        subtitle="Follow the step-by-step wizard to file an incident claim with real-time OCR document verification"
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

          {/* STEP 3: UPLOAD PROOF DOCUMENTS & OCR PROCESSING */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-base font-bold text-[#101A38]">Step 3: Upload Supporting Proof Documents</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Our OCR pipeline parses your actual document, extracts dates, patient details, and billed amounts, and allows review
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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

                <div className="text-xs text-slate-500 flex items-center gap-1.5 bg-blue-50/70 border border-blue-200 px-3 py-2 rounded-xl">
                  <Sparkles className="w-4 h-4 text-[#0000FF] flex-shrink-0" />
                  <span>Real OCR extraction executes automatically upon upload</span>
                </div>
              </div>

              {/* Upload Drop Zone */}
              <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-8 text-center cursor-pointer transition bg-[#F5F7FF] relative">
                <input
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  onChange={(e) => handleFileUpload(Array.from(e.target.files))}
                  className="hidden"
                  id="claim-docs-input"
                />
                <label htmlFor="claim-docs-input" className="cursor-pointer block">
                  <UploadCloud className="w-10 h-10 text-[#0000FF] mx-auto mb-2" />
                  <span className="text-xs font-bold text-slate-800 block">Click to upload medical bills, invoices, or scanned receipts</span>
                  <p className="text-[11px] text-slate-400 mt-0.5">Supports PDF (digital & scanned), JPG, PNG up to 10MB per file</p>
                </label>
              </div>

              {/* Processed / Processing Documents List */}
              {scannedDocs.length > 0 && (
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Uploaded Documents ({scannedDocs.length}):</span>
                    <span className="text-[11px] text-slate-400">Review & verify extracted fields below</span>
                  </div>

                  {scannedDocs.map((doc) => {
                    const methodBadge = getMethodBadge(doc.ocrResult?.extractionMethod);
                    const fields = doc.correctedFields || {};
                    const warnings = doc.ocrResult?.warnings || [];

                    return (
                      <div
                        key={doc.id}
                        className="rounded-2xl border border-[#D9E1FA] bg-white overflow-hidden shadow-xs"
                      >
                        {/* Header bar */}
                        <div className="p-4 bg-[#F5F7FF] border-b border-[#D9E1FA] flex flex-wrap items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-2.5 truncate max-w-md">
                            <FileText className="w-5 h-5 text-[#0000FF] flex-shrink-0" />
                            <div className="truncate">
                              <span className="font-bold text-slate-800 truncate block">{doc.originalName}</span>
                              <span className="text-slate-400 text-[10px]">
                                {(doc.sizeBytes / 1024).toFixed(0)} KB • {doc.documentCategory.replace(/_/g, ' ')}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Processing States */}
                            {doc.status === 'UPLOADING' && (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 flex items-center gap-1.5 animate-pulse">
                                <RefreshCw className="w-3 h-3 animate-spin" /> Uploading ({doc.progress}%)...
                              </span>
                            )}
                            {doc.status === 'PROCESSING' && (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1.5 animate-pulse">
                                <Sparkles className="w-3 h-3 animate-spin" /> Processing OCR...
                              </span>
                            )}
                            {doc.status === 'COMPLETED' && (
                              <>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${methodBadge.color}`}>
                                  {methodBadge.label}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  (doc.ocrResult?.confidenceScore || 0) >= 70
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {doc.ocrResult?.confidenceScore || 0}% Confidence
                                </span>
                              </>
                            )}
                            {doc.status === 'FAILED' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                                Failed
                              </span>
                            )}

                            {doc.status === 'FAILED' && (
                              <button
                                type="button"
                                onClick={() => retryDoc(doc.id)}
                                className="px-2 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-[10px] font-semibold text-slate-700"
                              >
                                Retry
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => removeDoc(doc.id)}
                              className="text-slate-400 hover:text-rose-600 p-1 rounded-lg transition"
                              title="Remove document"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Error state display */}
                        {doc.status === 'FAILED' && (
                          <div className="p-4 bg-rose-50 text-rose-700 text-xs flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            <span>{doc.errorMsg || 'OCR processing encountered an unrecoverable error. Please re-upload or try another file.'}</span>
                          </div>
                        )}

                        {/* Completed OCR extraction panel */}
                        {doc.status === 'COMPLETED' && (
                          <div className="p-5 space-y-4">
                            {/* Warnings banner if any */}
                            {warnings.length > 0 && (
                              <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-800 space-y-1">
                                <div className="font-bold flex items-center gap-1.5">
                                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                                  <span>Extraction Notices & Warnings:</span>
                                </div>
                                <ul className="list-disc pl-5 space-y-0.5 text-[11px] text-amber-700">
                                  {warnings.map((w, idx) => (
                                    <li key={idx}>{w}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Extracted Fields Form */}
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-[#101A38] flex items-center gap-1.5">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  Extracted Information (Review & Correct if needed)
                                </span>
                                {doc.userEdited && (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">
                                    Customer Corrected
                                  </span>
                                )}
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                                <div>
                                  <label className="block text-[11px] font-medium text-slate-500 mb-1">
                                    Patient Name
                                  </label>
                                  <input
                                    type="text"
                                    value={fields.patientName || ''}
                                    placeholder="Not detected"
                                    onChange={(e) => handleFieldChange(doc.id, 'patientName', e.target.value)}
                                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:outline-hidden focus:border-blue-600 text-xs"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[11px] font-medium text-slate-500 mb-1">
                                    Hospital / Facility Name
                                  </label>
                                  <input
                                    type="text"
                                    value={fields.hospitalName || ''}
                                    placeholder="Not detected"
                                    onChange={(e) => handleFieldChange(doc.id, 'hospitalName', e.target.value)}
                                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:outline-hidden focus:border-blue-600 text-xs"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[11px] font-medium text-slate-500 mb-1">
                                    Invoice / Bill #
                                  </label>
                                  <input
                                    type="text"
                                    value={fields.invoiceNumber || ''}
                                    placeholder="Not detected"
                                    onChange={(e) => handleFieldChange(doc.id, 'invoiceNumber', e.target.value)}
                                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:outline-hidden focus:border-blue-600 text-xs font-mono"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[11px] font-medium text-slate-500 mb-1">
                                    Invoice Date
                                  </label>
                                  <input
                                    type="text"
                                    value={fields.invoiceDate || ''}
                                    placeholder="Not detected"
                                    onChange={(e) => handleFieldChange(doc.id, 'invoiceDate', e.target.value)}
                                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:outline-hidden focus:border-blue-600 text-xs"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[11px] font-medium text-slate-500 mb-1">
                                    Total Bill Amount (₹)
                                  </label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={fields.totalAmount !== null && fields.totalAmount !== undefined ? fields.totalAmount : ''}
                                    placeholder="Not detected"
                                    onChange={(e) => handleFieldChange(doc.id, 'totalAmount', e.target.value ? parseFloat(e.target.value) : null)}
                                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:outline-hidden focus:border-blue-600 text-xs font-bold text-slate-900"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[11px] font-medium text-slate-500 mb-1">
                                    Payment Status
                                  </label>
                                  <input
                                    type="text"
                                    value={fields.paymentStatus || ''}
                                    placeholder="Not stated"
                                    onChange={(e) => handleFieldChange(doc.id, 'paymentStatus', e.target.value)}
                                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:outline-hidden focus:border-blue-600 text-xs"
                                  />
                                </div>
                              </div>

                              {fields.diagnosis && (
                                <div className="mt-2 text-xs">
                                  <span className="text-[11px] font-medium text-slate-500">Diagnosis / Treatment: </span>
                                  <span className="text-slate-800 font-semibold">{fields.diagnosis}</span>
                                </div>
                              )}
                            </div>

                            {/* Collapsible Raw Text */}
                            <div className="border-t border-slate-100 pt-3">
                              <div className="flex items-center justify-between">
                                <button
                                  type="button"
                                  onClick={() => toggleRawText(doc.id)}
                                  className="text-[11px] font-semibold text-slate-600 hover:text-blue-600 flex items-center gap-1 transition"
                                >
                                  {doc.rawTextExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                  {doc.rawTextExpanded ? 'Hide Raw OCR Text' : 'View Extracted Raw Text'}
                                </button>

                                {doc.rawTextExpanded && (
                                  <button
                                    type="button"
                                    onClick={() => copyText(doc.id, doc.ocrResult?.rawText || '')}
                                    className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 transition"
                                  >
                                    {copiedId === doc.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                    <span>{copiedId === doc.id ? 'Copied' : 'Copy'}</span>
                                  </button>
                                )}
                              </div>

                              {doc.rawTextExpanded && (
                                <pre className="mt-2 p-3 bg-slate-900 text-slate-100 rounded-xl text-[10px] font-mono whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed border border-slate-800">
                                  {doc.ocrResult?.rawText || '(No raw text extracted)'}
                                </pre>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* STEP 4: REVIEW & PRE-CHECK */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-base font-bold text-[#101A38]">Step 4: Final Review & Automated Pre-Check</h3>
                <p className="text-xs text-slate-500 mt-0.5">Review your claim summary and cross-document verification before submission</p>
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
                    <span className="font-bold text-[#0000FF]">{scannedDocs.length} file(s) scanned</span>
                  </div>
                </div>
              </div>

              {/* AUTOMATED OCR PRE-CHECK & ALIGNMENT PANEL */}
              <div className="p-5 rounded-2xl border border-[#D9E1FA] bg-white space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-[#0000FF]" />
                    <span className="font-bold text-sm text-[#101A38]">Automated Pre-Check & Document Cross-Verification</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                    Rule Engine v2.4
                  </span>
                </div>

                {scannedDocs.length === 0 ? (
                  <p className="text-xs text-slate-500">No documents uploaded yet to cross-verify.</p>
                ) : (
                  <div className="space-y-3">
                    {scannedDocs.map((doc, idx) => {
                      const fields = doc.correctedFields || {};
                      const userAccountName = user?.name || '';
                      const reqAmt = parseFloat(requestedAmount) || 0;
                      const docTotal = fields.totalAmount;

                      // 1. Patient Name Cross-check
                      let patientCheck = { status: 'NEUTRAL', text: 'Patient name was not detected on this document.' };
                      if (fields.patientName) {
                        const patLower = fields.patientName.toLowerCase();
                        const userLower = userAccountName.toLowerCase();
                        const isMatch = patLower.includes(userLower) || userLower.includes(patLower);
                        if (isMatch) {
                          patientCheck = {
                            status: 'SUCCESS',
                            text: `Patient name "${fields.patientName}" aligns with policyholder account (${userAccountName}).`,
                          };
                        } else {
                          patientCheck = {
                            status: 'WARNING',
                            text: `Name variance: Document identifies "${fields.patientName}", while account is "${userAccountName}". Flagged for officer inspection.`,
                          };
                        }
                      }

                      // 2. Amount Cross-check
                      let amountCheck = { status: 'NEUTRAL', text: 'Document bill total could not be detected.' };
                      if (docTotal !== null && docTotal !== undefined) {
                        if (Math.abs(reqAmt - docTotal) < 0.01) {
                          amountCheck = {
                            status: 'SUCCESS',
                            text: `Requested amount (${formatINR(reqAmt)}) matches detected document total (${formatINR(docTotal)}) exactly.`,
                          };
                        } else if (reqAmt <= docTotal) {
                          amountCheck = {
                            status: 'SUCCESS',
                            text: `Requested amount (${formatINR(reqAmt)}) is within document total (${formatINR(docTotal)}).`,
                          };
                        } else {
                          const diff = reqAmt - docTotal;
                          amountCheck = {
                            status: 'WARNING',
                            text: `Requested amount (${formatINR(reqAmt)}) exceeds detected document bill total (${formatINR(docTotal)}) by ${formatINR(diff)}. Flagged for officer review.`,
                          };
                        }
                      }

                      // 3. Invoice Number Check
                      const invNumberCheck = fields.invoiceNumber
                        ? { status: 'SUCCESS', text: `Official invoice/bill number detected: #${fields.invoiceNumber}` }
                        : { status: 'WARNING', text: 'No clear invoice or bill reference number identified on document.' };

                      return (
                        <div key={doc.id} className="p-3.5 rounded-xl bg-[#F5F7FF] border border-[#D9E1FA] space-y-2 text-xs">
                          <div className="font-bold text-slate-800 flex items-center justify-between">
                            <span className="flex items-center gap-1.5 truncate">
                              <FileText className="w-3.5 h-3.5 text-[#0000FF]" /> {doc.originalName}
                            </span>
                            <span className="text-[10px] font-normal text-slate-500">
                              Method: {doc.ocrResult?.extractionMethod || 'OCR'}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 gap-2 pt-1">
                            {/* Patient check item */}
                            <div className="flex items-start gap-2">
                              {patientCheck.status === 'SUCCESS' && <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />}
                              {patientCheck.status === 'WARNING' && <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />}
                              {patientCheck.status === 'NEUTRAL' && <AlertCircle className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />}
                              <span className={patientCheck.status === 'WARNING' ? 'text-amber-800' : 'text-slate-700'}>
                                {patientCheck.text}
                              </span>
                            </div>

                            {/* Amount check item */}
                            <div className="flex items-start gap-2">
                              {amountCheck.status === 'SUCCESS' && <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />}
                              {amountCheck.status === 'WARNING' && <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />}
                              {amountCheck.status === 'NEUTRAL' && <AlertCircle className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />}
                              <span className={amountCheck.status === 'WARNING' ? 'text-amber-800' : 'text-slate-700'}>
                                {amountCheck.text}
                              </span>
                            </div>

                            {/* Invoice number check */}
                            <div className="flex items-start gap-2">
                              {invNumberCheck.status === 'SUCCESS' && <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />}
                              {invNumberCheck.status === 'WARNING' && <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />}
                              <span className={invNumberCheck.status === 'WARNING' ? 'text-amber-800' : 'text-slate-700'}>
                                {invNumberCheck.text}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 leading-relaxed">
                      <strong>Fair Adjudication Guarantee:</strong> Automated pre-check flags inconsistencies (such as name or amount variances) as advisory signals for claims officers. Discrepancies do not automatically reject your claim. Every claim is subject to human officer verification.
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 text-xs text-blue-900 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-[#0000FF] flex-shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong>Auditable Record Creation:</strong> Clicking submit will create an official claim record, persist document extraction results, run deterministic policy validation rules, and notify your claims officer.
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
                className="px-6 py-2.5 rounded-xl bg-[#0000FF] hover:bg-[#0000D0] text-white font-bold shadow-md shadow-blue-800/30 glow-electric-hover text-xs tracking-wide transition flex items-center gap-1.5 disabled:opacity-50"
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
