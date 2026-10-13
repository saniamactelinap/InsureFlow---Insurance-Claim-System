import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Shield, Search, Filter, Scale, Check, ArrowRight, ExternalLink, 
  Info, AlertCircle, HeartPulse, Car, Home as HomeIcon, CheckCircle2,
  HelpCircle, RefreshCw
} from 'lucide-react';
import { Navbar } from '../../components/common/Navbar';
import { Footer } from '../../components/common/Footer';
import api from '../../services/api';
import { formatINR } from '../../utils/currency';

export function PoliciesCatalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const initialCat = searchParams.get('category')?.toUpperCase() || 'ALL';
  const [selectedCategory, setSelectedCategory] = useState(initialCat);
  const [searchQuery, setSearchQuery] = useState('');
  const [maxPremium, setMaxPremium] = useState(25000);
  const [compareIds, setCompareIds] = useState([]);

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (selectedCategory !== 'ALL') {
        params.category = selectedCategory;
      }
      const res = await api.get('/policy-products', { params });
      if (res.data?.success) {
        setProducts(res.data.data || []);
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.error('Failed to load policies', err);
      setError('Unable to load policy catalog from the database. Please try again.');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (cat) => {
    setSelectedCategory(cat);
    if (cat === 'ALL') {
      setSearchParams({});
    } else {
      setSearchParams({ category: cat });
    }
  };

  const toggleCompare = (id) => {
    if (compareIds.includes(id)) {
      setCompareIds(compareIds.filter((item) => item !== id));
    } else {
      if (compareIds.length >= 4) {
        alert('You can compare up to 4 policies simultaneously.');
        return;
      }
      setCompareIds([...compareIds, id]);
    }
  };

  const handleGoCompare = () => {
    if (compareIds.length >= 2) {
      navigate(`/policies/compare?ids=${compareIds.join(',')}`);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.insurer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.planCode && p.planCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesPremium = p.annualPremium <= maxPremium;
    return matchesSearch && matchesPremium;
  });

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

  const getCoverageSubtext = (category) => {
    switch (category) {
      case 'VEHICLE':
        return 'Includes own-damage & third-party cover';
      case 'PROPERTY':
        return 'Building structure & contents indemnity';
      default:
        return 'Eligible inpatient & medical expenses';
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F7FF]">
      <Navbar />

      {/* Catalog Header Hero */}
      <section className="bg-gradient-to-b from-[#020950] via-[#020950] to-[#03096D] text-white py-12 lg:py-16 px-4 sm:px-6 lg:px-8 border-b border-[#060A8A] relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-[#0000FF]/20 rounded-full blur-[140px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#03096D]/80 border border-[#060A8A] text-[#8FA4E8] text-[11px] font-bold tracking-wider uppercase mb-3 backdrop-blur-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0000FF] shadow-[0_0_8px_#0000FF]"></span>
              <span>DEMONSTRATION POLICY CATALOG</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white font-display">
              Explore Insurance Policies
            </h1>
            
            <p className="text-sm sm:text-base text-slate-300 mt-3 leading-relaxed">
              Browse 15 curated demonstration policies across health, vehicle, and residential property coverage. 
              Review plan specifications, compare coverage structures, and test application workflows.
            </p>

            {/* Illustrative Notice Pill */}
            <div className="mt-4 inline-flex items-start gap-2.5 p-3 rounded-xl bg-[#03096D]/60 border border-[#060A8A] text-slate-300 text-xs">
              <Info className="w-4 h-4 text-[#8FA4E8] flex-shrink-0 mt-0.5" />
              <span>
                <strong>Demonstration catalog:</strong> Displayed premiums, coverage values, and deductibles are illustrative estimates for platform demonstration. Confirm official terms directly with insurers.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Catalog Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        
        {/* Filter and Search Bar */}
        <div className="bg-white rounded-2xl border border-[#D9E1FA] p-4 mb-8 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            {[
              { id: 'ALL', label: 'All Products (15)' },
              { id: 'HEALTH', label: 'Health (5)' },
              { id: 'VEHICLE', label: 'Vehicle (5)' },
              { id: 'PROPERTY', label: 'Property (5)' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategoryChange(cat.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex-shrink-0 flex items-center gap-1.5 ${
                  selectedCategory === cat.id
                    ? 'bg-[#0000FF] text-white shadow-md shadow-blue-700/30'
                    : 'bg-[#F5F7FF] text-[#101A38] hover:bg-[#E8EDFF] border border-[#D9E1FA]'
                }`}
              >
                {cat.id !== 'ALL' && getCategoryIcon(cat.id)}
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Search & Range Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            
            {/* Search Input */}
            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search plan, insurer, or plan code..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#D9E1FA] text-xs text-[#101A38] bg-white focus:outline-hidden focus:border-[#0000FF]"
              />
            </div>

            {/* Premium Filter Slider */}
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[#F5F7FF] border border-[#D9E1FA] text-xs text-slate-700">
              <span className="text-[11px] font-semibold text-slate-500">Max Prem:</span>
              <input
                type="range"
                min="2000"
                max="25000"
                step="500"
                value={maxPremium}
                onChange={(e) => setMaxPremium(Number(e.target.value))}
                className="w-24 accent-[#0000FF] cursor-pointer"
              />
              <span className="font-bold text-[#101A38] min-w-[65px]">{formatINR(maxPremium)}</span>
            </div>

            {(searchQuery || maxPremium < 25000) && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setMaxPremium(25000);
                }}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold px-2 py-1"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Floating Compare Action Bar */}
        {compareIds.length > 0 && (
          <div className="sticky top-20 z-30 mb-8 p-4 rounded-2xl bg-[#020950] text-white shadow-xl flex items-center justify-between border border-[#060A8A] animate-in fade-in">
            <div className="flex items-center gap-3 text-xs">
              <Scale className="w-4 h-4 text-[#8FA4E8]" />
              <span>
                <strong>{compareIds.length}</strong> policies selected for comparison
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCompareIds([])}
                className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white text-xs font-semibold"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={handleGoCompare}
                disabled={compareIds.length < 2}
                className="px-4 py-2 rounded-xl bg-[#0000FF] hover:bg-[#0000D0] text-white font-bold text-xs disabled:opacity-40 transition shadow-md shadow-blue-700/40"
              >
                Compare Selected ({compareIds.length})
              </button>
            </div>
          </div>
        )}

        {/* Product Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-80 rounded-2xl bg-white border border-[#D9E1FA] animate-pulse p-6"></div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-rose-200 p-8 max-w-lg mx-auto">
            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
            <h3 className="font-bold text-[#101A38] text-base">{error}</h3>
            <button
              onClick={fetchProducts}
              className="mt-4 px-4 py-2 rounded-xl bg-[#0000FF] text-white text-xs font-bold"
            >
              Retry
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-[#D9E1FA] p-8 max-w-lg mx-auto">
            <Shield className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-bold text-[#101A38] text-base">No policy products matched your criteria</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4 leading-relaxed">
              Try adjusting your search query, increasing the maximum premium threshold, or selecting a different category.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('ALL');
                setSearchQuery('');
                setMaxPremium(25000);
                setSearchParams({});
              }}
              className="px-4 py-2 rounded-xl bg-[#020950] text-white text-xs font-semibold"
            >
              Show All 15 Products
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => {
              const isComparing = compareIds.includes(product._id);
              return (
                <div
                  key={product._id}
                  className="bg-white rounded-2xl border border-[#D9E1FA] p-6 shadow-xs flex flex-col justify-between hover:border-[#8FA4E8] hover:shadow-lg transition duration-200 group relative"
                >
                  <div>
                    {/* Top Row: Category + Plan Code */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#E8EDFF] text-[#090DC2] border border-[#D9E1FA] flex items-center gap-1">
                        {getCategoryIcon(product.category)}
                        <span>{product.category}</span>
                      </span>
                      <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                        {product.planCode}
                      </span>
                    </div>

                    {/* Insurer & Product Title */}
                    <div className="mb-2">
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                        {product.insurer}
                      </div>
                      <h3 className="font-extrabold text-[#101A38] text-base sm:text-lg group-hover:text-[#0000FF] transition font-heading">
                        {product.productName}
                      </h3>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-[#64708A] line-clamp-2 mb-4 leading-relaxed">
                      {product.description}
                    </p>

                    {/* Pricing & Coverage Specifications */}
                    <div className="space-y-2.5 py-3.5 border-y border-slate-100 text-xs">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-slate-500 text-[11px] block">{getCoverageLabel(product.category)}:</span>
                          <span className="text-[10px] text-slate-400 block">{getCoverageSubtext(product.category)}</span>
                        </div>
                        <span className="font-extrabold text-[#101A38] text-sm sm:text-base">
                          {formatINR(product.coverageLimit)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 text-[11px]">Illustrative Annual Premium:</span>
                        <span className="font-extrabold text-[#0000FF] text-sm">
                          {formatINR(product.annualPremium)}/yr
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 text-[11px]">Sample Deductible:</span>
                        <span className="font-semibold text-slate-800">
                          {formatINR(product.deductible)}
                        </span>
                      </div>
                    </div>

                    {/* Key Coverage Highlights */}
                    {product.keyBenefits && product.keyBenefits.length > 0 && (
                      <div className="mt-4 space-y-1.5">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                          Coverage Highlights:
                        </span>
                        {product.keyBenefits.slice(0, 2).map((benefit, i) => (
                          <div key={i} className="flex items-start gap-1.5 text-xs text-slate-600">
                            <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                            <span className="line-clamp-1">{benefit}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Card Actions */}
                  <div className="mt-6 pt-3 border-t border-slate-100 space-y-2">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/policies/${product._id}`}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-[#020950] hover:bg-[#0000FF] text-white font-bold text-xs text-center transition shadow-xs flex items-center justify-center gap-1.5"
                      >
                        <span>View Terms & Details</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>

                      {product.officialUrl && (
                        <a
                          href={product.officialUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Visit official insurer website (opens in new tab)"
                          className="p-2.5 rounded-xl border border-[#D9E1FA] text-slate-600 hover:text-[#0000FF] hover:border-[#8FA4E8] hover:bg-[#F5F7FF] transition"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleCompare(product._id)}
                      className={`w-full py-1.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                        isComparing
                          ? 'bg-blue-50 text-blue-700 border-blue-300'
                          : 'border-[#D9E1FA] text-slate-600 hover:bg-[#F5F7FF]'
                      }`}
                    >
                      <Scale className="w-3.5 h-3.5" />
                      {isComparing ? 'Selected for Comparison' : 'Add to Compare'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Global Catalog Disclaimer Footer */}
        <div className="mt-12 p-5 rounded-2xl bg-white border border-[#D9E1FA] text-xs text-slate-600 leading-relaxed space-y-2">
          <div className="flex items-center gap-2 text-slate-900 font-bold">
            <Info className="w-4 h-4 text-[#0000FF]" />
            <span>Important Notice regarding Demonstrative Catalog Data:</span>
          </div>
          <p>
            The 15 insurance products presented above are illustrative configurations within the InsureFlow demonstration environment. 
            Displayed annual premiums, coverage values, deductibles, benefits, eligibility criteria, and exclusions are indicative estimates. 
            They do not represent binding price quotes or direct commercial partnerships with the named insurers. 
            Always consult the official policy wording and schedule issued by the respective insurer before applying or taking financial decisions.
          </p>
        </div>

      </main>

      <Footer />
    </div>
  );
}

export default PoliciesCatalog;
