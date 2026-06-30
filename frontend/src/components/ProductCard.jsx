import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { CartContext } from '../context/CartContext';

const ProductCard = ({ product }) => {
    const { addToCart } = useContext(CartContext);

    // Resolve best image URL
    const imgUrl = (() => {
        if (product.images && product.images.length > 0) {
            const img = product.images[0].image;
            return img.startsWith('http') ? img : `http://127.0.0.1:8000${img}`;
        }
        if (product.image) {
            const img = typeof product.image === 'string' ? product.image : '';
            return img && img.startsWith('http') ? img : img ? `http://127.0.0.1:8000${img}` : null;
        }
        return null;
    })();

    // Resolve location display: prefer free-text (global) over old FK
    const locationDisplay = product.location_text
        || (product.location_detail ? `${product.location_detail.city}, ${product.location_detail.state}` : null);

    return (
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all group">
            {/* Image */}
            <div className="relative h-44 bg-gray-50 overflow-hidden">
                {imgUrl ? (
                    <img
                        src={imgUrl}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-200">
                        <svg className="w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                )}
                {product.condition && (
                    <span className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        product.condition === 'NEW' ? 'bg-green-500 text-white' :
                        product.condition === 'USED' ? 'bg-gray-500 text-white' :
                        'bg-yellow-500 text-white'
                    }`}>{product.condition}</span>
                )}
            </div>

            <div className="p-4">
                <p className="text-xs text-blue-500 font-semibold mb-0.5">{product.category_detail?.name || product.category || ''}</p>
                <h3 className="text-sm font-bold text-gray-800 leading-snug line-clamp-2 mb-2">{product.name}</h3>

                {/* Location pin */}
                {locationDisplay && (
                    <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                        <svg className="w-3 h-3 text-blue-400 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                        </svg>
                        <span className="truncate">{locationDisplay}</span>
                    </div>
                )}

                <div className="flex justify-between items-center mt-3">
                    <span className="text-lg font-extrabold text-blue-600">${product.price}</span>
                    <Link
                        to={`/product/${product.id}`}
                        className="text-xs text-gray-500 hover:text-blue-600 underline"
                    >
                        Details
                    </Link>
                </div>
                <button
                    onClick={() => addToCart(product.id)}
                    className="w-full mt-3 bg-blue-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition shadow-sm"
                >
                    Add to Cart
                </button>
            </div>
        </div>
    );
};

export default ProductCard;
