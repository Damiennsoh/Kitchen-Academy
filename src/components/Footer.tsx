"use client";

import { ChefHat, Instagram, Facebook, Youtube } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-chef-dark text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-brand-500 rounded-full flex items-center justify-center">
                <ChefHat className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold">Cooking with Chipo</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Zimbabwe&apos;s favorite online cooking school. Learn authentic recipes, 
              master new techniques, and join a community of passionate home cooks.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link href="/classes" className="text-gray-400 hover:text-brand-400 transition-colors">Upcoming Classes</Link></li>
              <li><Link href="/auth" className="text-gray-400 hover:text-brand-400 transition-colors">Student Login</Link></li>
              <li><a href="#" className="text-gray-400 hover:text-brand-400 transition-colors">Rosella Spices Shop</a></li>
              <li><a href="#" className="text-gray-400 hover:text-brand-400 transition-colors">Become an Affiliate</a></li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Follow Chipo</h3>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-brand-500 transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-brand-500 transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-brand-500 transition-colors">
                <Youtube className="w-5 h-5" />
              </a>
            </div>
            <p className="mt-4 text-gray-400 text-sm">
              472K followers • 7K+ students trained
            </p>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-white/10 text-center text-gray-500 text-sm">
          © {new Date().getFullYear()} Cooking with Chipo. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
