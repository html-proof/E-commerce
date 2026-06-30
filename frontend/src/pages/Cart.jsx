import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { CartContext } from '../context/CartContext';

const Cart = () => {
    const { cart, removeFromCart, loading } = useContext(CartContext);

    if (loading) return <div className="flex justify-center items-center h-screen">Loading cart...</div>;

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">Your Shopping Cart</h1>

            {cart.items.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-gray-500 mb-4">Your cart is currently empty.</p>
                    <Link to="/" className="text-blue-600 hover:underline">Go back to shopping</Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-4">
                        {cart.items.map(item => (
                            <div key={item.id} className="flex items-center justify-between bg-white p-4 border rounded-lg shadow-sm">
                                <div className="flex items-center space-x-4">
                                    <img
                                        src={item.product.image || 'https://via.placeholder.com/150'}
                                        className="w-16 h-16 object-cover rounded"
                                        alt={item.product_name}
                                    />
                                    <div>
                                        <h3 className="font-semibold">{item.product_name}</h3>
                                        <p className="text-gray-500 text-sm">${item.product_price} x {item.quantity}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => removeFromCart(item.product)}
                                    className="text-red-500 hover:text-red-700 text-sm font-medium"
                                >
                                    Remove
                                </button>
                            </div>
                        ))}
                    </div>
                    <div className="bg-white p-6 border rounded-lg shadow-sm h-fit">
                        <h2 className="text-xl font-bold mb-4">Order Summary</h2>
                        <div className="flex justify-between mb-4">
                            <span className="text-gray-600">Total Price</span>
                            <span className="text-xl font-bold">${cart.total_price}</span>
                        </div>
                        <Link
                            to="/checkout"
                            className="block w-full text-center bg-blue-600 text-white py-3 rounded hover:bg-blue-700 transition"
                        >
                            Proceed to Checkout
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Cart;
