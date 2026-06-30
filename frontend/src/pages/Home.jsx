import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import ProductCard from '../components/ProductCard';
import LocationAutocomplete from '../components/LocationAutocomplete';

const Home = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filter metadata
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);

    // Filter values
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [filterBrand, setFilterBrand] = useState('');
    const [filterLocation, setFilterLocation] = useState('');
    const [filterCondition, setFilterCondition] = useState('');
    const [filterListingType, setFilterListingType] = useState('');
    const [priceMin, setPriceMin] = useState('');
    const [priceMax, setPriceMax] = useState('');

    useEffect(() => {
        // Fetch metadata
        const fetchMetadata = async () => {
            try {
                const [catRes, brandRes] = await Promise.all([
                    api.get('categories/'),
                    api.get('brands/'),
                ]);
                setCategories(catRes.data);
                setBrands(brandRes.data);
            } catch (err) {
                console.error('Failed to load filter metadata', err);
            }
        };
        fetchMetadata();
    }, []);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const params = {};
            if (searchQuery) params.q = searchQuery;
            if (filterCategory) params.category = filterCategory;
            if (filterBrand) params.brand = filterBrand;
            if (filterLocation) params.location = filterLocation;
            if (filterCondition) params.condition = filterCondition;
            if (filterListingType) params.listing_type = filterListingType;
            if (priceMin) params.price_min = priceMin;
            if (priceMax) params.price_max = priceMax;

            const res = await api.get('products/', { params });
            setProducts(res.data);
            setError(null);
        } catch (err) {
            setError('Failed to load products.');
        } finally {
            setLoading(false);
        }
    };

    // Fetch products on initial mount
    useEffect(() => {
        fetchProducts();
    }, []);

    // Handle form submit for filtering
    const handleFilterSubmit = (e) => {
        e.preventDefault();
        fetchProducts();
    };

    // Reset filters helper
    const handleResetFilters = () => {
        setSearchQuery('');
        setFilterCategory('');
        setFilterBrand('');
        setFilterLocation('');
        setFilterCondition('');
        setFilterListingType('');
        setPriceMin('');
        setPriceMax('');
        // Trigger a fresh load with empty params
        setLoading(true);
        api.get('products/')
            .then(res => {
                setProducts(res.data);
                setError(null);
            })
            .catch(() => setError('Failed to load products.'))
            .finally(() => setLoading(false));
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            {/* Header */}
            <header className="text-center mb-10">
                <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Discover MarketHub
                </h1>
                <p className="text-gray-500 mt-2">Explore physical/digital products and negotiating classified ads.</p>
            </header>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Sidebar Filter Panel */}
                <div className="w-full lg:w-64 flex-shrink-0">
                    <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-sm sticky top-6">
                        <div className="flex justify-between items-center mb-5 pb-3 border-b border-gray-100">
                            <h2 className="text-lg font-bold text-gray-800">Filters</h2>
                            <button
                                onClick={handleResetFilters}
                                className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
                            >
                                Clear All
                            </button>
                        </div>

                        <form onSubmit={handleFilterSubmit} className="space-y-4">
                            {/* Text Search */}
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-600 uppercase">Search</label>
                                <input
                                    type="text"
                                    placeholder="Keywords..."
                                    className="w-full text-sm px-3.5 py-2 rounded-lg border border-gray-300 focus:ring-1 focus:ring-blue-500 bg-white"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            {/* Category */}
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-600 uppercase">Category</label>
                                <select
                                    className="w-full text-sm px-3.5 py-2 rounded-lg border border-gray-300 focus:ring-1 focus:ring-blue-500 bg-white"
                                    value={filterCategory}
                                    onChange={(e) => setFilterCategory(e.target.value)}
                                >
                                    <option value="">All Categories</option>
                                    {categories.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Brand */}
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-600 uppercase">Brand</label>
                                <select
                                    className="w-full text-sm px-3.5 py-2 rounded-lg border border-gray-300 focus:ring-1 focus:ring-blue-500 bg-white"
                                    value={filterBrand}
                                    onChange={(e) => setFilterBrand(e.target.value)}
                                >
                                    <option value="">All Brands</option>
                                    {brands.map(b => (
                                        <option key={b.id} value={b.id}>{b.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Location */}
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-600 uppercase">Location</label>
                                <LocationAutocomplete
                                    value={filterLocation}
                                    onInput={(val) => setFilterLocation(val)}
                                    onChange={(label) => setFilterLocation(label)}
                                    placeholder="Any city, district, town…"
                                    small={true}
                                />
                            </div>

                            {/* Condition */}
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-600 uppercase">Condition</label>
                                <select
                                    className="w-full text-sm px-3.5 py-2 rounded-lg border border-gray-300 focus:ring-1 focus:ring-blue-500 bg-white"
                                    value={filterCondition}
                                    onChange={(e) => setFilterCondition(e.target.value)}
                                >
                                    <option value="">Any Condition</option>
                                    <option value="NEW">New</option>
                                    <option value="USED">Used</option>
                                    <option value="REFURBISHED">Refurbished</option>
                                </select>
                            </div>

                            {/* Listing Type */}
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-600 uppercase">Listing Type</label>
                                <select
                                    className="w-full text-sm px-3.5 py-2 rounded-lg border border-gray-300 focus:ring-1 focus:ring-blue-500 bg-white"
                                    value={filterListingType}
                                    onChange={(e) => setFilterListingType(e.target.value)}
                                >
                                    <option value="">All Types</option>
                                    <option value="FIXED">Fixed Price (Amazon Style)</option>
                                    <option value="CLASSIFIED">Classified / Negotiable</option>
                                </select>
                            </div>

                            {/* Price Range */}
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-600 uppercase">Price Range ($)</label>
                                <div className="flex gap-2 items-center">
                                    <input
                                        type="number"
                                        placeholder="Min"
                                        className="w-full text-sm px-3 py-2 rounded-lg border border-gray-300 focus:ring-1 focus:ring-blue-500 bg-white"
                                        value={priceMin}
                                        onChange={(e) => setPriceMin(e.target.value)}
                                    />
                                    <span className="text-gray-400 text-xs">to</span>
                                    <input
                                        type="number"
                                        placeholder="Max"
                                        className="w-full text-sm px-3 py-2 rounded-lg border border-gray-300 focus:ring-1 focus:ring-blue-500 bg-white"
                                        value={priceMax}
                                        onChange={(e) => setPriceMax(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm py-2.5 rounded-lg shadow-sm transition mt-3"
                            >
                                Apply Filters
                            </button>
                        </form>
                    </div>
                </div>

                {/* Product Listings Area */}
                <div className="flex-1">
                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : error ? (
                        <div className="text-center py-12 text-red-500 font-semibold">{error}</div>
                    ) : products.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm text-gray-400">
                            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <h3 className="text-lg font-bold text-gray-600 mb-1">No products found</h3>
                            <p className="text-sm">Try modifying your filters or search keywords.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                            {products.map(product => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Home;
