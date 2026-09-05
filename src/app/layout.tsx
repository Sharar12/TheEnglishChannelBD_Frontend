import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import BackgroundAnimation from "@/components/BackgroundAnimation";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "The English Channel BD",
  description: "Your premier destination for English literature, language courses, and educational resources",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <Toaster position="top-center" richColors duration={2000} />
              <div className="relative min-h-screen text-gray-900 font-sans">
                <BackgroundAnimation />
                <div className="relative z-10">
                  <Navbar />
                  <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {children}
                  </main>
                  <Footer />
                </div>
              </div>
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

import { Facebook, Youtube, Users as UsersIcon, Mail, Phone, CreditCard, Banknote } from 'lucide-react';

function Footer() {
  return (
    <footer className="mt-20 border-t border-gray-200 py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">
          {/* Left Column: Branding & Social */}
          <div className="col-span-1 md:col-span-4 lg:col-span-5">
            <h3 className="font-serif text-2xl font-bold text-gray-900 mb-4">The English Channel</h3>
            <p className="text-gray-500 mb-6">Master the English Language with Dhaka University’s Finest. Your premium destination for live courses and exclusive guidebooks.</p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 hover:bg-blue-600 hover:text-white transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-600 hover:bg-red-600 hover:text-white transition-colors">
                <Youtube className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 hover:bg-amber-600 hover:text-white transition-colors">
                <UsersIcon className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Middle Column: Quick Links */}
          <div className="col-span-1 md:col-span-4 lg:col-span-3">
            <h4 className="font-bold text-gray-900 mb-6 uppercase tracking-wider text-sm">Explore</h4>
            <ul className="space-y-3 text-gray-600 font-medium">
              <li><a href="/courses" className="hover:text-amber-600 transition-colors">All Courses</a></li>
              <li><a href="/shop" className="hover:text-amber-600 transition-colors">Books & Materials</a></li>
              <li><a href="/about" className="hover:text-amber-600 transition-colors">About the Principal</a></li>
              <li><a href="/privacy" className="hover:text-amber-600 transition-colors">Privacy Policy</a></li>
              <li><a href="/terms" className="hover:text-amber-600 transition-colors">Terms of Service</a></li>
            </ul>
          </div>

          {/* Right Column: Support & Payment */}
          <div className="col-span-1 md:col-span-4 lg:col-span-4">
            <h4 className="font-bold text-gray-900 mb-6 uppercase tracking-wider text-sm">Need Help?</h4>
            <ul className="space-y-4 text-gray-600 mb-8">
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"><Phone className="w-4 h-4 text-gray-600" /></div>
                <span>+880 1234 567 890</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"><Mail className="w-4 h-4 text-gray-600" /></div>
                <span>support@theenglishchannel.com</span>
              </li>
            </ul>
            
            <h4 className="font-bold text-gray-900 mb-4 uppercase tracking-wider text-sm">Accepted Payments</h4>
            <div className="flex gap-3">
               <div className="px-3 py-1.5 border border-gray-200 rounded flex items-center gap-2 text-xs font-bold text-gray-700 bg-gray-50">
                 <Banknote className="w-4 h-4 text-pink-500" /> bKash
               </div>
               <div className="px-3 py-1.5 border border-gray-200 rounded flex items-center gap-2 text-xs font-bold text-gray-700 bg-gray-50">
                 <Banknote className="w-4 h-4 text-orange-500" /> Nagad
               </div>
               <div className="px-3 py-1.5 border border-gray-200 rounded flex items-center gap-2 text-xs font-bold text-gray-700 bg-gray-50">
                 <CreditCard className="w-4 h-4 text-blue-600" /> Cards
               </div>
            </div>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500 font-medium">
            © {new Date().getFullYear()} The English Channel. All rights reserved.
          </p>
          <p className="text-sm text-gray-400">
            Designed for Excellence.
          </p>
        </div>
      </div>
    </footer>
  );
}