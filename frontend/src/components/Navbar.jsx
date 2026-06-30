import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const { cart } = useContext(CartContext);

    return (
        <nav className="bg-white shadow-md p-4 flex justify-between items-center px-8">
            <Link to="/" className="text-2xl font-bold text-blue-600">ShopEase</Link>

            <div className="flex items-center space-x-6">
                <Link to="/" className="text-gray-600 hover:text-blue-600">Home</Link>
                <Link to="/cart" className="text-gray-600 hover:text-blue-600 relative">
                    Cart
                    {cart.items.length > 0 && (
                        <span className="absolute -top-2 -right-4 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                            {cart.items.length}
                        </span>
                    )}
                </Link>

                {user ? (
                    <div className="flex items-center space-x-4">
                        <Link to="/post-product" className="text-gray-600 hover:text-blue-600 font-medium">Sell</Link>
                        <Link to="/wishlist" className="text-gray-600 hover:text-blue-600 font-medium flex items-center gap-1">
                            <svg className="w-4 h-4 text-red-500 fill-current" viewBox="0 0 24 24">
                                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                            </svg>
                            Wishlist
                        </Link>
                        <Link to="/dashboard" className="text-gray-600 hover:text-blue-600 font-medium flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            Dashboard
                        </Link>
                        <Link to="/chat" className="text-gray-600 hover:text-blue-600 font-medium flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                            </svg>
                            Messages
                        </Link>
                        <span className="text-gray-700">Hello, {user.username}</span>
                        <button
                            onClick={logout}
                            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
                        >
                            Logout
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center space-x-4">
                        <Link to="/login" className="text-gray-600 hover:text-blue-600">Login</Link>
                        <Link to="/register" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
                            Register
                        </Link>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
