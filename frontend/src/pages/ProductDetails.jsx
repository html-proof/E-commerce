import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';

const ProductDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToCart } = useContext(CartContext);
    const { user } = useContext(AuthContext);
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [chatLoading, setChatLoading] = useState(false);
    
    // Gallery state
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    // Variant state
    const [selectedVariant, setSelectedVariant] = useState(null);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const res = await api.get(`products/${id}/`);
                setProduct(res.data);
                
                // If product has variants, set the first one as default or keep null for base product
                if (res.data.variants && res.data.variants.length > 0) {
                    // Default to none selected or select the first
                    // Let's keep null initially to represent the base product, or select first.
                    // For better UX, we can default to the first variant.
                    setSelectedVariant(res.data.variants[0]);
                }
            } catch (err) {
                setError('Product not found.');
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [id]);

    const handleChatWithSeller = async () => {
        if (!user) { navigate('/login'); return; }
        setChatLoading(true);
        try {
            const res = await api.post('chat/conversations/start/', { product_id: product.id });
            navigate('/chat', { state: { conversationId: res.data.id } });
        } catch (err) {
            console.error('Could not start conversation', err);
        } finally {
            setChatLoading(false);
        }
    };

    const isSeller = user && product && user.username === product.seller_username;

    if (loading) return <div className="flex justify-center items-center h-screen">Loading product...</div>;
    if (error) return <div className="flex justify-center items-center h-screen text-red-500">{error}</div>;

    // Collect all gallery images
    const allImages = [];
    if (product.images && product.images.length > 0) {
        product.images.forEach(img => {
            const url = img.image.startsWith('http') ? img.image : `http://127.0.0.1:8000${img.image}`;
            allImages.push(url);
        });
    } else if (product.image) {
        const url = product.image.startsWith('http') ? product.image : `http://127.0.0.1:8000${product.image}`;
        allImages.push(url);
    } else {
        allImages.push('https://via.placeholder.com/400');
    }

    // Determine price and stock based on variant selection
    const displayPrice = selectedVariant && selectedVariant.price_override !== null
        ? selectedVariant.price_override
        : product.price;

    const displayStock = selectedVariant
        ? selectedVariant.stock
        : product.stock;

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 bg-white p-8 rounded-2xl border border-gray-100 shadow-lg">
                {/* Left side: Gallery */}
                <div className="space-y-4">
                    <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden border border-gray-100 bg-gray-50 flex items-center justify-center relative group">
                        <img
                            src={allImages[activeImageIndex]}
                            alt={product.name}
                            className="max-h-full max-w-full object-contain"
                        />
                        
                        {allImages.length > 1 && (
                            <>
                                <button 
                                    onClick={() => setActiveImageIndex(prev => prev === 0 ? allImages.length - 1 : prev - 1)}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2.5 rounded-full shadow-md hover:scale-105 transition-all opacity-0 group-hover:opacity-100"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                                <button 
                                    onClick={() => setActiveImageIndex(prev => prev === allImages.length - 1 ? 0 : prev + 1)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2.5 rounded-full shadow-md hover:scale-105 transition-all opacity-0 group-hover:opacity-100"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </>
                        )}
                    </div>

                    {/* Gallery Thumbnails */}
                    {allImages.length > 1 && (
                        <div className="flex gap-3 overflow-x-auto py-2">
                            {allImages.map((img, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setActiveImageIndex(idx)}
                                    className={`w-20 h-16 rounded-lg overflow-hidden border-2 bg-gray-50 flex-shrink-0 transition-all ${
                                        idx === activeImageIndex ? 'border-blue-600 shadow' : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                >
                                    <img src={img} alt={`thumb-${idx}`} className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right side: Info */}
                <div className="flex flex-col justify-between">
                    <div>
                        {/* Tags */}
                        <div className="flex flex-wrap gap-2 mb-4">
                            <span className="text-blue-700 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full text-xs font-semibold">
                                {product.category_detail?.name || product.category || 'Product'}
                            </span>
                            {product.brand_detail && (
                                <span className="text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full text-xs font-semibold">
                                    {product.brand_detail.name}
                                </span>
                            )}
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${
                                product.condition === 'NEW' ? 'text-green-700 bg-green-50 border border-green-100' :
                                product.condition === 'REFURBISHED' ? 'text-yellow-700 bg-yellow-50 border border-yellow-100' :
                                'text-gray-700 bg-gray-50 border border-gray-100'
                            }`}>
                                Condition: {product.condition}
                            </span>
                            <span className="text-purple-700 bg-purple-50 border border-purple-100 px-3 py-1 rounded-full text-xs font-semibold">
                                {product.listing_type === 'CLASSIFIED' ? 'Classified/Negotiable' : 'Fixed Price'}
                            </span>
                            {product.is_digital && (
                                <span className="text-red-700 bg-red-50 border border-red-100 px-3 py-1 rounded-full text-xs font-semibold">
                                    💻 Digital Item
                                </span>
                            )}
                        </div>

                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">{product.name}</h1>
                        
                        {product.model_name && (
                            <p className="text-sm text-gray-500 mb-4">Model: <span className="font-semibold text-gray-700">{product.model_name}</span></p>
                        )}

                        <div className="flex items-center space-x-6 border-b border-gray-100 pb-6 mb-6">
                            <span className="text-3xl font-black text-blue-600">${displayPrice}</span>
                            {product.seller_username && (
                                <span className="text-sm text-gray-500">
                                    Seller: <strong className="text-gray-800 font-semibold">{product.seller_username}</strong>
                                </span>
                            )}
                            {(product.location_text || product.location_detail) && (
                                <span className="text-sm text-gray-500 flex items-center gap-1">
                                    📍 {product.location_text || `${product.location_detail.city}, ${product.location_detail.state}`}
                                </span>
                            )}
                        </div>

                        {/* Variants Selector */}
                        {product.variants && product.variants.length > 0 && (
                            <div className="mb-6 bg-gray-50 p-4 rounded-xl border border-gray-200/60">
                                <label className="block text-sm font-bold text-gray-700 mb-2">Available Options / Variants</label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {product.variants.map((v) => (
                                        <button
                                            key={v.id}
                                            type="button"
                                            onClick={() => setSelectedVariant(v)}
                                            className={`p-3 rounded-lg border text-left text-sm transition-all ${
                                                selectedVariant?.id === v.id
                                                    ? 'border-blue-600 bg-blue-50/50 shadow-sm ring-1 ring-blue-600'
                                                    : 'border-gray-200 bg-white hover:border-gray-300'
                                            }`}
                                        >
                                            <div className="font-semibold text-gray-800">
                                                {v.size && `Size: ${v.size}`} {v.color && `${v.size ? '| ' : ''}Color: ${v.color}`}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1 flex justify-between">
                                                <span>{v.stock > 0 ? `${v.stock} in stock` : 'Out of stock'}</span>
                                                {v.price_override && <span className="font-bold text-blue-600">${v.price_override}</span>}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <p className="text-gray-700 mb-8 leading-relaxed whitespace-pre-line">{product.description}</p>
                    </div>

                    <div className="space-y-4 pt-6 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                            <span className={`text-sm font-semibold ${displayStock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                {displayStock > 0 ? `In Stock: ${displayStock} available` : 'Out of stock'}
                            </span>
                            <button
                                onClick={() => addToCart(product.id)}
                                disabled={displayStock <= 0}
                                className="bg-blue-600 text-white px-8 py-3 rounded-xl hover:bg-blue-700 transition font-bold shadow hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Add to Cart
                            </button>
                        </div>

                        {!isSeller && product.seller && (
                            <button
                                onClick={handleChatWithSeller}
                                disabled={chatLoading}
                                className="w-full flex items-center justify-center gap-2 bg-white border-2 border-blue-600 text-blue-600 px-8 py-3 rounded-xl hover:bg-blue-50 transition font-bold disabled:opacity-50"
                            >
                                {chatLoading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                        Connecting...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                        </svg>
                                        Chat with Seller (Make Offer)
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetails;
