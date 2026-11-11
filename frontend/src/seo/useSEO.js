import { useEffect } from "react";
import { seoConfig } from "./seoConfig";

/**
 * Utility: Find or create a <meta> element by selector attribute
 */
function updateMetaTag(attributeName, attributeValue, content) {
  if (typeof document === "undefined") return;
  if (content === undefined || content === null) return;

  let element = document.querySelector(`meta[${attributeName}="${attributeValue}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attributeName, attributeValue);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
}

/**
 * Utility: Find or create a <link> element by rel attribute
 */
function updateLinkTag(rel, href) {
  if (typeof document === "undefined") return;
  if (!href) return;

  let element = document.querySelector(`link[rel="${rel}"]`);
  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", rel);
    document.head.appendChild(element);
  }
  element.setAttribute("href", href);
}

/**
 * Utility: Inject or update a JSON-LD structured data script
 */
function updateJsonLd(id, data) {
  if (typeof document === "undefined") return;
  const scriptId = `jsonld-${id || "seo"}`;
  let script = document.getElementById(scriptId);

  if (!data) {
    if (script) script.remove();
    return;
  }

  if (!script) {
    script = document.createElement("script");
    script.setAttribute("type", "application/ld+json");
    script.setAttribute("id", scriptId);
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(data);
}

/**
 * Custom hook for dynamic, reactive SEO management.
 * 
 * @param {Object} options
 * @param {string} [options.title] - Page title (will be formatted with template if set)
 * @param {boolean} [options.rawTitle=false] - If true, bypasses the site title template
 * @param {string} [options.description] - Meta description
 * @param {string} [options.keywords] - Meta keywords (comma-separated)
 * @param {string} [options.canonical] - Canonical URL
 * @param {boolean} [options.noindex=false] - Disallow search engine indexing
 * @param {string} [options.ogImage] - Social share image URL
 * @param {string} [options.ogType='website'] - OpenGraph type (website, article, etc.)
 * @param {string} [options.twitterCard='summary_large_image'] - Twitter card type
 * @param {Object|Array} [options.jsonLd] - Structured Data object or array
 */
export function useSEO({
  title,
  rawTitle = false,
  description,
  keywords,
  canonical,
  noindex = false,
  ogImage,
  ogType,
  twitterCard,
  jsonLd,
} = {}) {
  useEffect(() => {
    if (typeof document === "undefined") return;

    // 1. Title
    const baseTitle = title || seoConfig.defaultTitle;
    const finalTitle =
      rawTitle || !title
        ? baseTitle
        : seoConfig.titleTemplate.replace("%s", title);
    document.title = finalTitle;

    // 2. Standard Meta Tags
    const finalDesc = description || seoConfig.defaultDescription;
    const finalKeywords = keywords || seoConfig.defaultKeywords;
    updateMetaTag("name", "description", finalDesc);
    updateMetaTag("name", "keywords", finalKeywords);

    // 3. Robots
    const robotsContent = noindex
      ? "noindex, nofollow, noarchive"
      : "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1";
    updateMetaTag("name", "robots", robotsContent);
    updateMetaTag("name", "googlebot", robotsContent);

    // 4. Canonical URL
    const currentUrl =
      typeof window !== "undefined" ? window.location.href : seoConfig.siteUrl;
    const finalCanonical = canonical || currentUrl;
    updateLinkTag("canonical", finalCanonical);

    // 5. OpenGraph Tags
    const finalOgImage = ogImage
      ? new URL(ogImage, currentUrl).href
      : new URL(seoConfig.defaultOgImage, currentUrl).href;
    const finalOgType = ogType || seoConfig.defaultOgType;

    updateMetaTag("property", "og:title", finalTitle);
    updateMetaTag("property", "og:description", finalDesc);
    updateMetaTag("property", "og:url", finalCanonical);
    updateMetaTag("property", "og:image", finalOgImage);
    updateMetaTag("property", "og:type", finalOgType);
    updateMetaTag("property", "og:site_name", seoConfig.siteName);
    updateMetaTag("property", "og:locale", seoConfig.defaultLocale);

    // 6. Twitter Card Tags
    const finalTwitterCard = twitterCard || seoConfig.defaultTwitterCard;
    updateMetaTag("name", "twitter:card", finalTwitterCard);
    updateMetaTag("name", "twitter:title", finalTitle);
    updateMetaTag("name", "twitter:description", finalDesc);
    updateMetaTag("name", "twitter:image", finalOgImage);

    // 7. Structured Data (JSON-LD)
    if (jsonLd) {
      updateJsonLd("page", jsonLd);
    }

    // Cleanup: when unmounting, remove page-specific JSON-LD if present
    return () => {
      if (jsonLd) updateJsonLd("page", null);
    };
  }, [
    title,
    rawTitle,
    description,
    keywords,
    canonical,
    noindex,
    ogImage,
    ogType,
    twitterCard,
    jsonLd,
  ]);
}

