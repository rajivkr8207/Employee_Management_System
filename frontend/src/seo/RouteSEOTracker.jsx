import { useLocation } from "react-router-dom";
import { seoConfig } from "./seoConfig";
import { useSEO } from "./useSEO";

/**
 * Finds the closest route preset from seoConfig
 */
function resolveRouteSEO(pathname) {
  // 1. Direct match
  if (seoConfig.routePresets[pathname]) {
    return seoConfig.routePresets[pathname];
  }

  // 2. Prefix / dynamic route match (e.g. /reset-password/xyz -> /reset-password)
  for (const [routePattern, config] of Object.entries(seoConfig.routePresets)) {
    if (routePattern !== "/" && pathname.startsWith(routePattern)) {
      return config;
    }
  }

  // 3. Intelligent fallback based on path segments
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) {
    return seoConfig.routePresets["/"];
  }

  const isProtected = ["admin", "store-admin", "manager", "employee", "profile", "settings"].includes(
    segments[0]
  );

  const formattedSegmentTitle = segments
    .map((s) => s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()))
    .reverse()
    .join(" — ");

  return {
    title: formattedSegmentTitle,
    description: seoConfig.defaultDescription,
    noindex: isProtected,
  };
}

/**
 * Global Route SEO Tracker
 * Mount once inside <BrowserRouter> to provide automated SEO across all routes.
 */
export default function RouteSEOTracker() {
  const location = useLocation();
  const currentSEO = resolveRouteSEO(location.pathname);

  useSEO({
    title: currentSEO.title,
    description: currentSEO.description,
    keywords: currentSEO.keywords,
    noindex: currentSEO.noindex,
    canonical: typeof window !== "undefined" ? window.location.href : undefined,
  });

  return null;
}

