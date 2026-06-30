import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import api from '../api/axios';

const Checkout = () => {
    const { cart } = useContext(CartContext);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        address: '',
        city: '',
        zipCode: '',
        paymentMethod: 'credit_card'
    });

    const handlePlaceOrder = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('orders/create_order/', formData);
            alert('Order placed successfully!');
            navigate('/');
        } catch (err) {
            alert('An error occurred while placing the order.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">Checkout</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-6 border rounded-lg shadow-sm">
                    <h2 className="text-xl font-bold mb-6">Shipping Information</h2>
                    <form onSubmit={handlePlaceOrder} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Full Address</label>
                            <input
                                type="text"
                                className="w-full p-2 border rounded mt-1"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">City</label>
                                <input
                                    type="text"
                                    className="w-full p-2 border rounded mt-1"
                                    value={formData.city}
                                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">ZIP Code</label>
                                <input
                                    type="text"
                                    className="w-full p-2 border rounded mt-1"
                                    value={formData.zipCode}
                                    onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                            <select
                                className="w-full p-2 border rounded mt-1"
                                value={formData.paymentMethod}
                                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                            >
                                <option value="credit_card">Credit Card</option>
                                <option value="paypal">PayPal</option>
                                <option value="cod">Cash on Delivery</option>
                            </select>
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700 transition disabled:bg-gray-400"
                        >
                            {loading ? 'Processing...' : 'Place Order'}
                        </button>
                    </form>
                </div>
                <div className="bg-white p-6 border rounded-lg shadow-sm h-fit">
                    <h2 className="text-xl font-bold mb-4">Order Summary</h2>
                    <div className="flex justify-between mb-4">
                        <span className="text-gray-600">Total Price</span>
                        <span className="text-xl font-bold">${cart.total_price}</span>
                    </div>
                    <div className="border-t pt-4 text-sm text-gray-500 italic">
                        Your order will be processed once payment is confirmed.
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;
