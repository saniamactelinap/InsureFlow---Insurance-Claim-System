import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, Check, XCircle, Scale, Shield, ExternalLink, 
  AlertCircle, Info, HeartPulse, Car, Home as HomeIcon, Plus
} from 'lucide-react';
import { Navbar } from '../../components/common/Navbar';
import { Footer } from '../../components/common/Footer';
import api from '../../services/api';
import { formatINR } from '../../utils/currency';

export function ComparePolicies() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const idsParam = searchParams.get('ids');

  useEffect(() => {
    fetchComparisonData();
  }, [idsParam]);

  const fetchComparisonData = async () => {
    try {
      setLoading(true);

      // Fetch all published products to allow picking additional ones
      const allRes = await api.get('/policy-products');
      const all = allRes.data?.data || [];
      setAllProducts(all);

      if (idsParam) {
        const res = await api.get('/policy-products/compare', { params: { ids: idsParam } });
        if (res.data?.success) {
          setProducts(res.data.data);
        } else {
          setProducts([]);
        }
      } else {
        // Default to first 2 products of the same category if no IDs provided
        const healths = all.filter((p) => p.category === 'HEALTH');
        if (healths.length >= 2) {
          setProducts(healths.slice(0, 2));
          setSearchParams({ ids: `${healths[0]._id},${healths[1]._id}` });
        } else {
          setProducts([]);
        }
      }
    } catch (err) {
      console.error('Failed to load comparison data', err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = (id) => {
    if (!id || products.some((p) => p._id === id)) return;
    const item = allProducts.find((p) => p._id === id);
    if (item && products.length < 4) {
      const updated = [...products, item];
      setProducts(updated);
      setSearchParams({ ids: updated.map((p) => p._id).join(',') });
    }
  };

  const handleRemoveProduct = (id) => {
    const updated = products.filter((p) => p._id !== id);
    setProducts(updated);
    if (updated.length > 0) {
      setSearchParams({ ids: updated.map((p) => p._id).join(',') });
    } else {
      setSearchParams({});
    }
  };

  // Check if compared products span multiple categories
  const categoriesPresent = Array.from(new Set(products.map((p) => p.category)));
  const isCrossCategory = categoriesPresent.length > 1;

  const getCoverageLabel = (category) => {
    switch (category) {
      case 'VEHICLE':
        return 'Sample IDV';
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
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Catalog
          </Link>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#03096D]/80 border border-[#060A8A] text-[#8FA4E8] text-[11px] font-bold tracking-wider uppercase mb-2">
                <Scale className="w-3.5 h-3.5 text-[#0000FF]" />
                <span>POLICY COMPARISON MATRIX</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-display">
                Compare Insurance Policies
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                Evaluate plan structures, illustrative premiums, and key benefits side-by-side.
              </p>
            </div>

            {/* Quick Add Dropdown */}
            {products.length < 4 && (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
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
                    handleAddProduct(e.target.value);
                    e.target.value = '';
                  }}
                  defaultValue=""
                  className="px-3 py-2 rounded-xl bg-[#03096D] border border-[#060A8A] text-xs text-white focus:outline-hidden max-w-[260px]"
                >
                  <option value="" disabled>+ Add policy to compare ({availableToAdd.length})</option>
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
      </section>

      {/* Main Matrix Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-6">
        
        {/* Cross-Category Comparison Advisory */}
        {isCrossCategory && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3 shadow-xs">
            <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong>Cross-Category Notice:</strong> You are currently comparing policies across multiple insurance categories ({categoriesPresent.join(', ')}). Health sum insured, vehicle IDV, and property coverage serve distinct perils and cannot be directly equated as equivalent financial terms.
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-20 text-slate-500 text-sm">
            <div className="w-8 h-8 border-3 border-[#0000FF] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            Building comparison matrix...
          </div>
        ) : products.length < 2 ? (
          <div className="bg-white rounded-2xl border border-[#D9E1FA] p-10 text-center max-w-md mx-auto shadow-xs">
            <Scale className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <h3 className="font-bold text-[#101A38] text-base">Select at least 2 policies</h3>
            <p className="text-xs text-slate-500 mt-1 mb-5 leading-relaxed">
              Use the selector above or browse the catalog to add policies into the comparison matrix.
            </p>
            <Link
              to="/policies"
              className="px-5 py-2.5 rounded-xl bg-[#020950] hover:bg-[#0000FF] text-white text-xs font-bold transition inline-block"
            >
              Browse Catalog
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto bg-white border border-[#D9E1FA] rounded-2xl shadow-xs">
            <table className="w-full text-xs text-left divide-y divide-slate-100 min-w-[700px]">
              
              {/* Table Head */}
              <thead>
                <tr className="bg-[#F5F7FF] border-b border-[#D9E1FA]">
                  <th className="p-4 font-bold text-slate-500 uppercase tracking-wider w-44">
                    Comparison Field
                  </th>
                  {products.map((p) => (
                    <th key={p._id} className="p-4 min-w-[240px] align-top">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                            {p.insurer}
                          </span>
                          <h3 className="font-extrabold text-[#101A38] text-sm mt-0.5 font-heading">
                            {p.productName}
                          </h3>
                        </div>
                        {products.length > 2 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveProduct(p._id)}
                            className="text-slate-400 hover:text-rose-600 text-sm font-bold p-1 rounded-md hover:bg-rose-50"
                            title="Remove from comparison"
                          >
                            &times;
                          </button>
                        )}
                      </div>
                      <div className="mt-2 flex items-center gap-1.5">
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                          {getCategoryIcon(p.category)}
                          <span>{p.category}</span>
                        </span>
                        <span className="text-[9px] font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {p.planCode}
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
                    Duration
                  </td>
                  {products.map((p) => (
                    <td key={p._id} className="p-4 text-slate-700">
                      {p.durationMonths || 12} Months
                    </td>
                  ))}
                </tr>

                {/* Key Benefits */}
                <tr>
                  <td className="p-4 font-bold text-slate-600 bg-[#F5F7FF]/50 align-top">
                    Key Benefits
                  </td>
                  {products.map((p) => (
                    <td key={p._id} className="p-4 align-top space-y-2">
                      {p.keyBenefits?.map((b, i) => (
                        <div key={i} className="flex items-start gap-1.5 text-slate-700">
                          <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                          <span className="leading-tight">{b}</span>
                        </div>
                      ))}
                    </td>
                  ))}
                </tr>

                {/* Limitations & Exclusions */}
                <tr>
                  <td className="p-4 font-bold text-slate-600 bg-[#F5F7FF]/50 align-top">
                    Important Limitations
                  </td>
                  {products.map((p) => (
                    <td key={p._id} className="p-4 align-top space-y-2">
                      {p.exclusions?.map((e, i) => (
                        <div key={i} className="flex items-start gap-1.5 text-slate-600">
                          <XCircle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0 mt-0.5" />
                          <span className="leading-tight">{e}</span>
                        </div>
                      ))}
                    </td>
                  ))}
                </tr>

                {/* Official Link */}
                <tr>
                  <td className="p-4 font-bold text-slate-600 bg-[#F5F7FF]/50">
                    Official Insurer Website
                  </td>
                  {products.map((p) => (
                    <td key={p._id} className="p-4">
                      {p.officialUrl ? (
                        <a
                          href={p.officialUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-semibold"
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

                {/* Action */}
                <tr>
                  <td className="p-4 font-bold text-slate-600 bg-[#F5F7FF]/50">
                    Action
                  </td>
                  {products.map((p) => (
                    <td key={p._id} className="p-4">
                      <Link
                        to={`/policies/${p._id}`}
                        className="inline-block px-4 py-2 rounded-xl bg-[#020950] hover:bg-[#0000FF] text-white font-bold text-xs transition shadow-xs"
                      >
                        View Full Terms & Apply
                      </Link>
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
            <strong>Note on Comparative Analysis:</strong> No product is designated as "best" or universally superior. Choice of insurance depends on individual risk profile, declared assets, healthcare requirements, and current underwriter terms.
          </p>
        </div>

      </main>

      <Footer />
    </div>
  );
}

export default ComparePolicies;
