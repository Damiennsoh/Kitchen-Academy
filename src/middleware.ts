import { NextResponse, type NextRequest } from "next/server"
import { createAuthServerClient, isAdmin } from "@/lib/auth"

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } })
  const supabase = createAuthServerClient(request, response)
  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname

  if (pathname.startsWith("/dashboard") || pathname.startsWith("/admin")) {
    if (!user) return NextResponse.redirect(new URL("/auth", request.url))
    if (pathname.startsWith("/admin") && !(await isAdmin(user, supabase))) return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return response
}

export const config = { matcher: ["/dashboard/:path*", "/admin/:path*"] }
