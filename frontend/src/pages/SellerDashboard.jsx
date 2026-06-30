import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';

// ─── Stat Card ────────────────────────────────────────────────
const StatCard = ({ icon, label, value, sub, color }) => (
    <div className={`bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow`}>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl flex-shrink-0 ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-sm text-gray-500 font-medium">{label}</p>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
            {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
    </div>
);

// ─── Mini Bar Chart ───────────────────────────────────────────
const RevenueChart = ({ data }) => {
    const max = Math.max(...data.map(d => d.revenue), 1);
    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-1">Revenue (Last 7 Days)</h3>
            <p className="text-xs text-gray-400 mb-5">Daily revenue from your product sales</p>
            <div className="flex items-end gap-2 h-32">
                {data.map((d, i) => {
                    const heightPct = max > 0 ? (d.revenue / max) * 100 : 0;
                    return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                            <div className="relative w-full flex items-end justify-center" style={{ height: '96px' }}>
                                <div
                                    className="w-full rounded-t-md bg-gradient-to-t from-blue-600 to-indigo-400 transition-all duration-500 group-hover:from-indigo-600 group-hover:to-blue-400"
                                    style={{ height: `${Math.max(heightPct, 4)}%` }}
                                />
                                {d.revenue > 0 && (
                                    <span className="absolute -top-5 text-xs font-semibold text-blue-700 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                        ${d.revenue.toFixed(0)}
                                    </span>
                                )}
                            </div>
                            <span className="text-[10px] text-gray-400 font-medium">{d.date.split(' ')[1]}</span>
                        </div>
                    );
                })}
            </div>
            <div className="flex justify-between mt-2 text-[10px] text-gray-400">
                {data.map((d, i) => <span key={i}>{d.date.split(' ')[0]}</span>)}
            </div>
        </div>
    );
};

// ─── Status Badge ─────────────────────────────────────────────
const StatusBadge = ({ status }) => {
    const colors = {
        'Active': 'bg-green-100 text-green-700 border-green-200',
        'Sold Out': 'bg-red-100 text-red-700 border-red-200',
    };
    return (
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${colors[status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
            {status}
        </span>
    );
};

// ─── Main Dashboard ───────────────────────────────────────────
const SellerDashboard = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState(null);
    const [filter, setFilter] = useState('All');
    const [search, setSearch] = useState('');
    const [confirmDelete, setConfirmDelete] = useState(null);

    useEffect(() => {
        if (!user) { navigate('/login'); return; }
        fetchDashboard();
    }, [user]);

    const fetchDashboard = async () => {
        setLoading(true);
        try {
            const res = await api.get('orders/seller/dashboard/');
            setData(res.data);
        } catch (err) {
            console.error('Failed to load dashboard', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (productId) => {
        setDeletingId(productId);
        try {
            await api.delete(`products/${productId}/`);
            setData(prev => ({
                ...prev,
                products: prev.products.filter(p => p.id !== productId),
            }));
        } catch (err) {
            console.error('Failed to delete product', err);
        } finally {
            setDeletingId(null);
            setConfirmDelete(null);
        }
    };

    if (!user) return null;

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-gray-500 text-sm">Loading your dashboard...</p>
            </div>
        </div>
    );

    const s = data?.summary || {};
    const filteredProducts = (data?.products || []).filter(p => {
        const matchFilter = filter === 'All' || p.status === filter;
        const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.category.toLowerCase().includes(search.toLowerCase());
        return matchFilter && matchSearch;
    });

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 text-white px-8 py-8">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div>
                            <h1 className="text-3xl font-extrabold tracking-tight">Seller Dashboard</h1>
                            <p className="text-blue-100 mt-1 text-sm">Welcome back, <strong>{user.username}</strong> — here's your store at a glance.</p>
                        </div>
                        <Link
                            to="/post-product"
                            className="inline-flex items-center gap-2 bg-white text-blue-700 font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-50 transition shadow"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                            </svg>
                            Post New Product
                        </Link>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    <StatCard icon="📦" label="Total Listings" value={s.total_listings ?? 0} color="bg-blue-500" />
                    <StatCard icon="✅" label="Active" value={s.active_listings ?? 0} sub="In stock" color="bg-green-500" />
                    <StatCard icon="🏷️" label="Sold Out" value={s.sold_listings ?? 0} color="bg-red-500" />
                    <StatCard icon="💰" label="Total Revenue" value={`$${(s.total_revenue ?? 0).toFixed(2)}`} sub="All time" color="bg-indigo-500" />
                    <StatCard icon="🛒" label="Units Sold" value={s.total_units_sold ?? 0} color="bg-orange-500" />
                    <StatCard icon="📋" label="Orders" value={s.total_orders ?? 0} color="bg-purple-500" />
                    <StatCard icon="💬" label="Chat Requests" value={s.chat_requests ?? 0} color="bg-teal-500" />
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-5 shadow flex items-center justify-center">
                        <Link to="/post-product" className="text-white text-center">
                            <div className="text-3xl mb-1">+</div>
                            <span className="text-xs font-semibold">New Listing</span>
                        </Link>
                    </div>
                </div>

                {/* Revenue Chart */}
                {data?.revenue_chart && <RevenueChart data={data.revenue_chart} />}

                {/* Listings Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-5 border-b border-gray-100 flex flex-wrap items-center gap-3 justify-between">
                        <div>
                            <h3 className="font-bold text-gray-800 text-lg">My Listings</h3>
                            <p className="text-xs text-gray-400">{filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} shown</p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            {/* Search */}
                            <div className="relative">
                                <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
                                </svg>
                                <input
                                    className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
                                    placeholder="Search products..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                />
                            </div>
                            {/* Filter tabs */}
                            {['All', 'Active', 'Sold Out'].map(f => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-4 py-2 text-sm rounded-lg font-medium transition ${filter === f ? 'bg-blue-600 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>

                    {filteredProducts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                            <svg className="w-16 h-16 mb-3 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                            <p className="font-medium">No listings found</p>
                            <Link to="/post-product" className="mt-3 text-sm text-blue-600 hover:underline">Post your first product →</Link>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                                        <th className="px-5 py-3 text-left font-semibold">Product</th>
                                        <th className="px-5 py-3 text-left font-semibold">Category</th>
                                        <th className="px-5 py-3 text-right font-semibold">Price</th>
                                        <th className="px-5 py-3 text-right font-semibold">Stock</th>
                                        <th className="px-5 py-3 text-right font-semibold">Units Sold</th>
                                        <th className="px-5 py-3 text-right font-semibold">Revenue</th>
                                        <th className="px-5 py-3 text-center font-semibold">Status</th>
                                        <th className="px-5 py-3 text-center font-semibold">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredProducts.map(product => (
                                        <tr key={product.id} className="hover:bg-blue-50/30 transition-colors">
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-3">
                                                    {product.image ? (
                                                        <img src={product.image.startsWith('http') ? product.image : `http://127.0.0.1:8000${product.image}`} alt={product.name} className="w-10 h-10 rounded-lg object-cover border border-gray-200" />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center text-gray-400">📦</div>
                                                    )}
                                                    <Link to={`/product/${product.id}`} className="font-semibold text-gray-800 hover:text-blue-600 transition-colors">
                                                        {product.name}
                                                    </Link>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3 text-gray-500">{product.category}</td>
                                            <td className="px-5 py-3 text-right font-semibold text-gray-800">${product.price.toFixed(2)}</td>
                                            <td className="px-5 py-3 text-right">
                                                <span className={`font-semibold ${product.stock === 0 ? 'text-red-500' : 'text-gray-800'}`}>
                                                    {product.stock}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-right text-gray-700">{product.units_sold}</td>
                                            <td className="px-5 py-3 text-right font-semibold text-green-600">${product.revenue.toFixed(2)}</td>
                                            <td className="px-5 py-3 text-center"><StatusBadge status={product.status} /></td>
                                            <td className="px-5 py-3 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Link
                                                        to={`/product/${product.id}`}
                                                        className="p-1.5 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition"
                                                        title="View"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                        </svg>
                                                    </Link>
                                                    <button
                                                        onClick={() => setConfirmDelete(product)}
                                                        className="p-1.5 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition"
                                                        title="Delete"
                                                        disabled={deletingId === product.id}
                                                    >
                                                        {deletingId === product.id ? (
                                                            <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                                                        ) : (
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        )}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Confirm Modal */}
            {confirmDelete && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center px-4">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-gray-800 text-center">Delete Product?</h3>
                        <p className="text-sm text-gray-500 text-center mt-2">
                            Are you sure you want to delete <strong>"{confirmDelete.name}"</strong>? This cannot be undone.
                        </p>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setConfirmDelete(null)}
                                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDelete(confirmDelete.id)}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SellerDashboard;
