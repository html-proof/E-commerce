import React, { createContext, useState, useEffect } from 'react';
import api from '../api/axios';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState({
        items: [],
        total_price: 0
    });
    const [loading, setLoading] = useState(true);

    const fetchCart = async () => {
        const token = localStorage.getItem('access_token');
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            const res = await api.get('orders/cart/current/');
            setCart(res.data);
        } catch (err) {
            if (err.response && err.response.status !== 401) {
                console.error('Error fetching cart:', err);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCart();
    }, []);

    const addToCart = async (productId, quantity = 1) => {
        const token = localStorage.getItem('access_token');
        if (!token) {
            alert('Please login to add items to cart');
            return;
        }

        try {
            await api.post('orders/cart/add/', { product_id: productId, quantity });
            await fetchCart();
        } catch (err) {
            console.error('Error adding to cart:', err);
        }
    };

    const removeFromCart = async (productId) => {
        try {
            await api.delete('orders/cart/remove/', { data: { product_id: productId } });
            await fetchCart();
        } catch (err) {
            console.error('Error removing from cart:', err);
        }
    };

    return (
        <CartContext.Provider value={{ cart, addToCart, removeFromCart, fetchCart, loading }}>
            {children}
        </CartContext.Provider>
    );
};
