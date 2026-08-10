export interface Profile {
  id: string;
  full_name?: string | null;
  role: "student" | "admin";
  created_at: string;
  updated_at?: string;
}

export interface Student {
  id: string;
  full_name: string;
  phone?: string | null;
  country?: string | null;
  is_student?: boolean;
  email?: string;
  whatsapp_opt_in: boolean;
  created_at: string;
}

export interface Class {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  class_date: string;
  duration_minutes: number;
  max_students: number;
  image_url?: string;
  status: "upcoming" | "live" | "completed" | "cancelled";
  is_live: boolean;
  video_url?: string;
  zoom_link?: string;
  share_slug?: string | null;
  is_published?: boolean;
  join_enabled?: boolean;
  archived_at?: string | null;
  timezone?: string;
  created_at: string;
}

export interface Registration {
  id: string;
  student_id: string;
  class_id: string;
  paid: boolean;
  payment_method?: string;
  payment_reference?: string;
  attended: boolean;
  reminder_sent: boolean;
  certificate_issued: boolean;
  created_at: string;
  student?: Student;
  class?: Class;
}

export interface MessageLog {
  id: string;
  class_id: string;
  student_id: string;
  channel: "whatsapp" | "email";
  message: string;
  status: "pending" | "sent" | "failed" | "delivered";
  sent_at?: string;
  created_at: string;
}

export interface Certificate {
  id: string;
  registration_id: string;
  student_name: string;
  class_title: string;
  class_date: string;
  issued_at: string;
  download_url?: string;
}

export interface VideoAsset {
  id: string;
  class_id: string;
  title: string;
  description?: string;
  provider: string;
  provider_path?: string | null;
  access_mode: "stream" | "download" | "both";
  qualities: string[];
  download_limit: number;
  is_published: boolean;
  created_at: string;
}

export interface PDFGuide {
  id: string;
  class_id: string;
  title: string;
  file_url: string;
  file_size: number;
  download_count: number;
  created_at: string;
}

// ============================================
// PART 3: E-COMMERCE & AFFILIATE TYPES
// ============================================

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  category: "spice" | "kit" | "merchandise";
  image_url?: string;
  stock_quantity: number;
  weight_grams?: number;
  is_active: boolean;
  created_at: string;
}

export interface Order {
  id: string;
  student_id?: string;
  status: "pending" | "paid" | "shipped" | "delivered" | "cancelled";
  total_amount: number;
  currency: string;
  payment_method?: string;
  payment_reference?: string;
  shipping_address?: string;
  shipping_phone?: string;
  delivery_notes?: string;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
  product?: Product;
}

export interface Affiliate {
  id: string;
  student_id: string;
  referral_code: string;
  commission_rate: number;
  total_earnings: number;
  total_referrals: number;
  is_active: boolean;
  created_at: string;
}

export interface AffiliateReferral {
  id: string;
  affiliate_id: string;
  referred_student_id?: string;
  referred_order_id?: string;
  commission_amount: number;
  status: "pending" | "approved" | "paid" | "cancelled";
  created_at: string;
  paid_at?: string;
}

export interface CartItem {
  id: string;
  session_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  product?: Product;
}

export interface DailyStat {
  id: string;
  date: string;
  new_registrations: number;
  new_payments: number;
  revenue: number;
  new_students: number;
  new_orders: number;
  order_revenue: number;
  created_at: string;
}
