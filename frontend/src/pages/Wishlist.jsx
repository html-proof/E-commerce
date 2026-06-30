import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import api from '../api/axios';

const Wishlist = () => {
    const { user } = useContext(AuthContext);
    const { addToCart } = useContext(CartContext);
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [removingId, setRemovingId] = useState(null);

    useEffect(() => {
        if (!user) { navigate('/login'); return; }
        fetchWishlist();
    }, [user]);

    const fetchWishlist = async () => {
        setLoading(true);
        try {
            const res = await api.get('products/wishlist/');
            setProducts(res.data);
        } catch (err) {
            console.error('Failed to load wishlist', err);
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = async (productId) => {
        setRemovingId(productId);
        try {
            await api.post('products/wishlist/toggle/', { product_id: productId });
            setProducts(prev => prev.filter(p => p.id !== productId));
        } catch (err) {
            console.error('Failed to remove from wishlist', err);
        } finally {
            setRemovingId(null);
        }
    };

    const handleAddToCart = async (productId) => {
        await addToCart(productId);
    };

    const getImageUrl = (product) => {
        if (product.images && product.images.length > 0) {
            const img = product.images[0].image;
            return img.startsWith('http') ? img : `http://127.0.0.1:8000${img}`;
        }
        if (product.image) {
            return product.image.startsWith('http') ? product.image : `http://127.0.0.1:8000${product.image}`;
        }
        return null;
    };

    if (!user) return null;

    return (
        <div className="container mx-auto px-4 py-10 max-w-5xl">
            {/* Header */}
            <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                    <svg className="w-6 h-6 text-red-500 fill-current" viewBox="0 0 24 24">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                </div>
                <div>
                    <h1 className="text-2xl font-extrabold text-gray-900">My Wishlist</h1>
                    <p className="text-sm text-gray-500">{products.length} saved item{products.length !== 1 ? 's' : ''}</p>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="w-8 h-8 border-4 border-red-400 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : products.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <svg className="w-20 h-20 mx-auto mb-4 text-gray-200" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                    <h3 className="text-xl font-bold text-gray-500 mb-2">Your wishlist is empty</h3>
                    <p className="text-gray-400 text-sm mb-6">Click the ♥ heart on any product to save it here.</p>
                    <Link
                        to="/"
                        className="inline-block bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow"
                    >
                        Browse Products
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.map(product => {
                        const imgUrl = getImageUrl(product);
                        return (
                            <div
                                key={product.id}
                                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group overflow-hidden flex flex-col"
                            >
                                {/* Image */}
                                <div className="relative h-48 bg-gray-50 overflow-hidden">
                                    {imgUrl ? (
                                        <img
                                            src={imgUrl}
                                            alt={product.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                                            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                    )}

                                    {/* Remove heart button */}
                                    <button
                                        onClick={() => handleRemove(product.id)}
                                        disabled={removingId === product.id}
                                        className="absolute top-3 right-3 w-9 h-9 bg-white rounded-full shadow flex items-center justify-center hover:bg-red-50 transition-all"
                                        title="Remove from wishlist"
                                    >
                                        {removingId === product.id ? (
                                            <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <svg className="w-5 h-5 text-red-500 fill-current" viewBox="0 0 24 24">
                                                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                                            </svg>
                                        )}
                                    </button>

                                    {/* Condition badge */}
                                    {product.condition && (
                                        <span className={`absolute top-3 left-3 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                            product.condition === 'NEW' ? 'bg-green-500 text-white' :
                                            product.condition === 'USED' ? 'bg-gray-500 text-white' :
                                            'bg-yellow-500 text-white'
                                        }`}>
                                            {product.condition}
                                        </span>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="p-4 flex flex-col flex-1">
                                    <div className="flex-1">
                                        <p className="text-xs text-blue-500 font-semibold mb-1">
                                            {product.category_detail?.name || product.category || ''}
                                        </p>
                                        <h3 className="font-bold text-gray-800 leading-snug line-clamp-2 mb-1">{product.name}</h3>
                                        {product.brand_detail && (
                                            <p className="text-xs text-gray-400 mb-2">{product.brand_detail.name}</p>
                                        )}
                                    </div>

                                    <div className="mt-3 flex items-center justify-between">
                                        <span className="text-xl font-extrabold text-blue-600">${product.price}</span>
                                        <Link
                                            to={`/product/${product.id}`}
                                            className="text-xs text-gray-500 hover:text-blue-600 underline"
                                        >
                                            View Details
                                        </Link>
                                    </div>

                                    <div className="mt-3 flex gap-2">
                                        <button
                                            onClick={() => handleAddToCart(product.id)}
                                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-xl text-sm font-bold transition shadow-sm"
                                        >
                                            Add to Cart
                                        </button>
                                        <button
                                            onClick={() => handleRemove(product.id)}
                                            disabled={removingId === product.id}
                                            className="px-3 py-2 rounded-xl border border-gray-200 hover:bg-red-50 hover:border-red-200 transition text-gray-500 hover:text-red-500"
                                            title="Remove"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Wishlist;
