import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        total_users: 0,
        total_products: 0,
        total_orders: 0,
        total_revenue: 0
    });
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAdminData = async () => {
            try {
                const statsRes = await api.get('orders/admin/orders/stats/');
                setStats(statsRes.data);

                const ordersRes = await api.get('orders/admin/orders/');
                setOrders(ordersRes.data);
            } catch (err) {
                console.error('Error fetching admin data:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchAdminData();
    }, []);

    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            await api.patch(`orders/admin/orders/${orderId}/`, { status: newStatus });
            // Refresh orders list
            const res = await api.get('orders/admin/orders/');
            setOrders(res.data);
        } catch (err) {
            alert('Failed to update order status');
        }
    };

    if (loading) return <div className="flex justify-center items-center h-screen">Loading admin dashboard...</div>;

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                <div className="bg-white p-6 rounded-lg shadow-sm border text-center">
                    <p className="text-gray-500 mb-2">Total Users</p>
                    <p className="text-3xl font-bold">{stats.total_users}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border text-center">
                    <p className="text-gray-500 mb-2">Total Products</p>
                    <p className="text-3xl font-bold">{stats.total_products}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border text-center">
                    <p className="text-gray-500 mb-2">Total Orders</p>
                    <p className="text-3xl font-bold">{stats.total_orders}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border text-center">
                    <p className="text-gray-500 mb-2">Revenue</p>
                    <p className="text-3xl font-bold">${stats.total_revenue}</p>
                </div>
            </div>

            <div className="bg-white p-6 border rounded-lg shadow-sm">
                <h2 className="text-xl font-bold mb-6">All Orders</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b text-gray-600">
                                <th className="py-3 px-4">Order ID</th>
                                <th className="py-3 px-4">User</th>
                                <th className="py-3 px-4">Total</th>
                                <th className="py-3 px-4">Status</th>
                                <th className="py-3 px-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map(order => (
                                <tr key={order.id} className="border-b hover:bg-gray-50">
                                    <td className="py-3 px-4">#{order.id}</td>
                                    <td className="py-3 px-4">{order.user}</td>
                                    <td className="py-3 px-4">${order.total_price}</td>
                                    <td className="py-3 px-4">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                                            order.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                                            order.status === 'Shipped' ? 'bg-blue-100 text-blue-700' :
                                            'bg-yellow-100 text-yellow-700'
                                        }`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4">
                                        <select
                                            value={order.status}
                                            onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                            className="text-sm border rounded p-1"
                                        >
                                            <option value="Pending">Pending</option>
                                            <option value="Processing">Processing</option>
                                            <option value="Shipped">Shipped</option>
                                            <option value="Delivered">Delivered</option>
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
