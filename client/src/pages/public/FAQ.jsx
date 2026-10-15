import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { Navbar } from '../../components/common/Navbar';
import { Footer } from '../../components/common/Footer';

export const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(0);

  const faqs = [
    {
      q: 'Can I submit claims for policies purchased from other insurance companies?',
      a: 'Yes, absolutely. InsureFlow provides dedicated support for external policies. You can register an external policy by providing the insurer name, policy number, coverage amount, and uploading the policy document. Our OCR engine and insurance officers will authenticate the policy and process your claim.',
    },
    {
      q: 'What happens if the OCR scanner misreads my bill or hospital receipt?',
      a: 'Our system guarantees zero blind rejections. When an OCR engine reads a document with low confidence or incomplete data, the system flags the extraction for officer review. The officer uses a side-by-side inspection workspace to correct values with an audited correction note before proceeding.',
    },
    {
      q: 'How long does claim processing and settlement take?',
      a: 'Initial automated document processing and rule validation takes less than 5 seconds. Standard claims without missing documents are typically reviewed by an insurance officer within 24 to 48 hours. Once approved by the claims manager, settlement disbursement is queued immediately.',
    },
    {
      q: 'When is a physical or technical surveyor required?',
      a: 'Automated rules trigger surveyor assessment when a claim involves vehicle damage, property damage, or exceeds the high-value claim threshold (₹4,00,000). A certified surveyor is assigned to schedule an inspection and submit a structured repair report.',
    },
    {
      q: 'Can an officer approve payouts on their own without a manager?',
      a: 'No. InsureFlow enforces strict separation of authority. Insurance officers verify documents and recommend outcomes, but only authenticated managers can authorize final settlement amounts and disburse funds.',
    },
    {
      q: 'What file types can I upload for claim verification?',
      a: 'The system accepts PDF, JPG, JPEG, and PNG files up to 10MB per document. You can upload multiple supporting documents simultaneously during claim submission.',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F7FF]">
      <Navbar />

      <div className="bg-[#020950] text-white py-14 px-4 sm:px-6 lg:px-8 border-b border-[#060A8A] text-center">
        <div className="max-w-3xl mx-auto">
          <span className="text-xs font-bold text-[#8FA4E8] uppercase tracking-wider block mb-2">
            Knowledge Base
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Frequently Asked Questions
          </h1>
          <p className="text-sm text-slate-300 mt-3 leading-relaxed">
            Find answers to common questions about claim filing, document scanning, external policies, and settlement timelines.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex-1 w-full">
        <div className="space-y-4">
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={i}
                className="bg-white rounded-2xl border border-[#D9E1FA] shadow-xs overflow-hidden transition"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? -1 : i)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-[#101A38] text-sm hover:text-[#0000FF] transition"
                >
                  <span className="flex items-center gap-2.5">
                    <HelpCircle className="w-4 h-4 text-teal-500 flex-shrink-0" />
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${
                      isOpen ? 'rotate-180 text-[#0000FF]' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default FAQ;
