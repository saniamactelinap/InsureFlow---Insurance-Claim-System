import { formatINR } from '../../utils/currency';
import React, { useState, useEffect } from 'react';
import { 
  Shield, Plus, Search, Edit3, Trash2, Eye, 
  CheckCircle, XCircle, AlertCircle, Layers,
  ExternalLink
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

export default function PolicyManagement() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    productName: '',
    name: '',
    insurer: '',
    insurerName: '',
    category: 'HEALTH',
    planCode: '',
    description: '',
    coverageLimit: 1000000,
    maxCoverage: 1000000,
    deductible: 0,
    annualPremium: 15000,
    premiumMonthly: 1250,
    officialUrl: '',
    keyBenefits: ['Hospitalization', 'Surgery', 'Emergency Room'],
    exclusions: ['Cosmetic procedures', 'Pre-existing conditions under waiting period'],
    requiredDocuments: ['Medical Discharge Summary', 'Hospital Invoices', 'Government ID'],
    isPublished: true,
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/policy-products', { params: { includeUnpublished: true } });
      setProducts(res.data?.data || []);
    } catch (err) {
      showToast('Failed to load insurance policy products', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePublish = async (prod) => {
    try {
      await api.patch(`/policy-products/${prod._id}/publish`, {
        isPublished: !prod.isPublished,
      });
      showToast(`Product ${!prod.isPublished ? 'published' : 'unpublished'}`, 'success');
      fetchProducts();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update publish state', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const payload = {
        productName: formData.productName || formData.name,
        name: formData.productName || formData.name,
        insurer: formData.insurer || formData.insurerName,
        insurerName: formData.insurer || formData.insurerName,
        category: formData.category,
        planCode: formData.planCode,
        description: formData.description,
        coverageLimit: Number(formData.coverageLimit || formData.maxCoverage),
        maxCoverage: Number(formData.coverageLimit || formData.maxCoverage),
        deductible: Number(formData.deductible),
        annualPremium: Number(formData.annualPremium || (formData.premiumMonthly * 12)),
        officialUrl: formData.officialUrl || '',
        keyBenefits: Array.isArray(formData.keyBenefits) ? formData.keyBenefits : [],
        exclusions: Array.isArray(formData.exclusions) ? formData.exclusions : [],
        requiredDocuments: Array.isArray(formData.requiredDocuments) ? formData.requiredDocuments : [],
        isPublished: formData.isPublished,
      };

      if (editingProduct) {
        await api.put(`/policy-products/${editingProduct._id}`, payload);
        showToast('Policy product updated successfully', 'success');
      } else {
        await api.post('/policy-products', payload);
        showToast('New policy product created and cataloged', 'success');
      }
      setShowModal(false);
      setEditingProduct(null);
      fetchProducts();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save product', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData({
      productName: '',
      name: '',
      insurer: '',
      insurerName: '',
      category: 'HEALTH',
      planCode: `HLTH-CUS-${Math.floor(10 + Math.random() * 90)}`,
      description: '',
      coverageLimit: 1000000,
      maxCoverage: 1000000,
      deductible: 0,
      annualPremium: 15000,
      premiumMonthly: 1250,
      officialUrl: '',
      keyBenefits: ['Comprehensive Inpatient Care', 'Day-care Procedures'],
      exclusions: ['Elective cosmetic surgery', 'Routine wear and tear'],
      requiredDocuments: ['Formal Claim Form', 'Itemized Invoices', 'Government ID'],
      isPublished: true,
    });
    setShowModal(true);
  };

  const openEditModal = (prod) => {
    setEditingProduct(prod);
    setFormData({
      productName: prod.productName || prod.name || '',
      name: prod.productName || prod.name || '',
      insurer: prod.insurer || prod.insurerName || '',
      insurerName: prod.insurer || prod.insurerName || '',
      category: prod.category || 'HEALTH',
      planCode: prod.planCode || '',
      description: prod.description || '',
      coverageLimit: prod.coverageLimit || prod.maxCoverage || 0,
      maxCoverage: prod.coverageLimit || prod.maxCoverage || 0,
      deductible: prod.deductible || 0,
      annualPremium: prod.annualPremium || (prod.premiumMonthly ? prod.premiumMonthly * 12 : 0),
      premiumMonthly: prod.annualPremium ? Math.round(prod.annualPremium / 12) : (prod.premiumMonthly || 0),
      officialUrl: prod.officialUrl || '',
      keyBenefits: prod.keyBenefits || prod.coverageDetails || [],
      exclusions: prod.exclusions || [],
      requiredDocuments: prod.requiredDocuments || [],
      isPublished: prod.isPublished !== undefined ? prod.isPublished : true,
    });
    setShowModal(true);
  };

  const filteredProducts = products.filter((p) => {
    const title = (p.productName || p.name || '').toLowerCase();
    const carrier = (p.insurer || p.insurerName || '').toLowerCase();
    const cat = (p.category || '').toLowerCase();
    const code = (p.planCode || '').toLowerCase();
    const q = search.toLowerCase();
    return title.includes(q) || carrier.includes(q) || cat.includes(q) || code.includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Insurance Product Catalog Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure underwriting coverage, publish policies to customer catalog, and define demonstration terms.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-navy-800 hover:bg-navy-900 text-white rounded-lg text-sm font-semibold transition-all shadow-md flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Create Policy Product
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#D9E1FA] shadow-sm flex gap-4">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search products by title, carrier, plan code, or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-[#D9E1FA] rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-500"
          />
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full p-12 text-center text-slate-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-700 mx-auto mb-2"></div>
            Loading policy products...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="col-span-full p-12 text-center text-slate-400">
            <Shield className="w-12 h-12 mx-auto text-slate-300 mb-2" />
            <p className="font-medium text-slate-600">No insurance products found</p>
          </div>
        ) : (
          filteredProducts.map((prod) => (
            <div 
              key={prod._id} 
              className="bg-white rounded-xl border border-[#D9E1FA] shadow-sm overflow-hidden flex flex-col justify-between hover:border-navy-400 transition-colors"
            >
              <div className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 uppercase tracking-wide">
                      {prod.category}
                    </span>
                    {prod.planCode && (
                      <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                        {prod.planCode}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleTogglePublish(prod)}
                    className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border transition ${
                      prod.isPublished
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                        : 'bg-slate-100 text-slate-500 border-[#D9E1FA] hover:bg-slate-200'
                    }`}
                  >
                    {prod.isPublished ? '● Published' : '○ Draft'}
                  </button>
                </div>

                <div>
                  <h3 className="font-bold text-navy-900 text-base">{prod.productName || prod.name}</h3>
                  <p className="text-xs text-slate-500 font-medium">{prod.insurer || prod.insurerName}</p>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{prod.description}</p>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400 text-[11px]">
                      {prod.category === 'VEHICLE' ? 'Sample IDV:' : prod.category === 'PROPERTY' ? 'Insured Value:' : 'Coverage Limit:'}
                    </span>
                    <p className="font-bold text-navy-900">{formatINR(prod.coverageLimit || prod.maxCoverage)}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px]">Annual Premium:</span>
                    <p className="font-bold text-[#0000FF]">
                      {formatINR(prod.annualPremium || ((prod.premiumMonthly || 0) * 12))}/yr
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px]">Deductible:</span>
                    <p className="font-semibold text-slate-700">{formatINR(prod.deductible)}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px]">Duration:</span>
                    <p className="font-semibold text-slate-700">{prod.durationMonths || 12} Mos</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-[#F5F7FF] border-t border-slate-100 flex items-center justify-between gap-2">
                {prod.officialUrl ? (
                  <a
                    href={prod.officialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-blue-600 hover:text-blue-800 flex items-center gap-1 font-semibold"
                  >
                    <span>Insurer Link</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="text-[11px] text-slate-400">Internal Plan</span>
                )}

                <button
                  onClick={() => openEditModal(prod)}
                  className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded text-xs font-semibold flex items-center gap-1 shadow-2xs"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit Configuration
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Product Form Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-navy-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-navy-900">
                {editingProduct ? 'Edit Policy Product' : 'Create Insurance Product'}
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Product Title</label>
                <input
                  type="text"
                  value={formData.productName}
                  onChange={(e) => setFormData({ ...formData, productName: e.target.value, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-[#D9E1FA] rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Insurance Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-[#D9E1FA] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-navy-500"
                  >
                    <option value="HEALTH">Health</option>
                    <option value="VEHICLE">Vehicle</option>
                    <option value="PROPERTY">Property</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Carrier / Insurer</label>
                  <input
                    type="text"
                    value={formData.insurer}
                    onChange={(e) => setFormData({ ...formData, insurer: e.target.value, insurerName: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-[#D9E1FA] rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Plan Code</label>
                <input
                  type="text"
                  value={formData.planCode}
                  onChange={(e) => setFormData({ ...formData, planCode: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-[#D9E1FA] rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-navy-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Policy Description</label>
                <textarea
                  rows="2"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-[#D9E1FA] rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-500"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Coverage Limit (₹)</label>
                  <input
                    type="number"
                    value={formData.coverageLimit}
                    onChange={(e) => setFormData({ ...formData, coverageLimit: Number(e.target.value), maxCoverage: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-[#D9E1FA] rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Deductible (₹)</label>
                  <input
                    type="number"
                    value={formData.deductible}
                    onChange={(e) => setFormData({ ...formData, deductible: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-[#D9E1FA] rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Annual Premium (₹)</label>
                  <input
                    type="number"
                    value={formData.annualPremium}
                    onChange={(e) => setFormData({ ...formData, annualPremium: Number(e.target.value), premiumMonthly: Math.round(Number(e.target.value) / 12) })}
                    className="w-full px-3 py-2 text-xs border border-[#D9E1FA] rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Official Insurer Link (Optional)</label>
                <input
                  type="url"
                  value={formData.officialUrl}
                  onChange={(e) => setFormData({ ...formData, officialUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 text-xs border border-[#D9E1FA] rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isPublished"
                  checked={formData.isPublished}
                  onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                  className="w-4 h-4 text-navy-600 rounded focus:ring-navy-500"
                />
                <label htmlFor="isPublished" className="text-xs font-semibold text-slate-700">
                  Publish immediately to public customer catalog
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-[#D9E1FA] rounded-lg text-xs font-semibold text-slate-600 hover:bg-[#F5F7FF]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-navy-800 hover:bg-navy-900 text-white rounded-lg text-xs font-semibold shadow-md"
                >
                  {submitting ? 'Saving...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export { PolicyManagement };
