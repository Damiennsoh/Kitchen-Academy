"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, ChefHat, Phone, LayoutDashboard, ShoppingBag, Award, Moon, Sun, Download } from "lucide-react";
import { createClientBrowser } from "@/lib/supabase";
import { useTheme } from "@/context/ThemeContext";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [showInstall, setShowInstall] = useState(false);
  const { resolvedTheme, toggleTheme } = useTheme();
  const supabase = createClientBrowser();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    // Listen for PWA install prompt
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      setShowInstall(true);
    });
  }, []);

  async function installPWA() {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") setShowInstall(false);
  }

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/classes", label: "Classes" },
    { href: "/shop", label: "Shop", icon: ShoppingBag },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-10 h-10 bg-brand-500 rounded-full flex items-center justify-center">
              <ChefHat className="w-6 h-6 text-white" />
            </div>
            <div className="hidden sm:block">
              <span className="text-lg font-bold text-gray-900 dark:text-white leading-tight">Cooking with</span>
              <span className="text-lg font-bold text-brand-600 leading-tight block -mt-1">Chipo</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                {link.icon && <link.icon className="w-4 h-4" />}
                {link.label}
              </Link>
            ))}
            {user && (
              <>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-brand-600 hover:bg-brand-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4" /> My Kitchen
                </Link>
                <Link
                  href="/affiliate"
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <Award className="w-4 h-4" /> Earn
                </Link>
              </>
            )}

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle dark mode"
            >
              {resolvedTheme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* PWA Install Button */}
            {showInstall && (
              <button
                onClick={installPWA}
                className="flex items-center gap-1.5 px-3 py-2 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 transition-colors"
              >
                <Download className="w-4 h-4" /> Install App
              </button>
            )}

            {!user ? (
              <Link
                href="/auth"
                className="ml-2 px-4 py-2 bg-brand-500 text-white text-sm font-medium rounded-lg hover:bg-brand-600 transition-colors"
              >
                Sign In
              </Link>
            ) : (
              <button
                onClick={() => supabase.auth.signOut().then(() => window.location.href = "/")}
                className="ml-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                Sign Out
              </button>
            )}
            <a
              href="https://wa.me/263XXXXXXXXX"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 flex items-center gap-2 px-4 py-2 bg-green-500 text-white text-sm font-medium rounded-full hover:bg-green-600 transition-colors"
            >
              <Phone className="w-4 h-4" />
              <span className="hidden lg:inline">WhatsApp</span>
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 shadow-lg">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 px-4 py-3 text-base font-medium text-gray-700 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                {link.icon && <link.icon className="w-5 h-5" />}
                {link.label}
              </Link>
            ))}
            {user && (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 px-4 py-3 text-base font-medium text-brand-600 hover:bg-brand-50 dark:hover:bg-gray-800 rounded-lg"
                >
                  <LayoutDashboard className="w-5 h-5" /> My Kitchen
                </Link>
                <Link
                  href="/affiliate"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 px-4 py-3 text-base font-medium text-gray-700 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-gray-800 rounded-lg"
                >
                  <Award className="w-5 h-5" /> Earn Money
                </Link>
              </>
            )}

            {/* Dark Mode Mobile */}
            <button
              onClick={() => { toggleTheme(); setIsOpen(false); }}
              className="flex items-center gap-2 w-full text-left px-4 py-3 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg"
            >
              {resolvedTheme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              {resolvedTheme === "dark" ? "Light Mode" : "Dark Mode"}
            </button>

            {showInstall && (
              <button
                onClick={() => { installPWA(); setIsOpen(false); }}
                className="flex items-center gap-2 w-full text-left px-4 py-3 text-base font-medium text-green-600 hover:bg-green-50 rounded-lg"
              >
                <Download className="w-5 h-5" /> Install App
              </button>
            )}

            {!user ? (
              <Link
                href="/auth"
                onClick={() => setIsOpen(false)}
                className="block px-4 py-3 text-base font-medium text-brand-600 hover:bg-brand-50 rounded-lg"
              >
                Sign In
              </Link>
            ) : (
              <button
                onClick={() => { supabase.auth.signOut().then(() => window.location.href = "/"); }}
                className="block w-full text-left px-4 py-3 text-base font-medium text-red-600 hover:bg-red-50 rounded-lg"
              >
                Sign Out
              </button>
            )}
            <a
              href="https://wa.me/263XXXXXXXXX"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-3 mt-2 bg-green-500 text-white font-medium rounded-lg"
            >
              <Phone className="w-5 h-5" />
              Chat on WhatsApp
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
