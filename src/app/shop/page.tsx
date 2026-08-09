"use client";

import { useEffect, useState } from "react";
import { createClientBrowser } from "@/lib/supabase";
import { Product } from "@/types";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { ShoppingCart, Search, Filter, Package, Coffee, Loader2, Plus } from "lucide-react";

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0);
  const [category, setCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const supabase = createClientBrowser();

  useEffect(() => {
    fetchProducts();
    fetchCartCount();
  }, []);

  async function fetchProducts() {
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });
    setProducts(data || []);
    setLoading(false);
  }

  async function fetchCartCount() {
    const sessionId = localStorage.getItem("cart_session") || generateSessionId();
    const { count } = await supabase
      .from("cart_items")
      .select("*", { count: "exact", head: true })
      .eq("session_id", sessionId);
    setCartCount(count || 0);
  }

  function generateSessionId() {
    const id = "sess_" + Math.random().toString(36).substring(2, 15);
    localStorage.setItem("cart_session", id);
    return id;
  }

  async function addToCart(productId: string) {
    const sessionId = localStorage.getItem("cart_session") || generateSessionId();

    const { error } = await supabase
      .from("cart_items")
      .upsert(
        { session_id: sessionId, product_id: productId, quantity: 1 },
        { onConflict: "session_id,product_id" }
      );

    if (!error) {
      fetchCartCount();
      // Show toast notification (simplified)
      alert("Added to cart!");
    }
  }

  const filteredProducts = products
    .filter((p) => category === "all" || p.category === category)
    .filter((p) => !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const categories = ["all", "spice", "kit", "merchandise"];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Rosella Shop</h1>
            <p className="text-gray-600">Authentic spices, recipe kits & merchandise</p>
          </div>
          <Link
            href="/shop/cart"
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 transition-colors self-start sm:self-auto"
          >
            <ShoppingCart className="w-5 h-5" />
            Cart {cartCount > 0 && <span className="bg-brand-500 text-white text-xs px-2 py-0.5 rounded-full">{cartCount}</span>}
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search spices, kits..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium capitalize whitespace-nowrap transition-colors ${
                  category === cat
                    ? "bg-brand-500 text-white"
                    : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                }`}
              >
                {cat === "all" ? "All Products" : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-500">Try adjusting your search or category filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg transition-all group"
              >
                <div className="h-48 bg-gradient-to-br from-brand-100 to-orange-200 flex items-center justify-center relative">
                  <span className="text-6xl">
                    {product.category === "spice" ? "🌶️" : product.category === "kit" ? "📦" : "👕"}
                  </span>
                  {product.stock_quantity < 10 && (
                    <span className="absolute top-3 left-3 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-lg">
                      Low Stock
                    </span>
                  )}
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-brand-600 transition-colors">
                      {product.name}
                    </h3>
                    <span className="text-lg font-bold text-brand-600 shrink-0">
                      {formatCurrency(product.price, product.currency)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{product.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {product.stock_quantity} in stock
                      {product.weight_grams && ` • ${product.weight_grams}g`}
                    </span>
                    <button
                      onClick={() => addToCart(product.id)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-brand-500 text-white text-sm font-medium rounded-lg hover:bg-brand-600 transition-colors"
                    >
                      <Plus className="w-4 h-4" /> Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
