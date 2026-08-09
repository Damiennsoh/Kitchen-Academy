"use client";

import { useEffect, useState } from "react";
import { createClientBrowser } from "@/lib/supabase";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { ShoppingCart, Trash2, Plus, Minus, ArrowLeft, CreditCard, Loader2, Package } from "lucide-react";

interface CartItem {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: number;
    currency: string;
    description: string;
  };
}

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const supabase = createClientBrowser();

  useEffect(() => {
    fetchCart();
  }, []);

  function getSessionId() {
    let id = localStorage.getItem("cart_session");
    if (!id) {
      id = "sess_" + Math.random().toString(36).substring(2, 15);
      localStorage.setItem("cart_session", id);
    }
    return id;
  }

  async function fetchCart() {
    const sessionId = getSessionId();
    const { data } = await supabase
      .from("cart_items")
      .select(`id, quantity, product:products(id, name, price, currency, description)`)
      .eq("session_id", sessionId);

    setItems((data || []).map((d: any) => ({
      id: d.id,
      quantity: d.quantity,
      product: d.product,
    })));
    setLoading(false);
  }

  async function updateQuantity(itemId: string, newQty: number) {
    if (newQty < 1) {
      await removeItem(itemId);
      return;
    }
    await supabase.from("cart_items").update({ quantity: newQty }).eq("id", itemId);
    await fetchCart();
  }

  async function removeItem(itemId: string) {
    await supabase.from("cart_items").delete().eq("id", itemId);
    await fetchCart();
  }

  async function checkout() {
    setCheckoutLoading(true);
    // In production: Create order → redirect to Paynow/Selar
    setTimeout(() => {
      alert("[DEMO] Checkout would redirect to payment gateway.");
      setCheckoutLoading(false);
    }, 1000);
  }

  const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 sm:py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <Link href="/shop" className="inline-flex items-center gap-2 text-gray-500 hover:text-brand-600 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Continue Shopping
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-6">Your Cart</h1>

        {items.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h3>
            <p className="text-gray-500 mb-6">Browse our spices and recipe kits to get started.</p>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-6 py-3 bg-brand-500 text-white font-medium rounded-xl hover:bg-brand-600 transition-colors"
            >
              <Package className="w-5 h-5" /> Browse Products
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5 flex gap-4">
                <div className="w-20 h-20 bg-brand-100 rounded-xl flex items-center justify-center text-3xl shrink-0">
                  🌶️
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900">{item.product.name}</h3>
                  <p className="text-sm text-gray-500 truncate">{item.product.description}</p>
                  <div className="text-brand-600 font-bold mt-1">
                    {formatCurrency(item.product.price, item.product.currency)}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-2 bg-gray-100 rounded-lg">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Summary */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-600">Subtotal</span>
                <span className="text-xl font-bold text-gray-900">{formatCurrency(total, "USD")}</span>
              </div>
              <div className="flex items-center justify-between mb-6 text-sm text-gray-500">
                <span>Shipping</span>
                <span>Calculated at checkout</span>
              </div>
              <button
                onClick={checkout}
                disabled={checkoutLoading}
                className="w-full flex items-center justify-center gap-2 py-4 bg-brand-500 text-white font-semibold rounded-xl hover:bg-brand-600 transition-colors disabled:opacity-50"
              >
                {checkoutLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
                Proceed to Checkout
              </button>
              <p className="text-center text-xs text-gray-500 mt-3">
                Pay with EcoCash, OneMoney, or Card
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
