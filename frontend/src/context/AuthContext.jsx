import React, { createContext, useState, useEffect } from 'react';
import api from '../api/axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (token) {
            // Verify token or fetch user profile
            api.get('accounts/me/')
                .then(res => {
                    setUser(res.data);
                })
                .catch(() => {
                    localStorage.removeItem('access_token');
                })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (username, password) => {
        const res = await api.post('accounts/login/', { username, password });
        const { access, refresh } = res.data;
        localStorage.setItem('access_token', access);
        localStorage.setItem('refresh_token', refresh);
        // In a real app, we'd fetch user details here
        setUser({ username });
    };

    const logout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
