import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  ArrowRight,
  CheckCircle,
  FileText,
  Clock,
  HeartPulse,
  Car,
  Home as HomeIcon,
  Search,
  ChevronDown,
  Lock,
  Layers,
  Activity,
  UserCheck,
  Star,
} from 'lucide-react';
import { Navbar } from '../../components/common/Navbar';
import { Footer } from '../../components/common/Footer';
import api from '../../services/api';
import { formatINR } from '../../utils/currency';

export const Home = () => {
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [openFaq, setOpenFaq] = useState(0);

  useEffect(() => {
    const fetchPublishedPolicies = async () => {
      try {
        setLoadingProducts(true);
        const res = await api.get('/policy-products');
        if (res.data && res.data.success) {
          setProducts(res.data.data || []);
        }
      } catch (err) {
        console.error('[Home] Failed to load published policies:', err);
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchPublishedPolicies();
  }, []);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const categories = [
    {
      id: 'HEALTH',
      label: 'Health Protection',
      icon: HeartPulse,
      image: '/images/health.jpg',
      desc: 'Inpatient hospitalization, day-care treatments, and cashless network medical coverage.',
    },
    {
      id: 'VEHICLE',
      label: 'Vehicle & Fleet',
      icon: Car,
      image: '/images/vehicle.jpg',
      desc: 'Collision repair, zero depreciation, and professional damage inspection.',
    },
    {
      id: 'PROPERTY',
      label: 'Property & Real Estate',
      icon: HomeIcon,
      image: '/images/property.jpg',
      desc: 'Comprehensive structural restoration, storm damage, and home asset protection.',
    },
  ];

  const faqs = [
    {
      q: 'How do I file a claim on my policy?',
      a: 'Once signed in as a policyholder, navigate to Submit New Claim. Select your active policy, provide incident details (date, category, claimed amount), and upload supporting documentation such as hospital discharge summaries, vehicle workshop repair estimates, or police reports. Our automated pipeline immediately begins document analysis.',
    },
    {
      q: 'Can I file a claim on a policy purchased from another insurance provider?',
      a: 'Yes. InsureFlow features multi-insurer interoperability. You can register an external policy (e.g., Allianz, Metropolitan, State Mutual) by uploading your certificate. Once reviewed by our verification team, you can submit and track claims against your external coverage just like any native platform policy.',
    },
    {
      q: 'What happens after I submit my claim documents?',
      a: 'Your submitted invoices and estimates are analyzed using OCR extraction to capture line items and provider details. Then deterministic rules check your policy active dates, coverage limits, and deductible requirements. If technical inspection is required, a field surveyor is dispatched, after which a claims manager signs off on payout.',
    },
    {
      q: 'How are claim limits and deductibles calculated?',
      a: 'Every published insurance plan defines a specific coverage limit and deductible. For example, on a ₹50,000 policy with a ₹250 deductible, approved damages above ₹250 are payable up to ₹50,000. Your dashboard tracks lifetime utilization and remaining available coverage in real time.',
    },
    {
      q: 'How long does claim verification and adjudication typically take?',
      a: 'Automated OCR extraction and baseline policy rule checks happen within moments of submission. Simple claims with complete documentation are typically reviewed by an adjudication officer within 24 to 48 hours. If an on-site damage survey is scheduled, updates are posted live to your claim timeline.',
    },
    {
      q: 'How do I receive my settlement payout once approved?',
      a: 'Upon manager authorization, a settlement record is generated with a unique reference number. Payouts are scheduled via automated electronic transfer to your registered bank account, and you receive instant confirmation with detailed deductible and net payout accounting.',
    },
  ];

  const filteredProducts =
    selectedCategory === 'ALL'
      ? products
      : products.filter((p) => p.category === selectedCategory);

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F7FF] text-[#101A38]">
      <Navbar />

      {/* 1. HERO SECTION: INTRODUCES THE PLATFORM & GUIDES INTO THE CONTENT JOURNEY */}
      <section id="hero" className="relative bg-gradient-to-b from-[#020950] via-[#020950] to-[#03096D] text-white pt-16 pb-16 lg:pt-20 lg:pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Glow Lighting Accents */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[850px] h-[380px] bg-[#0000FF]/25 rounded-full blur-[140px] pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[320px] bg-[#090DC2]/20 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto relative z-10 space-y-12">
          
          {/* Main Hero Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
            
            {/* Left Column: Information Hierarchy */}
            <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
              
              {/* First — Brand introduction */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#03096D]/80 border border-[#060A8A] text-[#8FA4E8] text-[11px] font-bold tracking-wider uppercase backdrop-blur-xs">
                <span className="w-2 h-2 rounded-full bg-[#0000FF] shadow-[0_0_8px_#0000FF] animate-pulse"></span>
                <span>INSURANCE, MADE CLEARER</span>
              </div>

              {/* Second — Main headline */}
              <h1 className="text-3xl sm:text-5xl lg:text-[54px] font-extrabold tracking-tight leading-[1.12] text-white font-display">
                Protection that makes sense.{' '}
                <span className="block mt-1 text-transparent bg-clip-text bg-gradient-to-r from-[#8FA4E8] via-[#B0C2F8] to-white">
                  Support that stays with you.
                </span>
              </h1>

              {/* Third — Supporting description */}
              <p className="text-sm sm:text-base text-slate-300 max-w-xl leading-relaxed font-normal">
                Explore insurance policies, understand your coverage, and follow your claims from submission to settlement—all through one connected platform.
              </p>

              {/* Fourth — Primary actions */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
                <Link
                  to="/policies"
                  className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-[#0000FF] hover:bg-[#0000D0] text-white font-bold text-xs tracking-wide transition shadow-lg shadow-blue-700/40 glow-electric-hover flex items-center justify-center gap-2"
                >
                  <span>Explore Insurance</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  to="/customer/claims"
                  className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-[#03096D] hover:bg-[#060A8A] border border-[#060A8A] text-white font-semibold text-xs transition flex items-center justify-center gap-2"
                >
                  <Search className="w-4 h-4 text-[#8FA4E8]" />
                  <span>Track a Claim</span>
                </Link>
              </div>
            </div>

            {/* Fifth — Hero Visual: Relevant Photography & Illustrative Architecture */}
            <div className="lg:col-span-6 relative">
              <div className="relative mx-auto max-w-lg lg:max-w-none">
                
                {/* Central Showcase Panel */}
                <div className="relative rounded-3xl overflow-hidden border border-[#060A8A]/90 bg-[#020950]/90 shadow-2xl shadow-blue-950/60 p-2 sm:p-3">
                  <div className="relative h-72 sm:h-80 rounded-2xl overflow-hidden">
                    <img
                      src="/images/support.jpg"
                      alt="Dedicated Policyholder Care and Support"
                      className="w-full h-full object-cover"
                      loading="eager"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#020950] via-[#020950]/35 to-transparent"></div>
                    
                    {/* Bottom overlay badge inside main photo */}
                    <div className="absolute bottom-4 left-4 right-4 p-3.5 rounded-xl bg-[#020950]/85 backdrop-blur-md border border-[#060A8A] flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src="/images/insureflow-icon-transparent.png"
                          alt="InsureFlow Protection"
                          className="w-8 h-8 object-contain"
                        />
                        <div>
                          <div className="text-xs font-bold text-white font-heading">Connected Protection Model</div>
                          <div className="text-[10px] text-slate-300">Continuous coverage across health, vehicle, and property</div>
                        </div>
                      </div>
                      <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-[#0000FF]/20 text-[#8FA4E8] border border-[#0000FF]/40 text-[10px] font-bold">
                        Protected
                      </span>
                    </div>
                  </div>
                </div>

                {/* Floating Card 1: Health Protection (Illustrative, Top Left) */}
                <div className="absolute -top-5 -left-4 sm:-left-6 p-3 rounded-2xl bg-white/95 backdrop-blur-md border border-[#D9E1FA] shadow-xl text-[#101A38] max-w-[210px] sm:max-w-[225px] animate-float hidden sm:block">
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <img
                      src="/images/health.jpg"
                      alt="Health coverage"
                      className="w-9 h-9 rounded-xl object-cover flex-shrink-0"
                    />
                    <div>
                      <div className="text-[11px] font-bold text-[#020950] flex items-center gap-1 font-heading">
                        <HeartPulse className="w-3.5 h-3.5 text-[#0000FF]" /> Health Shield
                      </div>
                      <div className="text-[9px] text-[#64708A]">Cashless Network</div>
                    </div>
                  </div>
                  <div className="text-[10px] text-[#64708A] bg-[#F5F7FF] p-1.5 rounded-lg border border-[#E8EDFF]">
                    Inpatient & Diagnostic Care
                  </div>
                </div>

                {/* Floating Card 2: Vehicle Protection (Illustrative, Top Right) */}
                <div className="absolute -top-4 -right-3 sm:-right-5 p-3 rounded-2xl bg-[#03096D]/95 backdrop-blur-md border border-[#060A8A] shadow-xl text-white max-w-[190px] sm:max-w-[210px] animate-float-slow hidden sm:block">
                  <div className="flex items-center gap-2.5">
                    <img
                      src="/images/vehicle.jpg"
                      alt="Vehicle Protection"
                      className="w-9 h-9 rounded-xl object-cover flex-shrink-0"
                    />
                    <div>
                      <div className="text-[11px] font-bold text-white flex items-center gap-1 font-heading">
                        <Car className="w-3.5 h-3.5 text-[#8FA4E8]" /> Vehicle & Fleet
                      </div>
                      <div className="text-[9px] text-slate-300">On-Site Damage Survey</div>
                    </div>
                  </div>
                </div>

                {/* Floating Card 3: Illustrative Claim Workflow (Bottom Right) */}
                <div className="absolute -bottom-6 -right-4 sm:-right-6 p-4 rounded-2xl bg-[#020950]/95 backdrop-blur-md border border-[#0000FF]/50 shadow-2xl text-white max-w-[240px] sm:max-w-[265px] animate-float-reverse">
                  <div className="flex items-center justify-between mb-2 pb-2 border-b border-[#060A8A]">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#8FA4E8] flex items-center gap-1">
                      <Activity className="w-3 h-3 text-[#0000FF]" /> Claims Pipeline
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-bold">
                      Connected
                    </span>
                  </div>
                  <div className="space-y-1.5 text-[10px]">
                    <div className="flex items-center gap-2 text-slate-200">
                      <span className="w-4 h-4 rounded-full bg-[#0000FF] flex items-center justify-center text-[9px] font-bold">1</span>
                      <span>Document Upload & OCR</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-200">
                      <span className="w-4 h-4 rounded-full bg-[#0000FF] flex items-center justify-center text-[9px] font-bold">2</span>
                      <span>Deterministic Rule Check</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-200">
                      <span className="w-4 h-4 rounded-full bg-[#0000FF] flex items-center justify-center text-[9px] font-bold">3</span>
                      <span>Adjudication & Survey</span>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-300 font-semibold">
                      <span className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-[9px] text-[#020950] font-bold">4</span>
                      <span>Settlement Disbursement</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>

          {/* Sixth — Optional Trust Indicators (Compact row of 3 verified capabilities) */}
          <div className="pt-8 border-t border-[#060A8A]/80 grid grid-cols-1 md:grid-cols-3 gap-5 text-left">
            
            {/* Capability 1 */}
            <div className="p-4 rounded-2xl bg-[#03096D]/40 border border-[#060A8A] flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-[#0000FF] flex items-center justify-center text-white flex-shrink-0 shadow-md shadow-blue-800/40">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white font-heading">Clear claim progress</h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Transparent milestone tracking from initial document upload through authorized settlement disbursement.
                </p>
              </div>
            </div>

            {/* Capability 2 */}
            <div className="p-4 rounded-2xl bg-[#03096D]/40 border border-[#060A8A] flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-[#0000FF] flex items-center justify-center text-white flex-shrink-0 shadow-md shadow-blue-800/40">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white font-heading">Document-assisted verification</h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Intelligent OCR extraction paired with deterministic rule evaluation against active policy coverage terms.
                </p>
              </div>
            </div>

            {/* Capability 3 */}
            <div className="p-4 rounded-2xl bg-[#03096D]/40 border border-[#060A8A] flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-[#0000FF] flex items-center justify-center text-white flex-shrink-0 shadow-md shadow-blue-800/40">
                <UserCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white font-heading">Role-based claim review</h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Specialized portals for policyholders, verification officers, field surveyors, and claims managers.
                </p>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 2. ABOUT THE CONNECTED PLATFORM (NATURAL EXTENSION OF HERO INTRODUCTION) */}
      <section id="about" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-5">
            <span className="text-xs font-bold text-[#0000FF] uppercase tracking-wider block">
              Transparent Insurance Operations
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#101A38] tracking-tight font-display">
              Built for speed, accuracy, and accountability
            </h2>
            <p className="text-xs sm:text-sm text-[#64708A] leading-relaxed">
              Traditional insurance claims often disappear into opaque queues with weeks of back-and-forth communication. InsureFlow unites policyholders, verification officers, field surveyors, and claims managers inside a single auditable workflow.
            </p>
            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-[#E8EDFF] text-[#0000FF] flex items-center justify-center mt-0.5 flex-shrink-0">
                  <CheckCircle className="w-3.5 h-3.5" />
                </div>
                <div className="text-xs">
                  <strong className="text-[#020950]">Unified Policy Management:</strong> Browse published catalog plans or register verified external coverage certificates with ease.
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-[#E8EDFF] text-[#0000FF] flex items-center justify-center mt-0.5 flex-shrink-0">
                  <CheckCircle className="w-3.5 h-3.5" />
                </div>
                <div className="text-xs">
                  <strong className="text-[#020950]">Deterministic Rule Engine:</strong> Incident dates, category alignment, and coverage limits are validated in seconds.
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-[#E8EDFF] text-[#0000FF] flex items-center justify-center mt-0.5 flex-shrink-0">
                  <CheckCircle className="w-3.5 h-3.5" />
                </div>
                <div className="text-xs">
                  <strong className="text-[#020950]">Transparent Settlement Calculations:</strong> Explicit deductible deductions and lifetime utilization accounting ensure zero ambiguity.
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="rounded-3xl overflow-hidden border border-[#D9E1FA] shadow-xl bg-white p-3">
              <img
                src="/images/workflow.jpg"
                alt="Connected Insurance Claims Workflow"
                className="w-full h-80 object-cover rounded-2xl"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 3. EXPLORE INSURANCE CATALOG PREVIEW */}
      <section id="explore-insurance" className="py-20 px-4 sm:px-6 lg:px-8 bg-[#E8EDFF]/40 border-y border-[#D9E1FA]">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-[#0000FF] uppercase tracking-wider block mb-1">
                Policy Offerings
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#101A38] tracking-tight font-display">
                Published Insurance Policies
              </h2>
              <p className="text-xs sm:text-sm text-[#64708A] mt-1">
                Browse verified platform insurance plans across Health, Vehicle, and Property coverage.
              </p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setSelectedCategory('ALL')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex-shrink-0 ${
                  selectedCategory === 'ALL'
                    ? 'bg-[#0000FF] text-white shadow-md shadow-blue-600/30'
                    : 'bg-white text-[#64708A] hover:bg-slate-100 border border-[#D9E1FA]'
                }`}
              >
                All Categories
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCategory(c.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex-shrink-0 ${
                    selectedCategory === c.id
                      ? 'bg-[#0000FF] text-white shadow-md shadow-blue-600/30'
                      : 'bg-white text-[#64708A] hover:bg-slate-100 border border-[#D9E1FA]'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Policy Cards Grid */}
          {loadingProducts ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 rounded-2xl bg-white/70 animate-pulse border border-[#D9E1FA]"></div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-[#D9E1FA]">
              <Shield className="w-8 h-8 text-[#64708A] mx-auto mb-2" />
              <p className="text-sm font-semibold text-[#101A38]">No published products found in the database.</p>
              <p className="text-xs text-[#64708A] mt-1">Check back shortly or visit system administration to publish policies.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {filteredProducts.slice(0, 6).map((product) => (
                <div key={product._id} className="card-premium p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#E8EDFF] text-[#090DC2] border border-[#D9E1FA]">
                        {product.category}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {product.planCode}
                      </span>
                    </div>

                    <div className="text-xs font-bold text-[#64708A] uppercase tracking-wide mb-1">
                      {product.insurer}
                    </div>
                    <h3 className="font-bold text-[#101A38] text-base mb-2 font-heading">{product.productName}</h3>
                    <p className="text-xs text-[#64708A] leading-relaxed line-clamp-3 mb-5">
                      {product.description}
                    </p>

                    <div className="space-y-2.5 py-3.5 border-y border-[#F5F7FF] text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-[#64708A]">
                          {product.category === 'VEHICLE' ? 'Sample IDV:' : product.category === 'PROPERTY' ? 'Sample Insured Value:' : 'Sample Coverage:'}
                        </span>
                        <span className="font-extrabold text-[#101A38]">{formatINR(product.coverageLimit)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[#64708A]">Sample Deductible:</span>
                        <span className="font-semibold text-[#101A38]">{formatINR(product.deductible)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[#64708A]">Illustrative Premium:</span>
                        <span className="font-extrabold text-[#0000FF]">{formatINR(product.annualPremium)}/yr</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-2">
                    <Link
                      to={`/policies/${product._id}`}
                      className="w-full block text-center py-2.5 rounded-xl bg-[#020950] hover:bg-[#0000FF] text-white font-bold text-xs transition duration-200"
                    >
                      View Policy Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="text-center pt-4">
            <Link
              to="/policies"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white border border-[#D9E1FA] hover:border-[#0000FF] text-[#020950] font-bold text-xs transition shadow-xs"
            >
              <span>Explore All {products.length} Published Plans in Catalog</span>
              <ArrowRight className="w-4 h-4 text-[#0000FF]" />
            </Link>
          </div>
        </div>
      </section>

      {/* 4. COVERAGE CATEGORIES */}
      <section id="categories" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-bold text-[#0000FF] uppercase tracking-wider block mb-1">
            Tailored Coverage Lines
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#101A38] tracking-tight font-display">
            Protection Across What Matters Most
          </h2>
          <p className="text-xs sm:text-sm text-[#64708A] mt-2">
            Structured policies with explicit eligibility rules, clear benefit itemizations, and verified claims adjudication.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Health Category Card */}
          <div className="card-premium overflow-hidden flex flex-col justify-between group">
            <div>
              <div className="relative h-48 overflow-hidden">
                <img
                  src="/images/health.jpg"
                  alt="Healthcare Specialist Providing Medical Care"
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#020950]/80 via-transparent to-transparent"></div>
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-white/90 backdrop-blur-xs text-[#090DC2] text-[11px] font-bold flex items-center gap-1.5 shadow-sm">
                  <HeartPulse className="w-3.5 h-3.5 text-[#0000FF]" />
                  <span>Health Protection</span>
                </div>
              </div>
              <div className="p-6">
                <h3 className="font-extrabold text-[#101A38] text-base mb-2 font-heading">Medical & Hospitalization</h3>
                <p className="text-xs text-[#64708A] leading-relaxed mb-4">
                  Inpatient hospital care, diagnostic laboratory expenses, and surgical procedures with cashless settlement options.
                </p>
                <ul className="space-y-2 text-xs text-[#101A38]">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-[#0000FF] flex-shrink-0" />
                    <span>Inpatient & Daycare Hospitalization</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-[#0000FF] flex-shrink-0" />
                    <span>Itemized Hospital Bill OCR Parsing</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-[#0000FF] flex-shrink-0" />
                    <span>Prescription & Diagnostic Tests</span>
                  </li>
                </ul>
              </div>
            </div>
            <div className="p-6 pt-0">
              <Link
                to="/policies?category=HEALTH"
                className="w-full block text-center py-2.5 rounded-xl border border-[#D9E1FA] hover:bg-[#E8EDFF] text-[#0B0EA6] font-bold text-xs transition"
              >
                Explore Health Plans
              </Link>
            </div>
          </div>

          {/* Vehicle Category Card */}
          <div className="card-premium overflow-hidden flex flex-col justify-between group">
            <div>
              <div className="relative h-48 overflow-hidden">
                <img
                  src="/images/vehicle.jpg"
                  alt="Modern Vehicle Protection on Highway"
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#020950]/80 via-transparent to-transparent"></div>
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-white/90 backdrop-blur-xs text-[#090DC2] text-[11px] font-bold flex items-center gap-1.5 shadow-sm">
                  <Car className="w-3.5 h-3.5 text-[#0000FF]" />
                  <span>Vehicle & Fleet</span>
                </div>
              </div>
              <div className="p-6">
                <h3 className="font-extrabold text-[#101A38] text-base mb-2 font-heading">Automotive Indemnity</h3>
                <p className="text-xs text-[#64708A] leading-relaxed mb-4">
                  Accidental collision repairs, third-party liability, and emergency roadside assistance with surveyor verification.
                </p>
                <ul className="space-y-2 text-xs text-[#101A38]">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-[#0000FF] flex-shrink-0" />
                    <span>Bumper-to-Bumper Repair Coverage</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-[#0000FF] flex-shrink-0" />
                    <span>Workshop Repair Estimate Verification</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-[#0000FF] flex-shrink-0" />
                    <span>Roadside Towing & Recovery Riders</span>
                  </li>
                </ul>
              </div>
            </div>
            <div className="p-6 pt-0">
              <Link
                to="/policies?category=VEHICLE"
                className="w-full block text-center py-2.5 rounded-xl border border-[#D9E1FA] hover:bg-[#E8EDFF] text-[#0B0EA6] font-bold text-xs transition"
              >
                Explore Vehicle Plans
              </Link>
            </div>
          </div>

          {/* Property Category Card */}
          <div className="card-premium overflow-hidden flex flex-col justify-between group">
            <div>
              <div className="relative h-48 overflow-hidden">
                <img
                  src="/images/property.jpg"
                  alt="Secure Residential Home Property"
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#020950]/80 via-transparent to-transparent"></div>
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-white/90 backdrop-blur-xs text-[#090DC2] text-[11px] font-bold flex items-center gap-1.5 shadow-sm">
                  <HomeIcon className="w-3.5 h-3.5 text-[#0000FF]" />
                  <span>Property & Real Estate</span>
                </div>
              </div>
              <div className="p-6">
                <h3 className="font-extrabold text-[#101A38] text-base mb-2 font-heading">Residential Property Shield</h3>
                <p className="text-xs text-[#64708A] leading-relaxed mb-4">
                  Full structural indemnity, severe storm repairs, plumbing pipe bursts, and valuable home contents protection.
                </p>
                <ul className="space-y-2 text-xs text-[#101A38]">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-[#0000FF] flex-shrink-0" />
                    <span>Residential Structure & Fixtures</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-[#0000FF] flex-shrink-0" />
                    <span>Burst Pipe & Storm Damage Restorations</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-[#0000FF] flex-shrink-0" />
                    <span>Personal Contents & Burglary Indemnity</span>
                  </li>
                </ul>
              </div>
            </div>
            <div className="p-6 pt-0">
              <Link
                to="/policies?category=PROPERTY"
                className="w-full block text-center py-2.5 rounded-xl border border-[#D9E1FA] hover:bg-[#E8EDFF] text-[#0B0EA6] font-bold text-xs transition"
              >
                Explore Property Plans
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 5. HOW CLAIMS WORK: 4 STAGES */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-[#020950] text-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold text-[#8FA4E8] uppercase tracking-wider block mb-1">
              Deterministic Processing Pipeline
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight font-display">
              Four Connected Stages to Final Settlement
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-2">
              Every filed claim travels through verified document extraction, automatic rule checks, and human sign-off.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-[#03096D]/60 border border-[#060A8A] relative">
              <div className="w-10 h-10 rounded-xl bg-[#0000FF] text-white flex items-center justify-center font-black text-sm mb-4">
                1
              </div>
              <h3 className="font-bold text-sm text-white mb-2 font-heading">Incident Filing & Upload</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Policyholders select an active policy, enter claimed incident amounts, and upload invoices, police reports, or medical bills.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#03096D]/60 border border-[#060A8A] relative">
              <div className="w-10 h-10 rounded-xl bg-[#0000FF] text-white flex items-center justify-center font-black text-sm mb-4">
                2
              </div>
              <h3 className="font-bold text-sm text-white mb-2 font-heading">Automated OCR Extraction</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Tesseract OCR scans uploaded documents to parse amounts, service provider names, and dates directly into structured metadata.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#03096D]/60 border border-[#060A8A] relative">
              <div className="w-10 h-10 rounded-xl bg-[#0000FF] text-white flex items-center justify-center font-black text-sm mb-4">
                3
              </div>
              <h3 className="font-bold text-sm text-white mb-2 font-heading">Deterministic Rule Engine</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Policy dates, category coverage, and lifetime coverage limits are evaluated against system rules with instant diagnostic flags.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#03096D]/60 border border-[#060A8A] relative">
              <div className="w-10 h-10 rounded-xl bg-[#0000FF] text-white flex items-center justify-center font-black text-sm mb-4">
                4
              </div>
              <h3 className="font-bold text-sm text-white mb-2 font-heading">Manager Sign-Off & Payout</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Adjudication officers verify line items, surveyors conduct field inspections, and claims managers approve bank disbursement.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. PLATFORM CAPABILITIES */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-bold text-[#0000FF] uppercase tracking-wider block mb-1">
            Engineered Capabilities
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#101A38] tracking-tight font-display">
            Built for Verified Accuracy & Auditability
          </h2>
          <p className="text-xs sm:text-sm text-[#64708A] mt-2">
            Every feature in InsureFlow exists to remove friction and eliminate claim uncertainty.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 rounded-2xl bg-white border border-[#D9E1FA] shadow-xs space-y-3">
            <div className="w-9 h-9 rounded-xl bg-[#E8EDFF] text-[#0000FF] flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-[#020950] font-heading">Multi-Insurer Interoperability</h3>
            <p className="text-xs text-[#64708A] leading-relaxed">
              File claims seamlessly for external insurance policies purchased through other carriers with equal adjudication rigor.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-[#D9E1FA] shadow-xs space-y-3">
            <div className="w-9 h-9 rounded-xl bg-[#E8EDFF] text-[#0000FF] flex items-center justify-center font-bold">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-[#020950] font-heading">Real-Time Timeline Audit</h3>
            <p className="text-xs text-[#64708A] leading-relaxed">
              Every status modification and approval step is timestamped and recorded in an immutable audit log.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-[#D9E1FA] shadow-xs space-y-3">
            <div className="w-9 h-9 rounded-xl bg-[#E8EDFF] text-[#0000FF] flex items-center justify-center font-bold">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-[#020950] font-heading">Secure Payout Settlements</h3>
            <p className="text-xs text-[#64708A] leading-relaxed">
              Net payout amounts accurately account for deductibles and prior claims before disbursements are approved.
            </p>
          </div>
        </div>
      </section>

      {/* 7. POLICYHOLDER EXPERIENCE */}
      <section id="reviews" className="py-20 px-4 sm:px-6 lg:px-8 bg-white border-y border-[#D9E1FA]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-4 space-y-4">
              <span className="text-xs font-bold text-[#0000FF] uppercase tracking-wider block">
                Policyholder Experience
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#101A38] tracking-tight font-display">
                Designed for Clarity When You Need It Most
              </h2>
              <p className="text-xs sm:text-sm text-[#64708A] leading-relaxed">
                When an accident or medical emergency occurs, clear guidance matters. Here is how policyholders experience InsureFlow in practice.
              </p>
            </div>

            <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl bg-[#F5F7FF] border border-[#D9E1FA] space-y-3">
                <div className="flex items-center gap-1 text-amber-400">
                  <Star className="w-4 h-4 fill-amber-400" />
                  <Star className="w-4 h-4 fill-amber-400" />
                  <Star className="w-4 h-4 fill-amber-400" />
                  <Star className="w-4 h-4 fill-amber-400" />
                  <Star className="w-4 h-4 fill-amber-400" />
                </div>
                <p className="text-xs text-[#101A38] leading-relaxed italic">
                  "Being able to upload my repair bills and watch the claim move through document verification gave me total clarity during a stressful week. I always knew exactly which officer was reviewing my file."
                </p>
                <div className="pt-2 border-t border-[#D9E1FA] flex items-center justify-between text-xs">
                  <span className="font-bold text-[#020950]">Sarah Jenkins</span>
                  <span className="text-[11px] text-[#64708A]">Health & Auto Policyholder</span>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-[#F5F7FF] border border-[#D9E1FA] space-y-3">
                <div className="flex items-center gap-1 text-amber-400">
                  <Star className="w-4 h-4 fill-amber-400" />
                  <Star className="w-4 h-4 fill-amber-400" />
                  <Star className="w-4 h-4 fill-amber-400" />
                  <Star className="w-4 h-4 fill-amber-400" />
                  <Star className="w-4 h-4 fill-amber-400" />
                </div>
                <p className="text-xs text-[#101A38] leading-relaxed italic">
                  "I registered an insurance policy I purchased through an independent broker. InsureFlow accepted the document, verified the terms, and handled our water damage claim without any runaround."
                </p>
                <div className="pt-2 border-t border-[#D9E1FA] flex items-center justify-between text-xs">
                  <span className="font-bold text-[#020950]">Marcus Sterling</span>
                  <span className="text-[11px] text-[#64708A]">Property Policyholder</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. FREQUENTLY ASKED QUESTIONS */}
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
        <div className="text-center mb-12">
          <span className="text-xs font-bold text-[#0000FF] uppercase tracking-wider block mb-1">
            Got Questions?
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#101A38] tracking-tight font-display">
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm text-[#64708A] mt-2">
            Clear answers on policy coverage, document requirements, and settlement timelines.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-[#D9E1FA] bg-white overflow-hidden transition"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? -1 : idx)}
                  className="w-full text-left p-5 flex items-center justify-between gap-4 font-bold text-sm text-[#101A38] hover:text-[#0000FF] transition font-heading"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-[#64708A] transition-transform duration-200 flex-shrink-0 ${
                      isOpen ? 'rotate-180 text-[#0000FF]' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs text-[#64708A] leading-relaxed border-t border-[#F5F7FF] pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 9. FINAL CALL TO ACTION */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full mb-12">
        <div className="rounded-3xl bg-gradient-to-r from-[#020950] via-[#03096D] to-[#000080] border border-[#060A8A] text-white p-8 sm:p-14 shadow-2xl relative overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="max-w-2xl space-y-3 relative z-10">
            <span className="text-xs font-bold text-[#8FA4E8] uppercase tracking-wider block">
              Join InsureFlow
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white font-display">
              Ready for insurance that stays with you?
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Explore catalog policies tailored to your lifestyle or sign in to track claims and manage coverage in real time.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 relative z-10 flex-shrink-0">
            <Link
              to="/policies"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#0000FF] hover:bg-[#0000D0] text-white font-bold text-xs tracking-wide transition shadow-lg shadow-blue-800/40 glow-electric-hover text-center"
            >
              Explore Insurance
            </Link>
            <Link
              to="/register"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#03096D] hover:bg-[#060A8A] border border-[#060A8A] text-white font-bold text-xs transition text-center"
            >
              Create Account
            </Link>
          </div>
        </div>
      </section>

      {/* 10. PROFESSIONAL FOOTER */}
      <Footer />
    </div>
  );
};

export default Home;
