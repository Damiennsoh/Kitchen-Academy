import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { createClient, type SupabaseClient } from "@supabase/supabase-js"

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "").replace(/\/rest\/v1\/?$/, "")
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || ""

export function createAuthServerClient(request: NextRequest, response: NextResponse) {
  return createServerClient(supabaseUrl, publishableKey, {
    cookies: {
      get(name: string) { return request.cookies.get(name)?.value },
      set(name: string, value: string, options: CookieOptions) {
        request.cookies.set({ name, value, ...options })
        response.cookies.set({ name, value, ...options })
      },
      remove(name: string, options: CookieOptions) {
        request.cookies.set({ name, value: "", ...options })
        response.cookies.set({ name, value: "", ...options })
      },
    },
  })
}

export async function getAuthenticatedUser() {
  const client = createClient(supabaseUrl, publishableKey, { auth: { persistSession: false, autoRefreshToken: false } })
  return client.auth.getUser()
}

export async function isAdmin(user: { id?: string; app_metadata?: Record<string, unknown> } | null | undefined, supabase?: SupabaseClient<any>) {
  if (!user) return false
  if (user.app_metadata?.role === "admin") return true
  if (!supabase || !user.id) return false
  const { data } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()
  return (data as { role?: string } | null)?.role === "admin"
}

export function createServiceClient() {
  return createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || "", { auth: { persistSession: false, autoRefreshToken: false } })
}

export async function requireAdmin(request: NextRequest) {
  const response = NextResponse.next()
  const supabase = createAuthServerClient(request, response)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !(await isAdmin(user, supabase))) return { user: null, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
  return { user, response }
}
