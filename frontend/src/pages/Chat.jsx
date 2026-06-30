import React, { useState, useEffect, useRef, useContext } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';

const OfferWidget = ({ conversation, onMakeOffer, onAccept, onReject, onCounter }) => {
    const [amount, setAmount] = useState('');
    const [counterAmount, setCounterAmount] = useState('');
    const [showCounter, setShowCounter] = useState(false);
    
    if (!conversation.product) return null;
    
    const offer = conversation.active_offer;

    if (!offer) {
        return (
            <div className="bg-blue-50 border-b border-blue-100 p-3 flex items-center justify-between shadow-sm flex-wrap gap-2">
                <div className="text-sm text-blue-800">
                    <span className="font-semibold">Interested?</span> Make an offer to negotiate the price.
                </div>
                <div className="flex items-center gap-2">
                    <input 
                        type="number" 
                        value={amount} 
                        onChange={e => setAmount(e.target.value)}
                        placeholder="Amount"
                        className="border border-blue-200 rounded px-2 py-1.5 text-sm w-24 outline-none focus:border-blue-400 bg-white"
                    />
                    <button 
                        onClick={() => { onMakeOffer(amount); setAmount(''); }}
                        disabled={!amount}
                        className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                        Make Offer
                    </button>
                </div>
            </div>
        );
    }

    const { status, amount: offerAmount, is_received, sender_username } = offer;

    return (
        <div className={`p-3 border-b shadow-sm flex items-center justify-between flex-wrap gap-2 transition-colors ${
            status === 'ACCEPTED' ? 'bg-green-50 border-green-200' : 
            status === 'REJECTED' ? 'bg-red-50 border-red-200' : 
            'bg-yellow-50 border-yellow-200'
        }`}>
            <div className="text-sm text-gray-800">
                {status === 'PENDING' || status === 'COUNTERED' ? (
                    is_received ? (
                        <span><span className="font-semibold">{sender_username}</span> made an offer of <span className="font-bold text-yellow-700">${offerAmount}</span></span>
                    ) : (
                        <span>You made an offer of <span className="font-bold text-yellow-700">${offerAmount}</span>. Waiting for response...</span>
                    )
                ) : status === 'ACCEPTED' ? (
                    <span>Offer of <span className="font-bold text-green-700">${offerAmount}</span> was <span className="font-bold text-green-700">ACCEPTED</span>!</span>
                ) : status === 'REJECTED' ? (
                    <span>Offer of <span className="font-bold text-red-700">${offerAmount}</span> was <span className="font-bold text-red-700">REJECTED</span>.</span>
                ) : (
                    <span>Offer status: {status}</span>
                )}
            </div>
            
            <div className="flex items-center gap-2">
                {(status === 'PENDING' || status === 'COUNTERED') && is_received && !showCounter && (
                    <>
                        <button onClick={() => onAccept(offer.id)} className="bg-green-600 text-white px-3 py-1.5 rounded text-sm font-semibold hover:bg-green-700 transition-colors">Accept</button>
                        <button onClick={() => onReject(offer.id)} className="bg-red-600 text-white px-3 py-1.5 rounded text-sm font-semibold hover:bg-red-700 transition-colors">Reject</button>
                        <button onClick={() => setShowCounter(true)} className="bg-yellow-500 text-white px-3 py-1.5 rounded text-sm font-semibold hover:bg-yellow-600 transition-colors">Counter</button>
                    </>
                )}
                {showCounter && (
                    <div className="flex items-center gap-2">
                        <input 
                            type="number" 
                            value={counterAmount} 
                            onChange={e => setCounterAmount(e.target.value)}
                            placeholder="New Amount"
                            className="border border-yellow-300 rounded px-2 py-1.5 text-sm w-24 outline-none focus:border-yellow-500 bg-white"
                        />
                        <button 
                            onClick={() => { onCounter(offer.id, counterAmount); setShowCounter(false); setCounterAmount(''); }}
                            disabled={!counterAmount}
                            className="bg-yellow-600 text-white px-3 py-1.5 rounded text-sm font-semibold hover:bg-yellow-700 disabled:opacity-50 transition-colors"
                        >
                            Send
                        </button>
                        <button onClick={() => setShowCounter(false)} className="text-gray-500 text-sm hover:underline">Cancel</button>
                    </div>
                )}
                {status === 'ACCEPTED' && (
                    <Link to={`/product/${conversation.product}`} className="bg-green-600 text-white px-3 py-1.5 rounded text-sm font-semibold hover:bg-green-700 transition-colors shadow-sm">
                        View Product
                    </Link>
                )}
            </div>
        </div>
    );
};

const Chat = () => {
    const { user } = useContext(AuthContext);
    const location = useLocation();
    const navigate = useNavigate();

    const [conversations, setConversations] = useState([]);
    const [activeConversation, setActiveConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [messagesLoading, setMessagesLoading] = useState(false);

    const wsRef = useRef(null);
    const bottomRef = useRef(null);
    const inputRef = useRef(null);

    // Fetch conversations on mount
    useEffect(() => {
        if (!user) { navigate('/login'); return; }
        fetchConversations();
    }, [user]);

    // Auto-select conversation passed via navigation state
    useEffect(() => {
        if (location.state?.conversationId && conversations.length > 0) {
            const conv = conversations.find(c => c.id === location.state.conversationId);
            if (conv) openConversation(conv);
        }
    }, [conversations, location.state]);

    // Scroll to bottom when messages change
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const fetchConversations = async () => {
        setLoading(true);
        try {
            const res = await api.get('chat/conversations/');
            setConversations(res.data);
        } catch (err) {
            console.error('Failed to fetch conversations', err);
        } finally {
            setLoading(false);
        }
    };

    const openConversation = async (conv) => {
        // Close existing WebSocket
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }

        setActiveConversation(conv);
        setMessages([]);
        setMessagesLoading(true);

        try {
            const res = await api.get(`chat/conversations/${conv.id}/messages/`);
            setMessages(res.data);
        } catch (err) {
            console.error('Failed to fetch messages', err);
        } finally {
            setMessagesLoading(false);
        }

        // Open WebSocket
        const token = localStorage.getItem('access_token');
        const ws = new WebSocket(`ws://127.0.0.1:8000/ws/chat/${conv.id}/?token=${token}`);

        ws.onopen = () => console.log('WebSocket connected');
        ws.onmessage = (e) => {
            const data = JSON.parse(e.data);
            if (data.type === 'offer_update') {
                setActiveConversation(prev => prev ? { ...prev, active_offer: data.offer } : prev);
                setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, active_offer: data.offer } : c));
            } else {
                setMessages(prev => [...prev, data]);
                setConversations(prev => prev.map(c => 
                    c.id === conv.id 
                        ? { ...c, last_message: { content: data.content, sender_username: data.sender_username, created_at: data.created_at } } 
                        : c
                ));
            }
        };
        ws.onerror = (e) => console.error('WebSocket error', e);
        ws.onclose = () => console.log('WebSocket closed');

        wsRef.current = ws;
        inputRef.current?.focus();
    };

    const sendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
        wsRef.current.send(JSON.stringify({ message: newMessage.trim() }));
        setNewMessage('');
    };

    const handleMakeOffer = async (amount) => {
        try {
            const res = await api.post(`chat/conversations/${activeConversation.id}/offers/`, { amount });
            setActiveConversation(prev => ({ ...prev, active_offer: res.data }));
            setConversations(prev => prev.map(c => c.id === activeConversation.id ? { ...c, active_offer: res.data } : c));
        } catch (err) {
            console.error('Failed to make offer', err);
            alert(err.response?.data?.error || 'Failed to make offer');
        }
    };

    const handleAcceptOffer = async (offerId) => {
        try {
            const res = await api.post(`chat/offers/${offerId}/accept/`);
            setActiveConversation(prev => ({ ...prev, active_offer: res.data }));
            setConversations(prev => prev.map(c => c.id === activeConversation.id ? { ...c, active_offer: res.data } : c));
        } catch (err) {
            console.error('Failed to accept offer', err);
            alert(err.response?.data?.error || 'Failed to accept offer');
        }
    };

    const handleRejectOffer = async (offerId) => {
        try {
            const res = await api.post(`chat/offers/${offerId}/reject/`);
            setActiveConversation(prev => ({ ...prev, active_offer: res.data }));
            setConversations(prev => prev.map(c => c.id === activeConversation.id ? { ...c, active_offer: res.data } : c));
        } catch (err) {
            console.error('Failed to reject offer', err);
            alert(err.response?.data?.error || 'Failed to reject offer');
        }
    };

    const handleCounterOffer = async (offerId, amount) => {
        try {
            const res = await api.post(`chat/offers/${offerId}/counter/`, { amount });
            setActiveConversation(prev => ({ ...prev, active_offer: res.data }));
            setConversations(prev => prev.map(c => c.id === activeConversation.id ? { ...c, active_offer: res.data } : c));
        } catch (err) {
            console.error('Failed to counter offer', err);
            alert(err.response?.data?.error || 'Failed to counter offer');
        }
    };

    const formatTime = (isoStr) => {
        const date = new Date(isoStr);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (isoStr) => {
        const date = new Date(isoStr);
        const today = new Date();
        if (date.toDateString() === today.toDateString()) return 'Today';
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    if (!user) return null;

    return (
        <div className="flex h-[calc(100vh-64px)] bg-gray-100">
            {/* Sidebar - Conversation List */}
            <div className="w-80 bg-white border-r border-gray-200 flex flex-col shadow-sm flex-shrink-0">
                {/* Sidebar Header */}
                <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600">
                    <h2 className="text-lg font-bold text-white">Messages</h2>
                    <p className="text-blue-100 text-xs mt-0.5">Your conversations</p>
                </div>

                {/* Conversation List */}
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center h-32">
                            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : conversations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 text-gray-400 px-4 text-center">
                            <svg className="w-12 h-12 mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                            </svg>
                            <p className="text-sm">No conversations yet.</p>
                            <p className="text-xs mt-1">Browse products and click "Chat with Seller".</p>
                        </div>
                    ) : (
                        conversations.map(conv => (
                            <button
                                key={conv.id}
                                onClick={() => openConversation(conv)}
                                className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-blue-50 transition-colors relative flex items-start gap-3 ${activeConversation?.id === conv.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}
                            >
                                {/* Avatar */}
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                    {conv.other_user?.username?.[0]?.toUpperCase() || '?'}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <span className="font-semibold text-gray-800 text-sm truncate">
                                            {conv.other_user?.username || 'Unknown'}
                                        </span>
                                        {conv.last_message && (
                                            <span className="text-xs text-gray-400 ml-1 flex-shrink-0">
                                                {formatDate(conv.last_message.created_at)}
                                            </span>
                                        )}
                                    </div>
                                    {conv.product_name && (
                                        <p className="text-xs text-blue-500 truncate">re: {conv.product_name}</p>
                                    )}
                                    {conv.last_message ? (
                                        <p className="text-xs text-gray-500 truncate mt-0.5">{conv.last_message.content}</p>
                                    ) : (
                                        <p className="text-xs text-gray-400 italic mt-0.5">No messages yet</p>
                                    )}
                                </div>

                                {/* Unread badge */}
                                {conv.unread_count > 0 && (
                                    <span className="absolute top-3 right-3 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                                        {conv.unread_count}
                                    </span>
                                )}
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {activeConversation ? (
                    <>
                        {/* Chat Header */}
                        <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-4 shadow-sm">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold">
                                {activeConversation.other_user?.username?.[0]?.toUpperCase()}
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-800">{activeConversation.other_user?.username}</h3>
                                {activeConversation.product_name && (
                                    <p className="text-xs text-blue-500">
                                        About: {activeConversation.product_name}
                                        {activeConversation.product_price && ` · $${activeConversation.product_price}`}
                                    </p>
                                )}
                            </div>
                            <div className="ml-auto">
                                <span className="inline-flex items-center gap-1.5 text-xs text-green-600 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                                    Live Chat
                                </span>
                            </div>
                        </div>

                        {/* Offer Widget */}
                        <OfferWidget 
                            conversation={activeConversation}
                            onMakeOffer={handleMakeOffer}
                            onAccept={handleAcceptOffer}
                            onReject={handleRejectOffer}
                            onCounter={handleCounterOffer}
                        />

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                            {messagesLoading ? (
                                <div className="flex items-center justify-center h-full">
                                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                    <svg className="w-16 h-16 mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                    </svg>
                                    <p className="text-sm font-medium">No messages yet</p>
                                    <p className="text-xs mt-1">Start the conversation below!</p>
                                </div>
                            ) : (
                                messages.map((msg, idx) => {
                                    const isOwn = msg.sender_id === user.id || msg.sender_username === user.username;
                                    const prevMsg = messages[idx - 1];
                                    const showTime = !prevMsg || (new Date(msg.created_at) - new Date(prevMsg.created_at)) > 5 * 60 * 1000;

                                    return (
                                        <div key={msg.id || idx}>
                                            {showTime && (
                                                <div className="text-center text-xs text-gray-400 my-2">
                                                    {formatDate(msg.created_at)} at {formatTime(msg.created_at)}
                                                </div>
                                            )}
                                            <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                                {!isOwn && (
                                                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold mr-2 mt-1 flex-shrink-0">
                                                        {msg.sender_username?.[0]?.toUpperCase()}
                                                    </div>
                                                )}
                                                <div className={`max-w-xs lg:max-w-md xl:max-w-lg ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                                                    <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                                                        isOwn
                                                            ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-br-sm'
                                                            : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm'
                                                    }`}>
                                                        {msg.content}
                                                    </div>
                                                    <span className="text-xs text-gray-400 mt-1 px-1">
                                                        {formatTime(msg.created_at)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={bottomRef} />
                        </div>

                        {/* Message Input */}
                        <form onSubmit={sendMessage} className="bg-white border-t border-gray-200 px-6 py-4">
                            <div className="flex items-center gap-3 bg-gray-100 rounded-full px-4 py-2">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    className="flex-1 bg-transparent outline-none text-sm text-gray-800 placeholder-gray-400"
                                    placeholder="Type a message..."
                                    value={newMessage}
                                    onChange={e => setNewMessage(e.target.value)}
                                />
                                <button
                                    type="submit"
                                    disabled={!newMessage.trim()}
                                    className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white disabled:opacity-40 transition-opacity hover:shadow-md"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                    </svg>
                                </button>
                            </div>
                        </form>
                    </>
                ) : (
                    /* Empty State */
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center mb-4">
                            <svg className="w-12 h-12 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-600">Your Messages</h3>
                        <p className="text-sm mt-1 text-center max-w-xs">
                            Select a conversation from the left, or find a product and click "Chat with Seller".
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Chat;
