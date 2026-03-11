export { default } from "next-auth/middleware";

export const config = {
  matcher: ["/dashboard/:path*", "/matches/:path*", "/predictions/:path*", "/coins/:path*"],
};
