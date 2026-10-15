import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Shield, Check, XCircle, FileText, AlertCircle, ShoppingCart, 
  ArrowLeft, ExternalLink, Info, HeartPulse, Car, Home as HomeIcon,
  Calendar, CheckCircle2, Clock, HelpCircle, Lock
} from 'lucide-react';
import { Navbar } from '../../components/common/Navbar';
import { Footer } from '../../components/common/Footer';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatINR } from '../../utils/currency';

export function PolicyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [applicationSuccess, setApplicationSuccess] = useState(null);

  useEffect(() => {
    fetchProductDetails();
  }, [id]);

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/policy-products/${id}`);
      if (res.data?.success) {
        setProduct(res.data.data);
      } else {
        setProduct(null);
      }
    } catch (err) {
      console.error('Failed to load product details', err);
      setProduct(null);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyPolicy = async () => {
    if (!isAuthenticated) {
      showToast('Please log in with a customer account to apply for this policy.', 'info');
      navigate(`/login?redirect=/policies/${id}`);
      return;
    }

    if (user.role !== 'CUSTOMER') {
      showToast('Only Customer accounts can hold and apply for insurance policies.', 'warning');
      return;
    }

    if (submitting) return;

    try {
      setSubmitting(true);
      const res = await api.post('/customer-policies/apply-platform', {
        productId: product._id,
        policyholderName: user.name,
      });

      if (res.data?.success) {
        setApplicationSuccess(res.data.data);
        showToast(res.data.message || 'Policy application successful!', 'success');
      }
    } catch (err) {
      console.error('Policy application failed', err);
      showToast(err.response?.data?.message || 'Failed to submit application. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const getCategoryIcon = (cat) => {
    switch (cat) {
      case 'HEALTH':
        return <HeartPulse className="w-4 h-4 text-blue-500" />;
      case 'VEHICLE':
        return <Car className="w-4 h-4 text-indigo-500" />;
      case 'PROPERTY':
        return <HomeIcon className="w-4 h-4 text-sky-500" />;
      default:
        return <Shield className="w-4 h-4 text-blue-500" />;
    }
  };

  const getCoverageLabel = (category) => {
    switch (category) {
      case 'VEHICLE':
        return 'Sample Insured Declared Value (IDV)';
      case 'PROPERTY':
        return 'Illustrative Insured Value';
      default:
        return 'Sample Coverage Limit';
    }
  };

  const getCategoryDisclaimer = (category) => {
    switch (category) {
      case 'VEHICLE':
        return 'Note: Vehicle Insured Declared Value (IDV) represents the maximum illustrative own-damage loss valuation and is not the annual premium or guaranteed claim payout amount. Final IDV is determined by vehicle age, registration, and survey inspection. Third-party liability cover is subject to standard Motor Vehicles Act terms.';
      case 'PROPERTY':
        return 'Note: The displayed coverage amount is an illustrative insured value across structure and general household contents. Actual cover depends on verified building construction, carpet area, insurable interest, and the issued policy schedule.';
      default:
        return 'Note: The displayed coverage amount is an illustrative sum insured limit for eligible inpatient medical expenses. Actual admissible reimbursements depend on policy terms, applicable deductibles, room rent limits, and network hospital approvals.';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F5F7FF]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center py-24">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-4 border-[#0000FF] border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-slate-600 font-semibold text-sm">Loading policy specifications...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F5F7FF]">
        <Navbar />
        <div className="flex-1 max-w-xl mx-auto py-20 px-4 text-center">
          <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-[#101A38]">Policy Product Not Found</h2>
          <p className="text-xs text-slate-500 mt-2 mb-6">
            The requested policy does not exist or has been unpublished from the catalog.
          </p>
          <Link
            to="/policies"
            className="px-5 py-2.5 rounded-xl bg-[#020950] hover:bg-[#0000FF] text-white text-xs font-bold transition inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Policy Catalog</span>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F7FF]">
      <Navbar />

      {/* Header Banner */}
      <section className="bg-gradient-to-b from-[#020950] via-[#020950] to-[#03096D] text-white py-12 px-4 sm:px-6 lg:px-8 border-b border-[#060A8A] relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[750px] h-[250px] bg-[#0000FF]/25 rounded-full blur-[130px] pointer-events-none"></div>

        <div className="max-w-6xl mx-auto relative z-10">
          <Link
            to="/policies"
            className="inline-flex items-center gap-1.5 text-xs text-[#8FA4E8] hover:text-white mb-4 transition font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Insurance Catalog
          </Link>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#0000FF]/20 text-[#8FA4E8] border border-[#0000FF]/40 flex items-center gap-1">
                  {getCategoryIcon(product.category)}
                  <span>{product.category}</span>
                </span>
                <span className="text-xs font-mono font-bold text-slate-300 bg-white/10 px-2 py-0.5 rounded-md">
                  Plan Code: {product.planCode}
                </span>
                <span className="text-[10px] font-semibold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full">
                  Demonstration Plan
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white font-display">
                {product.productName}
              </h1>

              <div className="text-sm text-slate-300 font-medium">
                Underwritten by <strong className="text-white">{product.insurer}</strong>
              </div>
            </div>

            {/* Actions in Banner */}
            <div className="flex flex-wrap items-center gap-3">
              {product.officialUrl && (
                <a
                  href={product.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-3 rounded-xl bg-[#03096D] hover:bg-[#060A8A] border border-[#060A8A] text-white font-semibold text-xs transition flex items-center gap-2"
                >
                  <span>Official Insurer Website</span>
                  <ExternalLink className="w-3.5 h-3.5 text-[#8FA4E8]" />
                </a>
              )}

              <button
                type="button"
                onClick={handleApplyPolicy}
                disabled={submitting || !!applicationSuccess}
                className="px-6 py-3 rounded-xl bg-[#0000FF] hover:bg-[#0000D0] text-white font-bold text-xs tracking-wide transition shadow-lg shadow-blue-800/40 glow-electric-hover flex items-center gap-2 disabled:opacity-50"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>
                  {submitting
                    ? 'Processing Application...'
                    : applicationSuccess
                    ? 'Policy Issued Successfully'
                    : 'Apply for Policy'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Workspace */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-8">
        
        {/* Success Alert Banner if just applied */}
        {applicationSuccess && (
          <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 shadow-sm flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-sm">Demonstration Policy Issued Successfully!</h3>
                <p className="text-xs text-emerald-700 mt-1">
                  Policy Number: <strong>{applicationSuccess.policyNumber}</strong> is now active in your customer portal. 
                  You can file claims against this policy for verification and settlement workflows.
                </p>
              </div>
            </div>
            <Link
              to="/customer/policies"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex-shrink-0"
            >
              View My Policies
            </Link>
          </div>
        )}

        {/* Mandatory Demonstration Disclaimer Box */}
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-950 text-xs leading-relaxed space-y-1.5 shadow-xs">
          <div className="flex items-center gap-2 font-bold text-amber-900">
            <Info className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>Important Illustrative Data Notice:</span>
          </div>
          <p className="pl-6">
            <strong>Demonstration catalog only.</strong> Premiums, coverage amounts, deductibles, benefits, eligibility, and exclusions shown here are illustrative and may not match the insurer's current offering. Confirm all details against the official policy wording before purchasing or applying.
          </p>
          <p className="pl-6 text-amber-800 text-[11px]">
            {getCategoryDisclaimer(product.category)}
          </p>
        </div>

        {/* Core Financial & Coverage Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          
          <div className="bg-white p-5 rounded-2xl border border-[#D9E1FA] shadow-xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
              {getCoverageLabel(product.category)}
            </span>
            <div className="text-xl sm:text-2xl font-black text-[#101A38] mt-1 font-heading">
              {formatINR(product.coverageLimit)}
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">
              {product.category === 'VEHICLE'
                ? 'Insured Declared Value'
                : product.category === 'PROPERTY'
                ? 'Structure & contents limit'
                : 'Maximum inpatient limit'}
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#D9E1FA] shadow-xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
              Illustrative Annual Premium
            </span>
            <div className="text-xl sm:text-2xl font-black text-[#0000FF] mt-1 font-heading">
              {formatINR(product.annualPremium)}
              <span className="text-xs font-semibold text-slate-500">/yr</span>
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">
              Estimated annual basis
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#D9E1FA] shadow-xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
              Sample Deductible
            </span>
            <div className="text-xl sm:text-2xl font-black text-[#101A38] mt-1 font-heading">
              {formatINR(product.deductible)}
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">
              {product.deductible === 0 ? 'Zero compulsory deductible' : 'Out-of-pocket per claim'}
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#D9E1FA] shadow-xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
              Term Duration
            </span>
            <div className="text-xl sm:text-2xl font-black text-[#101A38] mt-1 font-heading">
              {product.durationMonths || 12} Months
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">
              Renewable policy tenure
            </span>
          </div>

        </div>

        {/* Overview & Scope */}
        <div className="bg-white p-6 sm:p-7 rounded-2xl border border-[#D9E1FA] shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#0000FF]"></div>
            <h2 className="text-xs font-bold text-[#101A38] uppercase tracking-wider">
              Product Overview & Scope
            </h2>
          </div>
          <p className="text-sm text-slate-700 leading-relaxed font-normal">
            {product.description}
          </p>
          <div className="pt-2 text-[11px] text-slate-500 border-t border-slate-100 flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>
              All product terms, exclusions, and endorsements are governed by the insurer's underwriting guidelines and policy wording.
            </span>
          </div>
        </div>

        {/* Benefits & Exclusions Side-by-Side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Key Covered Benefits */}
          <div className="bg-white p-6 rounded-2xl border border-[#D9E1FA] shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold text-[#101A38] uppercase tracking-wider">
                  Covered Benefits & Entitlements
                </h3>
              </div>
              <ul className="space-y-3">
                {product.keyBenefits?.map((benefit, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed">
                    <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <p className="mt-4 pt-3 border-t border-slate-100 text-[10px] text-slate-500 italic">
              * Variant-specific benefits subject to confirmation in the actual policy wording.
            </p>
          </div>

          {/* Exclusions & Limitations */}
          <div className="bg-white p-6 rounded-2xl border border-[#D9E1FA] shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <XCircle className="w-4 h-4 text-rose-500" />
                <h3 className="text-xs font-bold text-[#101A38] uppercase tracking-wider">
                  Policy Exclusions & Limitations
                </h3>
              </div>
              <ul className="space-y-3">
                {product.exclusions?.map((exc, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed">
                    <XCircle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0 mt-0.5" />
                    <span>{exc}</span>
                  </li>
                ))}
              </ul>
            </div>
            <p className="mt-4 pt-3 border-t border-slate-100 text-[10px] text-slate-500 italic">
              * Refer to official policy terms for complete schedule of sub-limits and conditions.
            </p>
          </div>

        </div>

        {/* Required Documents & Eligibility */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Required Documents */}
          <div className="bg-white p-6 rounded-2xl border border-[#D9E1FA] shadow-xs">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-bold text-[#101A38] uppercase tracking-wider">
                Required Proof Documents for Claims
              </h3>
            </div>
            <div className="space-y-2.5">
              {product.requiredDocuments?.map((doc, i) => (
                <div key={i} className="p-3 rounded-xl bg-[#F5F7FF] border border-[#E8EDFF] text-xs text-slate-700 flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px] flex items-center justify-center flex-shrink-0">
                    {i + 1}
                  </span>
                  <span>{doc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Eligibility Criteria */}
          <div className="bg-white p-6 rounded-2xl border border-[#D9E1FA] shadow-xs">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-bold text-[#101A38] uppercase tracking-wider">
                Eligibility & Underwriting Criteria
              </h3>
            </div>
            <div className="space-y-2.5">
              {product.eligibilityCriteria?.map((criterion, i) => (
                <div key={i} className="p-3 rounded-xl bg-[#F5F7FF] border border-[#E8EDFF] text-xs text-slate-700 flex items-center gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 flex-shrink-0"></span>
                  <span>{criterion}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Bottom CTA Card */}
        <div className="bg-gradient-to-r from-[#020950] to-[#03096D] text-white p-6 sm:p-8 rounded-3xl border border-[#060A8A] shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1.5 text-center sm:text-left">
            <h3 className="text-lg sm:text-xl font-bold font-heading">
              Ready to test this policy in InsureFlow?
            </h3>
            <p className="text-xs text-slate-300 max-w-xl">
              Applying activates a platform demonstration policy under your customer account. 
              You can then simulate document uploads, rule-based verification, and settlement payouts.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {product.officialUrl && (
              <a
                href={product.officialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-4 py-3 rounded-xl bg-[#03096D] hover:bg-[#060A8A] border border-[#060A8A] text-white font-semibold text-xs text-center transition flex items-center justify-center gap-2"
              >
                <span>Insurer Website</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}

            <button
              type="button"
              onClick={handleApplyPolicy}
              disabled={submitting || !!applicationSuccess}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#0000FF] hover:bg-[#0000D0] text-white font-bold text-xs tracking-wide transition shadow-lg shadow-blue-800/40 glow-electric-hover flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>
                {submitting
                  ? 'Issuing...'
                  : applicationSuccess
                  ? 'Policy Active'
                  : 'Apply for Policy'}
              </span>
            </button>
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}

export default PolicyDetails;
