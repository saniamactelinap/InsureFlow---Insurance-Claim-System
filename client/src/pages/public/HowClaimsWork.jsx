import React from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Sparkles,
  ShieldCheck,
  UserCheck,
  IndianRupee,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { Navbar } from '../../components/common/Navbar';
import { Footer } from '../../components/common/Footer';

export const HowClaimsWork = () => {
  const steps = [
    {
      num: '01',
      title: 'Incident Occurrence & Digital Claim Submission',
      icon: FileText,
      color: 'bg-[#0000FF]',
      description:
        'When an incident occurs (medical hospitalization, vehicle collision, or property damage), the policyholder submits a claim through our guided multi-step form. Supporting invoices, receipts, and photos are uploaded securely.',
      features: [
        'Supports both InsureFlow platform policies and external third-party policies',
        'Automatic generation of unique claim tracking reference (CLM-YYYYMMDD-XXXX)',
        'Draft saving capability for incomplete applications',
      ],
    },
    {
      num: '02',
      title: 'Intelligent Document Processing (OCR)',
      icon: Sparkles,
      color: 'bg-teal-600',
      description:
        'Uploaded PDF and image documents pass into our pluggable OCR pipeline (powered by Tesseract.js). The engine extracts key structured entities—such as invoice numbers, treatment dates, repair estimates, and hospital or garage issuers.',
      features: [
        'Document categorization (Medical bills, RC book, repair invoices, accident photos)',
        'Confidence score calculation for extracted text',
        'Human-in-the-loop review workspace for field error corrections',
      ],
    },
    {
      num: '03',
      title: 'Deterministic Policy & Fraud Rules Engine',
      icon: ShieldCheck,
      color: 'bg-indigo-600',
      description:
        'The automated rules engine evaluates the claim against active policy boundaries. It validates that the incident occurred during active coverage, that the category matches, that requested amounts do not exceed policy limits, and checks for duplicate submissions.',
      features: [
        'Clear, explainable outcomes: PASS, FAIL, FLAGGED, or REQUIRES_REVIEW',
        'High-value claims (>= ₹4,00,000) automatically trigger surveyor field inspections',
        'Tamper-proof storage of rule versions, evaluation scores, and evidence',
      ],
    },
    {
      num: '04',
      title: 'Officer Verification & Surveyor Field Assessment',
      icon: UserCheck,
      color: 'bg-purple-600',
      description:
        'An authorized insurance officer reviews the complete file, compares OCR extracted values against claim inputs, requests additional documents if needed, and recommends approval. For vehicle and property claims, certified surveyors submit damage reports.',
      features: [
        'Dedicated officer workspace with document side-by-side inspection',
        'Surveyor report templates with photo evidence and repair estimates',
        'Strict role-based separation: officers cannot unilaterally disburse funds',
      ],
    },
    {
      num: '05',
      title: 'Manager Approval & Transparent Settlement Payout',
      icon: IndianRupee,
      color: 'bg-emerald-600',
      description:
        'A claims manager reviews the officer recommendations, surveyor findings, and rule compliance before authorizing the final settlement amount. A formal disbursement ledger is created, and the customer tracks payout status until completion.',
      features: [
        'Mandatory written justifications required for any claim rejection',
        'Unique settlement payout references (SET-YYYYMMDD-XXXX) with disbursement receipts',
        'Real-time customer timeline alerts and persistent notifications',
      ],
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F7FF]">
      <Navbar />

      <div className="bg-[#020950] text-white py-14 px-4 sm:px-6 lg:px-8 border-b border-[#060A8A] text-center">
        <div className="max-w-3xl mx-auto">
          <span className="text-xs font-bold text-[#8FA4E8] uppercase tracking-wider block mb-2">
            The InsureFlow Workflow
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            How Claims are Adjudicated & Settled
          </h1>
          <p className="text-sm text-slate-300 mt-3 leading-relaxed">
            A transparent walkthrough of our five-stage automated verification, intelligent document OCR, and human-authorized claim settlement lifecycle.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex-1 w-full space-y-12">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div
              key={step.num}
              className="bg-white rounded-3xl border border-[#D9E1FA] p-8 shadow-xs flex flex-col md:flex-row gap-8 items-start relative overflow-hidden"
            >
              <div className="w-14 h-14 rounded-2xl bg-[#020950] text-white flex-shrink-0 flex items-center justify-center font-black text-lg shadow-md">
                {step.num}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-6 h-6 rounded-lg ${step.color} text-white flex items-center justify-center`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <h2 className="text-lg font-bold text-[#101A38]">{step.title}</h2>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
                  {step.description}
                </p>

                <div className="space-y-2.5 pt-4 border-t border-slate-100">
                  {step.features.map((feat, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}

        {/* CTA */}
        <div className="bg-[#020950] text-white rounded-3xl p-8 sm:p-10 text-center shadow-xl">
          <h3 className="text-xl sm:text-2xl font-bold mb-3">Ready to file or review an insurance claim?</h3>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto mb-6">
            Log in to your authorized account or register as a customer to browse policies and track submissions.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Link
              to="/register"
              className="px-6 py-3 rounded-xl bg-[#0000FF] hover:bg-teal-300 text-slate-950 font-bold text-xs tracking-wide transition"
            >
              Register Customer Account
            </Link>
            <Link
              to="/login"
              className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition border border-slate-700"
            >
              Sign In to Portal
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default HowClaimsWork;
