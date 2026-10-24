import { site } from "@/config/site";

export default function robots() {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/account", "/bookings/"] }],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
