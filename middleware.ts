import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const path = req.nextUrl.pathname;
    const token = req.nextauth.token;

    // Redirect authenticated users away from auth pages to dashboard
    if (path.startsWith("/auth") && token) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    
    // Allow public invoice viewing routes
    if (path.match(/^\/api\/invoices\/[^\/]+\/(public|view)$/)) {
      return NextResponse.next();
    }
    
    // Add any additional middleware logic here
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;
        
        // Allow public invoice viewing routes without auth
        if (path.match(/^\/api\/invoices\/[^\/]+\/(public|view)$/)) {
          return true;
        }

        // Always allow access to auth pages so the middleware function can handle the redirect logic
        if (path.startsWith("/auth")) {
          return true;
        }
        
        return !!token;
      }
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/business/:path*",
    "/api/products/:path*",
    "/api/customers/:path*",
    "/api/tax-systems/:path*",
    "/api/invoices/:path*",
    "/business/:path*",
    "/auth/:path*"
  ]
};