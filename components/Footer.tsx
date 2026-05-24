"use client";

import React from "react";
import Link from "next/link";
import { 
  BarChart3, Mail, Phone, MapPin, ShieldCheck
} from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-zinc-200 text-zinc-600 dark:bg-zinc-950 dark:border-zinc-900 dark:text-zinc-400 font-sans mt-16 transition-colors duration-200">
      
      {/* Newsletter / Upper Banner Section */}
      <div className="border-b border-zinc-200 dark:border-zinc-900 py-8 px-4 sm:px-6 lg:px-8 mx-auto max-w-7xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="max-w-md">
            <h4 className="text-base font-black text-zinc-950 dark:text-zinc-50">
              Subscribe to Best Price Alerts!
            </h4>
            <p className="text-xs text-zinc-400 mt-1">
              Get notified of the biggest price drops, discount coupon codes, and live hot deals directly in your inbox.
            </p>
          </div>
          <div className="flex w-full md:w-auto max-w-md gap-2.5">
            <input
              type="email"
              placeholder="Enter your email address"
              className="flex-1 min-w-[200px] rounded-lg border border-zinc-300 bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800 px-4 py-2 text-sm text-black dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-[#2874f0]"
            />
            <button className="rounded-lg bg-[#2874f0] px-5 py-2 text-sm font-bold text-white shadow-sm hover:bg-blue-600 transition-all cursor-pointer">
              Subscribe
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
        
        {/* Brand / Intro Column */}
        <div className="col-span-2 flex flex-col gap-4">
          <Link href="/" className="flex flex-col select-none max-w-max">
            <span className="text-lg font-black italic tracking-wide leading-none text-[#2874f0] dark:text-[#2874f0]">
              Trendify
            </span>
            <span className="flex items-center gap-0.5 text-[10px] font-bold italic text-emerald-600 dark:text-emerald-500 leading-none mt-0.5">
              Explore <span className="text-zinc-800 dark:text-zinc-300 font-black">Comparator</span>
              <span className="inline-block text-[8px] font-black leading-none">+</span>
            </span>
          </Link>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 leading-relaxed max-w-sm">
            Trendify is a real-time price comparator engine pulling live product data from top global and local e-commerce stores using Serper.dev. We scan rates, compare shipping and warranty, and rank the absolute cheapest deals for you instantly.
          </p>
          <div className="flex items-center gap-3 text-zinc-400">
            <a href="#" className="hover:text-[#2874f0] transition-colors" title="Twitter">
              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
            <a href="#" className="hover:text-[#2874f0] transition-colors" title="Facebook">
              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.8z"/>
              </svg>
            </a>
            <a href="#" className="hover:text-[#2874f0] transition-colors" title="Instagram">
              <svg className="h-4 w-4 stroke-current fill-none stroke-[2]" viewBox="0 0 24 24">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
            </a>
            <a href="#" className="hover:text-[#2874f0] transition-colors" title="GitHub">
              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
              </svg>
            </a>
          </div>
        </div>

        {/* Categories Column */}
        <div className="flex flex-col gap-3">
          <h5 className="text-xs font-black uppercase tracking-wider text-zinc-950 dark:text-zinc-50">
            Categories
          </h5>
          <ul className="flex flex-col gap-2 text-xs">
            <li><Link href="/category/mobiles" className="hover:text-[#2874f0] transition-colors">Mobiles</Link></li>
            <li><Link href="/category/laptops" className="hover:text-[#2874f0] transition-colors">Laptops</Link></li>
            <li><Link href="/category/electronics" className="hover:text-[#2874f0] transition-colors">Electronics</Link></li>
            <li><Link href="/category/fashion" className="hover:text-[#2874f0] transition-colors">Fashion</Link></li>
            <li><Link href="/category/home" className="hover:text-[#2874f0] transition-colors">Home & Kitchen</Link></li>
            <li><Link href="/category/books" className="hover:text-[#2874f0] transition-colors">Books Directory</Link></li>
            <li><Link href="/category/beauty" className="hover:text-[#2874f0] transition-colors">Beauty & Care</Link></li>
            <li><Link href="/category/sports" className="hover:text-[#2874f0] transition-colors">Sports & Gym</Link></li>
          </ul>
        </div>

        {/* Stores Column */}
        <div className="flex flex-col gap-3">
          <h5 className="text-xs font-black uppercase tracking-wider text-zinc-950 dark:text-zinc-50">
            Stores Tracked
          </h5>
          <ul className="flex flex-col gap-2 text-xs">
            <li><a href="#" className="hover:text-[#2874f0] transition-colors">Amazon US & India</a></li>
            <li><a href="#" className="hover:text-[#2874f0] transition-colors">Flipkart India</a></li>
            <li><a href="#" className="hover:text-[#2874f0] transition-colors">Walmart Canada</a></li>
            <li><a href="#" className="hover:text-[#2874f0] transition-colors">Best Buy USA</a></li>
            <li><a href="#" className="hover:text-[#2874f0] transition-colors">Target Stores</a></li>
            <li><a href="#" className="hover:text-[#2874f0] transition-colors">Croma Digital</a></li>
            <li><a href="#" className="hover:text-[#2874f0] transition-colors">Reliance Retail</a></li>
            <li><a href="#" className="hover:text-[#2874f0] transition-colors">JB Hi-Fi Australia</a></li>
          </ul>
        </div>

        {/* Support & Legal Column */}
        <div className="flex flex-col gap-3">
          <h5 className="text-xs font-black uppercase tracking-wider text-zinc-950 dark:text-zinc-50">
            Support & Help
          </h5>
          <ul className="flex flex-col gap-2 text-xs">
            <li><a href="#" className="hover:text-[#2874f0] transition-colors">Frequently Asked FAQs</a></li>
            <li><a href="#" className="hover:text-[#2874f0] transition-colors">API Partnerships</a></li>
            <li><a href="#" className="hover:text-[#2874f0] transition-colors">Merchant Integration</a></li>
            <li><a href="#" className="hover:text-[#2874f0] transition-colors">Contact Support</a></li>
            <li><a href="#" className="hover:text-[#2874f0] transition-colors">Privacy Policy</a></li>
            <li><a href="#" className="hover:text-[#2874f0] transition-colors">Terms of Service</a></li>
            <li><a href="#" className="hover:text-[#2874f0] transition-colors">Sitemap Directory</a></li>
          </ul>
        </div>

      </div>

      {/* Bottom Legal / Payment Badges Banner */}
      <div className="bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-150 dark:border-zinc-900 py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
            <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-500" />
            <span>&copy; {currentYear} Trendify Comparator. All rights reserved. Live rates are scanned and compared.</span>
          </div>
          
          {/* Payment Badges (SVG style representations) */}
          <div className="flex items-center gap-2.5 opacity-60">
            <span className="text-[10px] bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded font-bold font-mono">VISA</span>
            <span className="text-[10px] bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded font-bold font-mono">MASTERCARD</span>
            <span className="text-[10px] bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded font-bold font-mono">AMEX</span>
            <span className="text-[10px] bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded font-bold font-mono">UPI</span>
          </div>
        </div>
      </div>
      
    </footer>
  );
}
