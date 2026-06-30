import React from 'react';

const Footer = () => {
    return (
        <footer className="bg-gray-800 text-white p-8 mt-auto text-center">
            <div className="container mx-auto">
                <p>&copy; {new Date().getFullYear()} ShopEase. All rights reserved.</p>
                <div className="flex justify-center space-x-4 mt-2 text-gray-400 text-sm">
                    <a href="#" className="hover:text-white">Privacy Policy</a>
                    <a href="#" className="hover:text-white">Terms of Service</a>
                    <a href="#" className="hover:text-white">Contact Us</a>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
