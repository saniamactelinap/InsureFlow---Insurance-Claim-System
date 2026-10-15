import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Check, XCircle, Scale, Shield, ExternalLink, 
  AlertCircle, Info, HeartPulse, Car, Home as HomeIcon, Plus,
  FileText, CheckCircle2, Trash2, RefreshCw
} from 'lucide-react';
import { Navbar } from '../../components/common/Navbar';
import { Footer } from '../../components/common/Footer';
import api from '../../services/api';
import { formatINR } from '../../utils/currency';

export function ComparePolicies() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [missingNotice, setMissingNotice] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const idsParam = searchParams.get('ids');

  useEffect(() => {
    fetchComparisonData();
  }, [idsParam]);

  const fetchComparisonData = async () => {
    try {
      setLoading(true);
      setError(null);
      setMissingNotice(null);

      // Fetch all published products to allow picking replacement or additional ones
      const allRes = await api.get('/policy-products');
      const all = allRes.data?.data || [];
      setAllProducts(all);

      let targetIds = idsParam;

      // If no URL parameter, check persistent localStorage
      if (!targetIds) {
        try {
          const stored = localStorage.getItem('insureflow_compare_ids');
          if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) {
              targetIds = parsed.join(',');
              setSearchParams({ ids: targetIds }, { replace: true });
            }
          }
        } catch (e) {
          console.warn('Failed to parse stored compare IDs', e);
        }
      }

      if (targetIds) {
        const requestedTokens = targetIds.split(',').map((t) => t.trim()).filter(Boolean);
        const res = await api.get('/policy-products/compare', { params: { ids: targetIds } });

        if (res.data?.success && Array.isArray(res.data.data)) {
          const loaded = res.data.data;
          setProducts(loaded);

          // Synchronize localStorage with confirmed products
          const loadedIds = loaded.map((p) => p._id);
          localStorage.setItem('insureflow_compare_ids', JSON.stringify(loadedIds));

          // Check if some requested products were missing or unpublished
          if (loaded.length < requestedTokens.length) {
            const diff = requestedTokens.length - loaded.length;
            setMissingNotice(
              `${diff} of ${requestedTokens.length} requested policies could not be found or have been unpublished from the catalog.`
            );
          }
        } else {
          setProducts([]);
        }
      } else {
        // Default to first 2 health plans if catalog has them
        const defaultPlans = all.filter((p) => p.category === 'HEALTH');
        if (defaultPlans.length >= 2) {
          const initial = defaultPlans.slice(0, 2);
          setProducts(initial);
          const initialIds = initial.map((p) => p._id);
          localStorage.setItem('insureflow_compare_ids', JSON.stringify(initialIds));
          setSearchParams({ ids: initialIds.join(',') }, { replace: true });
        } else if (all.length >= 2) {
          const initial = all.slice(0, 2);
          setProducts(initial);
          const initialIds = initial.map((p) => p._id);
          localStorage.setItem('insureflow_compare_ids', JSON.stringify(initialIds));
          setSearchParams({ ids: initialIds.join(',') }, { replace: true });
        } else {
          setProducts([]);
        }
      }
    } catch (err) {
      console.error('Failed to load comparison data', err);
      setError('Unable to load comparison records from the database. Please check connectivity or try again.');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = (id) => {
    if (!id || products.some((p) => p._id === id || p.planCode === id)) return;
    const item = allProducts.find((p) => p._id === id || p.planCode === id);
    if (item && products.length < 4) {
      const updated = [...products, item];
      setProducts(updated);
      const newIds = updated.map((p) => p._id);
      localStorage.setItem('insureflow_compare_ids', JSON.stringify(newIds));
      setSearchParams({ ids: newIds.join(',') });
    }
  };

  const handleRemoveProduct = (id) => {
    const updated = products.filter((p) => p._id !== id && p.planCode !== id);
    setProducts(updated);
    const newIds = updated.map((p) => p._id);
    localStorage.setItem('insureflow_compare_ids', JSON.stringify(newIds));
    if (newIds.length > 0) {
      setSearchParams({ ids: newIds.join(',') });
    } else {
      setSearchParams({});
    }
  };

  const handleClearAll = () => {
    setProducts([]);
    localStorage.removeItem('insureflow_compare_ids');
    setSearchParams({});
  };

  // Categories present in currently loaded comparison
  const categoriesPresent = Array.from(new Set(products.map((p) => p.category)));
  const isCrossCategory = categoriesPresent.length > 1;

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

  const getCategoryIcon = (cat) => {
    switch (cat) {
      case 'HEALTH':
        return <HeartPulse className="w-3.5 h-3.5 text-blue-500" />;
      case 'VEHICLE':
        return <Car className="w-3.5 h-3.5 text-indigo-500" />;
      case 'PROPERTY':
        return <HomeIcon className="w-3.5 h-3.5 text-sky-500" />;
      default:
        return <Shield className="w-3.5 h-3.5 text-blue-500" />;
    }
  };

  const availableToAdd = allProducts.filter(
    (p) => !products.some((curr) => curr._id === p._id) && (categoryFilter === 'ALL' || p.category === categoryFilter)
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F7FF]">
      <Navbar />

      {/* Header Banner */}
      <section className="bg-gradient-to-b from-[#020950] via-[#020950] to-[#03096D] text-white py-10 px-4 sm:px-6 lg:px-8 border-b border-[#060A8A] relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <Link
            to="/policies"
            className="inline-flex items-center gap-1.5 text-xs text-[#8FA4E8] hover:text-white mb-3 transition font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Policy Catalog
          </Link>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#03096D]/80 border border-[#060A8A] text-[#8FA4E8] text-[11px] font-bold tracking-wider uppercase mb-2">
                <Scale className="w-3.5 h-3.5 text-[#0000FF]" />
                <span>POLICY COMPARISON MATRIX</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-display">
                Compare Insurance Policies
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
                Evaluate plan structures, illustrative premiums, coverage limits, and claim prerequisites side-by-side.
              </p>
            </div>

            {/* Quick Actions & Add Dropdown */}
            <div className="flex flex-wrap items-center gap-2">
              {products.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="px-3 py-2 rounded-xl bg-white/10 hover:bg-rose-600/80 text-white text-xs font-semibold border border-white/20 transition flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Clear All
                </button>
              )}

              {products.length < 4 && (
                <div className="flex items-center gap-2">
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-[#03096D] border border-[#060A8A] text-xs text-white focus:outline-hidden"
                  >
                    <option value="ALL">All Categories</option>
                    <option value="HEALTH">Health Only</option>
                    <option value="VEHICLE">Vehicle Only</option>
                    <option value="PROPERTY">Property Only</option>
                  </select>

                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAddProduct(e.target.value);
                        e.target.value = '';
                      }
                    }}
                    defaultValue=""
                    className="px-3 py-2 rounded-xl bg-[#03096D] border border-[#060A8A] text-xs text-white focus:outline-hidden max-w-[260px]"
                  >
                    <option value="" disabled>
                      + Add Plan ({availableToAdd.length} available)
                    </option>
                    {availableToAdd.map((p) => (
                      <option key={p._id} value={p._id}>
                        [{p.category}] {p.insurer} - {p.productName}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Matrix Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-6">

        {/* Missing / Unpublished Alert */}
        {missingNotice && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3 shadow-xs">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <strong>Catalog Availability Notice:</strong> {missingNotice}
            </div>
          </div>
        )}

        {/* Cross-Category Comparison Advisory */}
        {isCrossCategory && (
          <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-start gap-3 shadow-xs">
            <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>Cross-Category Notice:</strong> You are currently comparing policies across multiple insurance categories ({categoriesPresent.join(', ')}). Health sum insured, vehicle IDV, and property coverage serve distinct perils and cannot be directly equated as identical financial terms.
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-20 text-slate-500 text-sm">
            <div className="w-8 h-8 border-3 border-[#0000FF] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            Loading side-by-side policy comparison...
          </div>
        ) : error ? (
          /* Network / Server Error State */
          <div className="bg-white rounded-2xl border border-rose-200 p-8 text-center max-w-md mx-auto shadow-xs space-y-3">
            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
            <h3 className="font-bold text-[#101A38] text-base">Comparison Data Unavailable</h3>
            <p className="text-xs text-slate-500">{error}</p>
            <div className="pt-2 flex justify-center gap-3">
              <button
                onClick={fetchComparisonData}
                className="px-4 py-2 bg-[#020950] hover:bg-[#0000FF] text-white text-xs font-semibold rounded-xl transition flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Retry Comparison
              </button>
              <Link
                to="/policies"
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
              >
                Return to Catalog
              </Link>
            </div>
          </div>
        ) : products.length < 2 ? (
          /* Incomplete Selection State (0 or 1 product) */
          <div className="bg-white rounded-2xl border border-[#D9E1FA] p-8 sm:p-10 text-center max-w-lg mx-auto shadow-xs space-y-4">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-[#101A38] text-base">
                {products.length === 1 ? '1 Policy Selected for Comparison' : 'Select at least 2 policies'}
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {products.length === 1
                  ? 'Add a second policy from the selector above or browse the catalog to compare terms side-by-side.'
                  : 'Select two to four insurance policies from the catalog to compare coverage limits, deductibles, and benefits.'}
              </p>
            </div>

            {/* Display the single selected product if 1 is present */}
            {products.length === 1 && (
              <div className="p-3 rounded-xl bg-[#F5F7FF] border border-[#D9E1FA] text-left text-xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500">{products[0].insurer}</span>
                  <p className="font-bold text-[#101A38] text-sm">{products[0].productName}</p>
                  <span className="text-[10px] font-mono text-slate-500">{products[0].planCode}</span>
                </div>
                <button
                  onClick={() => handleRemoveProduct(products[0]._id)}
                  className="text-xs text-rose-600 hover:text-rose-800 font-semibold p-1"
                >
                  Remove
                </button>
              </div>
            )}

            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Link
                to="/policies"
                className="px-5 py-2.5 rounded-xl bg-[#020950] hover:bg-[#0000FF] text-white text-xs font-bold transition inline-flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Browse Policy Catalog</span>
              </Link>
            </div>
          </div>
        ) : (
          /* Side-by-Side Comparison Matrix */
          <div className="overflow-x-auto bg-white border border-[#D9E1FA] rounded-2xl shadow-xs">
            <table className="w-full text-xs text-left divide-y divide-slate-100 min-w-[700px]">
              
              {/* Table Head: Plan Names & Badges */}
              <thead>
                <tr className="bg-[#F5F7FF] border-b border-[#D9E1FA]">
                  <th className="p-4 font-bold text-slate-500 uppercase tracking-wider w-44">
                    Comparison Field
                  </th>
                  {products.map((p) => (
                    <th key={p._id} className="p-4 min-w-[260px] align-top">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                            {p.insurer}
                          </span>
                          <h3 className="font-extrabold text-[#101A38] text-sm mt-0.5 font-heading">
                            {p.productName}
                          </h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveProduct(p._id)}
                          className="text-slate-400 hover:text-rose-600 text-sm font-bold p-1 rounded-md hover:bg-rose-50 transition"
                          title="Remove from comparison"
                        >
                          &times;
                        </button>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                          {getCategoryIcon(p.category)}
                          <span>{p.category}</span>
                        </span>
                        <span className="text-[9px] font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {p.planCode}
                        </span>
                        <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          {p.isPublished ? 'Published' : 'Draft'}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="divide-y divide-slate-100">
                
                {/* Coverage / Insured Value */}
                <tr>
                  <td className="p-4 font-bold text-slate-600 bg-[#F5F7FF]/50">
                    Coverage / Insured Value
                  </td>
                  {products.map((p) => (
                    <td key={p._id} className="p-4 font-black text-[#101A38] text-sm">
                      <div>{formatINR(p.coverageLimit)}</div>
                      <span className="text-[10px] text-slate-400 font-normal">
                        ({getCoverageLabel(p.category)})
                      </span>
                    </td>
                  ))}
                </tr>

                {/* Annual Premium */}
                <tr>
                  <td className="p-4 font-bold text-slate-600 bg-[#F5F7FF]/50">
                    Illustrative Annual Premium
                  </td>
                  {products.map((p) => (
                    <td key={p._id} className="p-4 font-extrabold text-[#0000FF] text-sm">
                      {formatINR(p.annualPremium)}/yr
                      <span className="block text-[10px] text-slate-400 font-normal">Illustrative demo quote</span>
                    </td>
                  ))}
                </tr>

                {/* Deductible */}
                <tr>
                  <td className="p-4 font-bold text-slate-600 bg-[#F5F7FF]/50">
                    Sample Deductible
                  </td>
                  {products.map((p) => (
                    <td key={p._id} className="p-4 font-semibold text-slate-800">
                      {formatINR(p.deductible)}
                    </td>
                  ))}
                </tr>

                {/* Duration */}
                <tr>
                  <td className="p-4 font-bold text-slate-600 bg-[#F5F7FF]/50">
                    Policy Term
                  </td>
                  {products.map((p) => (
                    <td key={p._id} className="p-4 text-slate-700 font-medium">
                      {p.durationMonths || 12} Months
                    </td>
                  ))}
                </tr>

                {/* Key Benefits */}
                <tr>
                  <td className="p-4 font-bold text-slate-600 bg-[#F5F7FF]/50 align-top">
                    Coverage Highlights & Key Benefits
                  </td>
                  {products.map((p) => (
                    <td key={p._id} className="p-4 align-top space-y-2">
                      {Array.isArray(p.keyBenefits) && p.keyBenefits.length > 0 ? (
                        p.keyBenefits.map((b, i) => (
                          <div key={i} className="flex items-start gap-1.5 text-slate-700">
                            <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                            <span className="leading-tight">{b}</span>
                          </div>
                        ))
                      ) : (
                        <span className="text-slate-400">Standard policy benefits apply</span>
                      )}
                    </td>
                  ))}
                </tr>

                {/* Eligibility Criteria */}
                <tr>
                  <td className="p-4 font-bold text-slate-600 bg-[#F5F7FF]/50 align-top">
                    Eligibility & Underwriting Criteria
                  </td>
                  {products.map((p) => (
                    <td key={p._id} className="p-4 align-top space-y-2">
                      {Array.isArray(p.eligibilityCriteria) && p.eligibilityCriteria.length > 0 ? (
                        p.eligibilityCriteria.map((c, i) => (
                          <div key={i} className="flex items-start gap-1.5 text-slate-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0"></span>
                            <span className="leading-tight">{c}</span>
                          </div>
                        ))
                      ) : (
                        <span className="text-slate-400">Standard underwriter eligibility</span>
                      )}
                    </td>
                  ))}
                </tr>

                {/* Limitations & Exclusions */}
                <tr>
                  <td className="p-4 font-bold text-slate-600 bg-[#F5F7FF]/50 align-top">
                    Important Limitations & Exclusions
                  </td>
                  {products.map((p) => (
                    <td key={p._id} className="p-4 align-top space-y-2">
                      {Array.isArray(p.exclusions) && p.exclusions.length > 0 ? (
                        p.exclusions.map((e, i) => (
                          <div key={i} className="flex items-start gap-1.5 text-slate-600">
                            <XCircle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0 mt-0.5" />
                            <span className="leading-tight">{e}</span>
                          </div>
                        ))
                      ) : (
                        <span className="text-slate-400">Standard policy exclusions apply</span>
                      )}
                    </td>
                  ))}
                </tr>

                {/* Required Claim Documents */}
                <tr>
                  <td className="p-4 font-bold text-slate-600 bg-[#F5F7FF]/50 align-top">
                    Required Claim Documents
                  </td>
                  {products.map((p) => (
                    <td key={p._id} className="p-4 align-top space-y-1.5">
                      {Array.isArray(p.requiredDocuments) && p.requiredDocuments.length > 0 ? (
                        p.requiredDocuments.map((doc, i) => (
                          <div key={i} className="flex items-center gap-1.5 text-slate-700">
                            <FileText className="w-3 h-3 text-blue-500 flex-shrink-0" />
                            <span className="font-mono text-[11px]">{doc}</span>
                          </div>
                        ))
                      ) : (
                        <span className="text-slate-400">Bills, invoices & identity proof</span>
                      )}
                    </td>
                  ))}
                </tr>

                {/* Official Website */}
                <tr>
                  <td className="p-4 font-bold text-slate-600 bg-[#F5F7FF]/50">
                    Official Insurer Portal
                  </td>
                  {products.map((p) => (
                    <td key={p._id} className="p-4">
                      {p.officialUrl ? (
                        <a
                          href={p.officialUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold"
                        >
                          <span>Visit Website</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-slate-400">Not provided</span>
                      )}
                    </td>
                  ))}
                </tr>

                {/* Actions */}
                <tr>
                  <td className="p-4 font-bold text-slate-600 bg-[#F5F7FF]/50">
                    Actions
                  </td>
                  {products.map((p) => (
                    <td key={p._id} className="p-4">
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <Link
                          to={`/policies/${p._id}`}
                          className="px-3.5 py-2 rounded-xl bg-[#020950] hover:bg-[#0000FF] text-white font-bold text-xs transition text-center shadow-xs"
                        >
                          View Full Terms & Apply
                        </Link>
                      </div>
                    </td>
                  ))}
                </tr>

              </tbody>
            </table>
          </div>
        )}

        {/* Comparison Disclaimer */}
        <div className="p-4 rounded-2xl bg-white border border-[#D9E1FA] text-xs text-slate-500 space-y-1">
          <p>
            <strong>Note on Comparative Analysis:</strong> Values shown are illustrative demonstration estimates. No product is designated as "best" or universally superior. Choice of insurance depends on individual risk profile, declared assets, healthcare requirements, and underwriter terms.
          </p>
        </div>

      </main>

      <Footer />
    </div>
  );
}

export default ComparePolicies;
