'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Topbar from '../../../../components/layout/Topbar';
import { discountSchemesApi } from '../../../../lib/erp-api';
import toast from 'react-hot-toast';
import { Save, ArrowLeft, Plus, Trash2, Gift, ShoppingCart, Package, Loader2 } from 'lucide-react';
import Link from 'next/link';
import ProductSelector from '../../../../components/shared/ProductSelector';

export default function EditDiscountSchemePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [initialLoad, setInitialLoad] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    schemeName: '',
    schemeCode: '',
    description: '',
    schemeType: 'BUY_X_GET_Y', // Default
    priority: 0,
    stackingRule: 'BEST_DISCOUNT',
    discountValue: '',
    maxDiscountAmount: '',
    startDate: '',
    endDate: '',
    applicability: {
      productScope: 'ALL',
      customerScope: 'ALL'
    }
  });

  const [buyProducts, setBuyProducts] = useState<any[]>([]);
  const [buyConditionType, setBuyConditionType] = useState('ALL');

  const [getProducts, setGetProducts] = useState<any[]>([]);
  const [getBenefitType, setGetBenefitType] = useState('FREE');
  const [getDiscountValue, setGetDiscountValue] = useState('');
  const [getSelectionType, setGetSelectionType] = useState('ALL');

  const [comboProducts, setComboProducts] = useState<any[]>([]);
  const [comboBenefitType, setComboBenefitType] = useState('FIXED_PRICE');
  const [comboDiscountValue, setComboDiscountValue] = useState('');

  useEffect(() => {
    if (id) {
      discountSchemesApi.getById(id).then(res => {
        const data = res.data.scheme || res.data;
        setFormData({
          schemeName: data.schemeName || '',
          schemeCode: data.schemeCode || '',
          description: data.description || '',
          schemeType: data.schemeType || 'BUY_X_GET_Y',
          priority: data.priority || 0,
          stackingRule: data.stackingRule || 'BEST_DISCOUNT',
          discountValue: data.discountValue || '',
          maxDiscountAmount: data.maxDiscountAmount || '',
          startDate: data.startDate ? data.startDate.split('T')[0] : '',
          endDate: data.endDate ? data.endDate.split('T')[0] : '',
          applicability: {
            productScope: data.applicability?.productScope || 'ALL',
            customerScope: data.applicability?.customerScope || 'ALL'
          }
        });
        
        if (data.buyCondition?.products) {
          setBuyProducts(data.buyCondition.products);
          setBuyConditionType(data.buyCondition.conditionType || 'ALL');
        }
        
        if (data.getReward?.products) {
          setGetProducts(data.getReward.products);
          setGetBenefitType(data.getReward.benefitType || 'FREE');
          setGetDiscountValue(data.getReward.discountValue || '');
          setGetSelectionType(data.getReward.selectionType || 'ALL');
        }
        
        if (data.combo?.products) {
          setComboProducts(data.combo.products);
          setComboBenefitType(data.combo.benefitType || 'FIXED_PRICE');
          setComboDiscountValue(data.combo.discountValue || '');
        }
      }).catch(err => {
        toast.error('Failed to load scheme details');
        router.push('/dashboard/discount-schemes');
      }).finally(() => {
        setInitialLoad(false);
      });
    } else {
      setInitialLoad(false);
    }
  }, [id, router]);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({ ...prev, [parent]: { ...(prev as any)[parent], [child]: value } }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAddBuyProduct = (product: any) => {
    if (buyProducts.find(p => p.productId === product._id)) {
      return toast.error('Product already added to Buy condition');
    }
    setBuyProducts([...buyProducts, { productId: product._id, name: product.name, sku: product.sku, unit: product.unit, quantity: 1, price: product.sellingPrice }]);
  };

  const handleAddGetProduct = (product: any) => {
    if (getProducts.find(p => p.productId === product._id)) {
      return toast.error('Product already added to Get reward');
    }
    setGetProducts([...getProducts, { productId: product._id, name: product.name, sku: product.sku, unit: product.unit, quantity: 1, price: product.sellingPrice }]);
  };

  const handleAddComboProduct = (product: any) => {
    if (comboProducts.find(p => p.productId === product._id)) {
      return toast.error('Product already added to Combo');
    }
    setComboProducts([...comboProducts, { productId: product._id, name: product.name, sku: product.sku, unit: product.unit, quantity: 1, price: product.sellingPrice }]);
  };

  const removeBuyProduct = (index: number) => setBuyProducts(buyProducts.filter((_, i) => i !== index));
  const removeGetProduct = (index: number) => setGetProducts(getProducts.filter((_, i) => i !== index));
  const removeComboProduct = (index: number) => setComboProducts(comboProducts.filter((_, i) => i !== index));

  const updateQuantity = (type: 'buy' | 'get' | 'combo', index: number, qty: number) => {
    if (qty < 1) return;
    if (type === 'buy') {
      const newItems = [...buyProducts];
      newItems[index].quantity = qty;
      setBuyProducts(newItems);
    } else if (type === 'get') {
      const newItems = [...getProducts];
      newItems[index].quantity = qty;
      setGetProducts(newItems);
    } else {
      const newItems = [...comboProducts];
      newItems[index].quantity = qty;
      setComboProducts(newItems);
    }
  };

  const calculateComboTotal = () => {
    return comboProducts.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
  };

  const handleSave = async () => {
    if (!formData.schemeName || !formData.schemeCode) {
      return toast.error('Please fill required basic fields (Name, Code)');
    }

    const payload: any = {
      ...formData,
      priority: Number(formData.priority),
      status: 'ACTIVE'
    };

    if (formData.schemeType === 'PERCENTAGE' || formData.schemeType === 'FLAT') {
      payload.discountValue = Number(formData.discountValue);
    }

    if (formData.schemeType === 'BUY_X_GET_Y' || formData.schemeType === 'BUY_X_GET_DISCOUNT') {
      if (buyProducts.length === 0) return toast.error('At least one Buy Product is required');
      payload.buyCondition = {
        products: buyProducts.map(p => ({ productId: p.productId, unit: p.unit, quantity: Number(p.quantity) })),
        conditionType: buyConditionType
      };

      if (formData.schemeType === 'BUY_X_GET_Y') {
        if (getProducts.length === 0) return toast.error('At least one Get Product is required');
        payload.getReward = {
          products: getProducts.map(p => ({ productId: p.productId, unit: p.unit, quantity: Number(p.quantity) })),
          benefitType: getBenefitType,
          discountValue: getBenefitType !== 'FREE' ? Number(getDiscountValue) : 0,
          selectionType: getSelectionType
        };
      }
    }

    if (formData.schemeType === 'COMBO') {
      if (comboProducts.length < 2) return toast.error('Combo requires at least 2 products');
      if (!comboDiscountValue) return toast.error('Combo price or discount value is required');
      payload.combo = {
        products: comboProducts.map(p => ({ productId: p.productId, unit: p.unit, quantity: Number(p.quantity) })),
        benefitType: comboBenefitType,
        discountValue: Number(comboDiscountValue)
      };
    }
    
    setLoading(true);
    try {
      if (id) {
        await discountSchemesApi.update(id, payload);
        toast.success('Discount Scheme Updated!');
      } else {
        await discountSchemesApi.create(payload);
        toast.success('Discount Scheme Created!');
      }
      router.push('/dashboard/discount-schemes');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save scheme');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoad) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50">
        <Topbar title="Edit Discount Scheme" />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Topbar title="Edit Discount Scheme" />
      <main className="flex-1 p-6 max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* FORM LEFT COLUMN */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between mb-2">
            <Link href="/dashboard/discount-schemes" className="flex items-center text-slate-500 hover:text-slate-800 transition">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Link>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 space-y-6">
              
              {/* Basic Info */}
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-4 border-b pb-2">Basic Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Scheme Name *</label>
                    <input type="text" name="schemeName" value={formData.schemeName} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. Festival Combo" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Scheme Code (Unique) *</label>
                    <input type="text" name="schemeCode" value={formData.schemeCode} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. FEST-2026" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Scheme Type *</label>
                    <select name="schemeType" value={formData.schemeType} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-semibold text-indigo-700 bg-indigo-50">
                      <option value="BUY_X_GET_Y">Buy X Get Y</option>
                      <option value="BUY_X_GET_DISCOUNT">Buy X Get Discount</option>
                      <option value="COMBO">Combo Offer</option>
                      <option value="PERCENTAGE">Flat Percentage Discount (%)</option>
                      <option value="FLAT">Flat Amount Discount (₹)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                    <input type="text" name="description" value={formData.description} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                </div>
              </div>

              {/* DYNAMIC SECTIONS */}

              {/* BUY X Section */}
              {(formData.schemeType === 'BUY_X_GET_Y' || formData.schemeType === 'BUY_X_GET_DISCOUNT') && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <ShoppingCart className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-bold text-blue-900">BUY X — QUALIFYING PRODUCTS</h3>
                  </div>
                  
                  <div className="mb-4">
                    <ProductSelector onSelect={handleAddBuyProduct} placeholder="Search product to add to BUY condition..." />
                  </div>

                  {buyProducts.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {buyProducts.map((p, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-white p-3 rounded-lg border border-blue-100 shadow-sm">
                          <div>
                            <p className="font-semibold text-slate-800 text-sm">{p.name}</p>
                            <p className="text-xs text-slate-500">{p.sku} | ₹{p.price}/{p.unit}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center border rounded-lg">
                              <span className="px-2 text-xs text-slate-500 bg-slate-50 border-r rounded-l-lg py-1">Qty</span>
                              <input type="number" min="1" value={p.quantity} onChange={(e) => updateQuantity('buy', idx, parseInt(e.target.value) || 1)} className="w-16 text-center outline-none py-1 text-sm font-semibold" />
                            </div>
                            <button onClick={() => removeBuyProduct(idx)} className="text-red-400 hover:text-red-600 p-1 bg-red-50 rounded-md"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {buyProducts.length > 1 && (
                    <div className="flex items-center gap-2 mt-4 bg-white p-2 rounded-lg border border-blue-100 w-max">
                      <span className="text-sm font-medium text-slate-600 ml-2">Condition:</span>
                      <select value={buyConditionType} onChange={e => setBuyConditionType(e.target.value)} className="text-sm bg-transparent font-bold text-blue-700 outline-none">
                        <option value="ALL">Must buy ALL of the above</option>
                        <option value="ANY">Must buy ANY of the above</option>
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* GET Y Section */}
              {formData.schemeType === 'BUY_X_GET_Y' && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Gift className="w-5 h-5 text-emerald-600" />
                    <h3 className="text-lg font-bold text-emerald-900">GET Y — CUSTOMER REWARD</h3>
                  </div>
                  
                  <div className="mb-4">
                    <ProductSelector onSelect={handleAddGetProduct} placeholder="Search product to add as REWARD..." />
                  </div>

                  {getProducts.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {getProducts.map((p, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-white p-3 rounded-lg border border-emerald-100 shadow-sm">
                          <div>
                            <p className="font-semibold text-slate-800 text-sm">{p.name}</p>
                            <p className="text-xs text-slate-500">{p.sku} | ₹{p.price}/{p.unit}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center border rounded-lg">
                              <span className="px-2 text-xs text-slate-500 bg-slate-50 border-r rounded-l-lg py-1">Qty</span>
                              <input type="number" min="1" value={p.quantity} onChange={(e) => updateQuantity('get', idx, parseInt(e.target.value) || 1)} className="w-16 text-center outline-none py-1 text-sm font-semibold text-emerald-700" />
                            </div>
                            <button onClick={() => removeGetProduct(idx)} className="text-red-400 hover:text-red-600 p-1 bg-red-50 rounded-md"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 mt-4 bg-white p-4 rounded-lg border border-emerald-100">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Benefit Type</label>
                      <select value={getBenefitType} onChange={e => setGetBenefitType(e.target.value)} className="w-full text-sm py-1 border-b outline-none font-bold text-emerald-700">
                        <option value="FREE">100% FREE</option>
                        <option value="PERCENTAGE_DISCOUNT">Percentage Discount (%)</option>
                        <option value="FIXED_DISCOUNT">Fixed Discount (₹ off)</option>
                        <option value="SPECIAL_PRICE">Special Price (Fixed ₹)</option>
                      </select>
                    </div>
                    {getBenefitType !== 'FREE' && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Discount Value</label>
                        <input type="number" value={getDiscountValue} onChange={e => setGetDiscountValue(e.target.value)} className="w-full text-sm py-1 border-b outline-none font-bold text-emerald-700" placeholder="Enter value..." />
                      </div>
                    )}
                    {getProducts.length > 1 && (
                      <div className="col-span-2 mt-2">
                        <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Customer Selection</label>
                        <select value={getSelectionType} onChange={e => setGetSelectionType(e.target.value)} className="w-full text-sm py-1 border-b outline-none font-bold text-slate-700">
                          <option value="ALL">Customer gets ALL of the above</option>
                          <option value="CHOOSE_ONE">Customer can choose ONE of the above</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* GET DISCOUNT Section (For BUY X GET DISCOUNT) */}
              {formData.schemeType === 'BUY_X_GET_DISCOUNT' && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-5">
                   <div className="flex items-center gap-2 mb-4">
                    <Gift className="w-5 h-5 text-emerald-600" />
                    <h3 className="text-lg font-bold text-emerald-900">GET DISCOUNT</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4 bg-white p-4 rounded-lg border border-emerald-100">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Benefit Type</label>
                      <select value={getBenefitType} onChange={e => setGetBenefitType(e.target.value)} className="w-full text-sm py-1 border-b outline-none font-bold text-emerald-700">
                        <option value="PERCENTAGE_DISCOUNT">Percentage Discount (%)</option>
                        <option value="FIXED_DISCOUNT">Fixed Discount (₹ off)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Discount Value</label>
                      <input type="number" value={getDiscountValue} onChange={e => setGetDiscountValue(e.target.value)} className="w-full text-sm py-1 border-b outline-none font-bold text-emerald-700" placeholder="Enter value..." />
                    </div>
                  </div>
                </div>
              )}

              {/* COMBO Section */}
              {formData.schemeType === 'COMBO' && (
                <div className="bg-purple-50 border border-purple-100 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Package className="w-5 h-5 text-purple-600" />
                    <h3 className="text-lg font-bold text-purple-900">COMBO PRODUCTS</h3>
                  </div>
                  
                  <div className="mb-4">
                    <ProductSelector onSelect={handleAddComboProduct} placeholder="Search product to add to Combo..." />
                  </div>

                  {comboProducts.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {comboProducts.map((p, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-white p-3 rounded-lg border border-purple-100 shadow-sm">
                          <div>
                            <p className="font-semibold text-slate-800 text-sm">{p.name}</p>
                            <p className="text-xs text-slate-500">{p.sku}</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-xs text-slate-400">Total</p>
                              <p className="text-sm font-bold text-slate-700">₹{p.price * p.quantity}</p>
                            </div>
                            <div className="flex items-center border rounded-lg">
                              <span className="px-2 text-xs text-slate-500 bg-slate-50 border-r rounded-l-lg py-1">Qty</span>
                              <input type="number" min="1" value={p.quantity} onChange={(e) => updateQuantity('combo', idx, parseInt(e.target.value) || 1)} className="w-16 text-center outline-none py-1 text-sm font-semibold" />
                            </div>
                            <button onClick={() => removeComboProduct(idx)} className="text-red-400 hover:text-red-600 p-1 bg-red-50 rounded-md"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="bg-white p-4 rounded-lg border border-purple-100 mt-4">
                    <div className="flex items-center justify-between mb-4 border-b pb-3">
                      <span className="text-sm font-medium text-slate-600">Normal Total Price:</span>
                      <span className="text-lg font-bold text-slate-400 line-through">₹{calculateComboTotal()}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Combo Pricing Rule</label>
                        <select value={comboBenefitType} onChange={e => setComboBenefitType(e.target.value)} className="w-full text-sm py-1 border-b outline-none font-bold text-purple-700">
                          <option value="FIXED_PRICE">Fixed Combo Price (₹)</option>
                          <option value="PERCENTAGE_DISCOUNT">Percentage Discount (%)</option>
                          <option value="FIXED_DISCOUNT">Fixed Amount Off (₹)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Value</label>
                        <input type="number" value={comboDiscountValue} onChange={e => setComboDiscountValue(e.target.value)} className="w-full text-sm py-1 border-b outline-none font-bold text-purple-700" placeholder="Enter value..." />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Standard Discount Settings */}
              {(formData.schemeType === 'PERCENTAGE' || formData.schemeType === 'FLAT') && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                  <h3 className="text-lg font-bold text-slate-800 mb-4">DISCOUNT VALUE</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Value *</label>
                      <input type="number" name="discountValue" value={formData.discountValue} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. 10" />
                    </div>
                  </div>
                </div>
              )}

              {/* Validity & Applicability */}
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-4 border-b pb-2">Conditions & Limits</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                    <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
                    <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Customers Scope</label>
                    <select name="applicability.customerScope" value={formData.applicability.customerScope} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
                      <option value="ALL">All Customers</option>
                      <option value="GROUP">Specific Customer Group</option>
                      <option value="WHOLESALE">Wholesale Customers</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Stacking Rule</label>
                    <select name="stackingRule" value={formData.stackingRule} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
                      <option value="BEST_DISCOUNT">Best Discount Only</option>
                      <option value="NO_STACKING">Do Not Combine</option>
                      <option value="COMBINE">Allow Combination</option>
                    </select>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* PREVIEW RIGHT COLUMN */}
        <div className="lg:col-span-1">
          <div className="bg-slate-800 text-white rounded-xl shadow-lg sticky top-24 overflow-hidden border border-slate-700">
            <div className="bg-slate-900 p-4 border-b border-slate-700">
              <h3 className="font-bold text-lg text-emerald-400">Scheme Preview</h3>
              <p className="text-xs text-slate-400">This is how the engine interprets it</p>
            </div>
            
            <div className="p-5 space-y-5">
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Name & Code</h4>
                <p className="font-semibold text-lg">{formData.schemeName || 'Untitled Scheme'}</p>
                <p className="text-sm text-indigo-300 font-mono">{formData.schemeCode || 'NO-CODE'}</p>
              </div>

              {formData.schemeType === 'BUY_X_GET_Y' && (
                <>
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">If Customer Buys:</h4>
                    {buyProducts.length === 0 ? <p className="text-sm text-slate-400 italic">No products added...</p> : (
                      <div className="bg-slate-700 rounded-lg p-3 space-y-2">
                        {buyProducts.map((p, i) => (
                          <div key={i} className="flex justify-between text-sm">
                            <span>{p.quantity} {p.unit} × {p.name}</span>
                          </div>
                        ))}
                        {buyProducts.length > 1 && (
                          <div className="text-xs text-blue-300 font-semibold pt-2 border-t border-slate-600">
                            Condition: Must buy {buyConditionType} of these
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Customer Gets:</h4>
                    {getProducts.length === 0 ? <p className="text-sm text-slate-400 italic">No reward added...</p> : (
                      <div className="bg-emerald-900/40 border border-emerald-800 rounded-lg p-3 space-y-2">
                        {getProducts.map((p, i) => (
                          <div key={i} className="flex justify-between text-sm font-semibold text-emerald-300">
                            <span>{p.quantity} {p.unit} × {p.name}</span>
                          </div>
                        ))}
                        <div className="text-xs text-emerald-400 font-bold pt-2 border-t border-emerald-800/50 flex justify-between">
                          <span>Benefit: {getBenefitType === 'FREE' ? '100% FREE' : `${getDiscountValue} ${getBenefitType}`}</span>
                          {getProducts.length > 1 && <span>Select: {getSelectionType}</span>}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {formData.schemeType === 'BUY_X_GET_DISCOUNT' && (
                <>
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">If Customer Buys:</h4>
                    {buyProducts.length === 0 ? <p className="text-sm text-slate-400 italic">No products added...</p> : (
                      <div className="bg-slate-700 rounded-lg p-3 space-y-2">
                        {buyProducts.map((p, i) => (
                          <div key={i} className="flex justify-between text-sm">
                            <span>{p.quantity} {p.unit} × {p.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Customer Gets:</h4>
                    <div className="bg-emerald-900/40 border border-emerald-800 rounded-lg p-3">
                       <span className="text-lg font-bold text-emerald-400">
                         {getBenefitType === 'PERCENTAGE_DISCOUNT' ? `${getDiscountValue || 0}% OFF` : `₹${getDiscountValue || 0} OFF`}
                       </span>
                    </div>
                  </div>
                </>
              )}

              {formData.schemeType === 'COMBO' && (
                <div>
                   <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Combo Contains:</h4>
                   {comboProducts.length < 2 ? <p className="text-sm text-slate-400 italic">Add at least 2 products...</p> : (
                     <div className="bg-purple-900/40 border border-purple-800 rounded-lg p-3 space-y-2">
                        {comboProducts.map((p, i) => (
                          <div key={i} className="flex justify-between text-sm text-purple-100">
                            <span>{p.quantity} × {p.name}</span>
                            <span className="text-purple-300">₹{p.price * p.quantity}</span>
                          </div>
                        ))}
                        <div className="border-t border-purple-800/50 pt-2 mt-2">
                           <div className="flex justify-between text-xs text-purple-300 line-through">
                             <span>Normal Total:</span>
                             <span>₹{calculateComboTotal()}</span>
                           </div>
                           <div className="flex justify-between text-lg font-bold text-emerald-400 mt-1">
                             <span>Offer Price:</span>
                             <span>
                               {comboBenefitType === 'FIXED_PRICE' ? `₹${comboDiscountValue}` : 
                                comboBenefitType === 'FIXED_DISCOUNT' ? `₹${calculateComboTotal() - Number(comboDiscountValue)}` :
                                `₹${calculateComboTotal() * (1 - Number(comboDiscountValue)/100)}`
                               }
                             </span>
                           </div>
                        </div>
                     </div>
                   )}
                </div>
              )}

            </div>
            <div className="p-4 bg-slate-900/50">
              <button 
                onClick={handleSave} 
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-indigo-500 text-white px-5 py-3 rounded-lg font-bold hover:bg-indigo-600 transition disabled:opacity-50"
              >
                <Save className="w-5 h-5" />
                {loading ? 'Saving Scheme...' : 'Save & Activate'}
              </button>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
