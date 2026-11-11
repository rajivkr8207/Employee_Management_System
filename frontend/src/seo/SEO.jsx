import { useSEO } from "./useSEO";

/**
 * Declarative SEO Component.
 * Drop into any page or route component.
 * 
 * Example:
 * <SEO 
 *   title="Department Management" 
 *   description="Manage organizational departments and designation hierarchy." 
 *   noindex 
 * />
 */
export default function SEO(props) {
  useSEO(props);
  return null;
}

