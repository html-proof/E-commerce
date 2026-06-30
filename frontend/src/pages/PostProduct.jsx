import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import LocationAutocomplete from '../components/LocationAutocomplete';

const PostProduct = () => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [stock, setStock] = useState('');
    
    // Metadata states
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    
    const [categoryId, setCategoryId] = useState('');
    const [brandId, setBrandId] = useState('');
    const [locationText, setLocationText] = useState('');
    const [condition, setCondition] = useState('NEW');
    const [listingType, setListingType] = useState('FIXED');
    const [modelName, setModelName] = useState('');
    const [isDigital, setIsDigital] = useState(false);

    // Multi-image states
    const [images, setImages] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);

    // Variant states
    const [variants, setVariants] = useState([]);
    const [newVariant, setNewVariant] = useState({ size: '', color: '', price_override: '', stock: '' });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchMetadata = async () => {
            try {
                const [catRes, brandRes] = await Promise.all([
                    api.get('categories/'),
                    api.get('brands/'),
                ]);
                setCategories(catRes.data);
                setBrands(brandRes.data);
            } catch (err) {
                console.error('Failed to load product metadata', err);
            }
        };
        fetchMetadata();
    }, []);

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            setImages(prev => [...prev, ...files]);
            const newPreviews = files.map(file => URL.createObjectURL(file));
            setImagePreviews(prev => [...prev, ...newPreviews]);
        }
    };

    const removeImage = (idx) => {
        setImages(prev => prev.filter((_, i) => i !== idx));
        setImagePreviews(prev => prev.filter((_, i) => i !== idx));
    };

    const handleAddVariant = () => {
        if (!newVariant.size && !newVariant.color) {
            alert('Please specify at least size or color.');
            return;
        }
        setVariants(prev => [...prev, {
            ...newVariant,
            price_override: newVariant.price_override ? parseFloat(newVariant.price_override) : null,
            stock: parseInt(newVariant.stock) || 0
        }]);
        setNewVariant({ size: '', color: '', price_override: '', stock: '' });
    };

    const removeVariant = (idx) => {
        setVariants(prev => prev.filter((_, i) => i !== idx));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const formData = new FormData();
        formData.append('name', name);
        formData.append('description', description);
        formData.append('price', price);
        formData.append('stock', stock);
        
        if (categoryId) formData.append('category_id', categoryId);
        if (brandId) formData.append('brand_id', brandId);
        if (locationText) formData.append('location_text', locationText);
        formData.append('condition', condition);
        formData.append('listing_type', listingType);
        formData.append('model_name', modelName);
        formData.append('is_digital', isDigital);

        // Multiple images
        images.forEach(img => {
            formData.append('images', img);
        });

        // Variants JSON stringified
        formData.append('variants', JSON.stringify(variants));

        try {
            await api.post('products/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            navigate('/');
        } catch (err) {
            setError(err.response?.data ? JSON.stringify(err.response.data) : 'Failed to post product. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 transition-all duration-300 hover:shadow-2xl">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 text-white">
                    <h2 className="text-3xl font-extrabold tracking-tight">Sell Your Product / Post Ad</h2>
                    <p className="mt-2 text-blue-100">Fill in details to post an Amazon-style product or OLX classified ad.</p>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    {error && (
                        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-md text-sm animate-pulse" role="alert">
                            <p className="font-bold">Error</p>
                            <p>{error}</p>
                        </div>
                    )}

                    {/* Section 1: Basic Info */}
                    <div className="border-b border-gray-100 pb-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">1. Basic Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700">Product Title</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    placeholder="e.g. iPhone 13 Pro Space Gray"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700">Price ($)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    placeholder="0.00"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Metadata / OLX Specific Details */}
                    <div className="border-b border-gray-100 pb-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">2. Classification & Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700">Category</label>
                                <select
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                    value={categoryId}
                                    onChange={(e) => setCategoryId(e.target.value)}
                                    required
                                >
                                    <option value="">Select Category</option>
                                    {categories.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700">Brand</label>
                                <select
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                    value={brandId}
                                    onChange={(e) => setBrandId(e.target.value)}
                                >
                                    <option value="">Select Brand (Optional)</option>
                                    {brands.map(b => (
                                        <option key={b.id} value={b.id}>{b.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700">Location</label>
                                <LocationAutocomplete
                                    value={locationText}
                                    onChange={(label) => setLocationText(label)}
                                    placeholder="Search any city, district, small town…"
                                    required
                                />
                                <p className="text-xs text-gray-400">Any place in the world — city, district, village</p>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700">Condition</label>
                                <select
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                    value={condition}
                                    onChange={(e) => setCondition(e.target.value)}
                                >
                                    <option value="NEW">New</option>
                                    <option value="USED">Used</option>
                                    <option value="REFURBISHED">Refurbished</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700">Listing Type</label>
                                <select
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                    value={listingType}
                                    onChange={(e) => setListingType(e.target.value)}
                                >
                                    <option value="FIXED">Fixed Price (Amazon Style)</option>
                                    <option value="CLASSIFIED">Classified / Negotiable (OLX Style)</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700">Model Name / Number</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    placeholder="e.g. A2633"
                                    value={modelName}
                                    onChange={(e) => setModelName(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700">Stock Quantity</label>
                                <input
                                    type="number"
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    placeholder="1"
                                    value={stock}
                                    onChange={(e) => setStock(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="flex items-center pt-8">
                                <input
                                    id="is-digital"
                                    type="checkbox"
                                    className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                    checked={isDigital}
                                    onChange={(e) => setIsDigital(e.target.checked)}
                                />
                                <label htmlFor="is-digital" className="ml-3 block text-sm font-semibold text-gray-700 cursor-pointer">
                                    This is a Digital Product (No shipping required)
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Description & Images */}
                    <div className="border-b border-gray-100 pb-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">3. Description & Images</h3>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700">Description</label>
                                <textarea
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    rows="4"
                                    placeholder="Describe your product details, features, accessories included..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    required
                                ></textarea>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700">Product Images (Upload one or more)</label>
                                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-blue-500 transition-colors cursor-pointer relative bg-gray-50 hover:bg-blue-50/10">
                                    <div className="space-y-1 text-center">
                                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        <div className="flex text-sm text-gray-600 justify-center">
                                            <span className="font-semibold text-blue-600">Select files</span>
                                        </div>
                                        <p className="text-xs text-gray-500">PNG, JPG, JPEG up to 10MB each</p>
                                        <input
                                            type="file"
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            accept="image/*"
                                            multiple
                                            onChange={handleImageChange}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Image Previews Grid */}
                            {imagePreviews.length > 0 && (
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                                    {imagePreviews.map((preview, idx) => (
                                        <div key={idx} className="relative group rounded-lg overflow-hidden border border-gray-200 aspect-video bg-gray-100">
                                            <img src={preview} alt={`preview-${idx}`} className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => removeImage(idx)}
                                                className="absolute top-1.5 right-1.5 bg-red-600 text-white rounded-full p-1 shadow hover:bg-red-700 transition opacity-0 group-hover:opacity-100"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                            {idx === 0 && (
                                                <span className="absolute bottom-1.5 left-1.5 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">
                                                    Main Cover
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Section 4: Variants Definition */}
                    <div className="pb-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">4. Product Variants (Size / Color Options)</h3>
                        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200/60 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-600">Size / Option</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:ring-1 focus:ring-blue-500 bg-white"
                                        placeholder="e.g. 128GB, Large"
                                        value={newVariant.size}
                                        onChange={(e) => setNewVariant({ ...newVariant, size: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-600">Color</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:ring-1 focus:ring-blue-500 bg-white"
                                        placeholder="e.g. Black, Silver"
                                        value={newVariant.color}
                                        onChange={(e) => setNewVariant({ ...newVariant, color: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-600">Price Override ($)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:ring-1 focus:ring-blue-500 bg-white"
                                        placeholder="Optional override"
                                        value={newVariant.price_override}
                                        onChange={(e) => setNewVariant({ ...newVariant, price_override: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-600">Stock Qty</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:ring-1 focus:ring-blue-500 bg-white"
                                            placeholder="Stock"
                                            value={newVariant.stock}
                                            onChange={(e) => setNewVariant({ ...newVariant, stock: e.target.value })}
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAddVariant}
                                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-lg text-sm transition shadow-sm"
                                        >
                                            Add
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Added Variants List */}
                            {variants.length > 0 && (
                                <div className="overflow-x-auto pt-2">
                                    <table className="min-w-full bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                                        <thead className="bg-gray-100 text-gray-700 text-xs font-bold uppercase border-b border-gray-200">
                                            <tr>
                                                <th className="py-2.5 px-4 text-left">Size</th>
                                                <th className="py-2.5 px-4 text-left">Color</th>
                                                <th className="py-2.5 px-4 text-left">Override Price</th>
                                                <th className="py-2.5 px-4 text-left">Stock</th>
                                                <th className="py-2.5 px-4 text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 text-sm text-gray-600">
                                            {variants.map((v, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50">
                                                    <td className="py-2 px-4 font-medium">{v.size || '-'}</td>
                                                    <td className="py-2 px-4">{v.color || '-'}</td>
                                                    <td className="py-2 px-4 font-semibold text-blue-600">
                                                        {v.price_override ? `$${v.price_override}` : 'None'}
                                                    </td>
                                                    <td className="py-2 px-4">{v.stock}</td>
                                                    <td className="py-2 px-4 text-right">
                                                        <button
                                                            type="button"
                                                            onClick={() => removeVariant(idx)}
                                                            className="text-red-600 hover:text-red-800 font-semibold text-xs"
                                                        >
                                                            Remove
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Submit Bar */}
                    <div className="flex justify-end pt-4 border-t border-gray-100">
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full md:w-auto px-8 py-3.5 rounded-lg font-semibold text-white shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-150 ${
                                loading 
                                ? 'bg-gray-400 cursor-not-allowed' 
                                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl active:scale-[0.98]'
                            }`}
                        >
                            {loading ? (
                                <div className="flex items-center justify-center space-x-2">
                                    <div className="w-5 h-5 border-t-2 border-r-2 border-white rounded-full animate-spin"></div>
                                    <span>Posting Listing...</span>
                                </div>
                            ) : (
                                'Post Listing'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PostProduct;
