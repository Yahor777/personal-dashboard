export type Axis = "vertical" | "horizontal";

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Smoothly scroll the page or a container to a target position or element.
 * - Respects prefers-reduced-motion by falling back to 'auto'.
 * - Supports vertical and horizontal axes.
 */
export function smoothScrollTo(
  target: number | Element,
  options?: {
    axis?: Axis;
    container?: Element | null;
    offset?: number;
    behavior?: ScrollBehavior;
    block?: ScrollLogicalPosition; // used for scrollIntoView
    inline?: ScrollLogicalPosition; // used for scrollIntoView
  },
) {
  const axis = options?.axis ?? "vertical";
  const offset = options?.offset ?? 0;
  const behavior: ScrollBehavior = prefersReducedMotion() ? "auto" : options?.behavior ?? "smooth";

  // Choose scroller: container or document element
  const scroller: Element | (Element & { scrollTo: typeof window.scrollTo }) =
    options?.container ?? (document.scrollingElement || document.documentElement);

  if (typeof target === "number") {
    // Numeric target: absolute position
    const coords = axis === "vertical" ? { top: target + offset } : { left: target + offset };
    (scroller as any).scrollTo({ behavior, ...coords });
    return;
  }

  // Element target: use scrollIntoView if scrolling the main page
  if (!options?.container || scroller === document.documentElement) {
    target.scrollIntoView({ behavior, block: options?.block ?? "start", inline: options?.inline ?? "nearest" });
    if (offset && axis === "vertical") {
      // Apply offset by adjusting after scroll (e.g., sticky headers)
      const current = window.scrollY ?? document.documentElement.scrollTop;
      window.scrollTo({ top: current + offset, behavior });
    }
    return;
  }

  // Scrolling inside a container: compute relative coordinates
  const tRect = target.getBoundingClientRect();
  const cRect = (scroller as Element).getBoundingClientRect();
  const top = (scroller as any).scrollTop + (tRect.top - cRect.top) + offset;
  const left = (scroller as any).scrollLeft + (tRect.left - cRect.left) + offset;
  (scroller as any).scrollTo({ behavior, top, left });
}

/**
 * Attach smooth scrolling for in-page anchor links and elements with [data-scroll-to].
 * - Keeps keyboard and native scrollbar behavior untouched.
 * - Only intercepts clicks on same-page anchors.
 */
export function attachSmoothScrollLinks() {
  if (typeof document === "undefined") return;
  const selector = 'a[href^="#"], [data-scroll-to]';

  const handleClick = (e: Event) => {
    const el = e.currentTarget as HTMLElement | null;
    if (!el) return;

    const hash = el instanceof HTMLAnchorElement ? el.getAttribute("href") || "" : el.getAttribute("data-scroll-to") || "";
    if (!hash || hash === "#") return;

    const id = hash.replace(/^#/, "");
    const target = document.getElementById(id) || document.querySelector(hash);
    if (!target) return;

    // Prevent default only for same-page anchors
    e.preventDefault();
    smoothScrollTo(target);

    // Update hash for history/navigation expectations
    if (history.pushState) {
      history.pushState(null, "", `#${id}`);
    } else {
      (window as any).location.hash = id;
    }
  };

  const nodes = Array.from(document.querySelectorAll(selector));
  nodes.forEach((node) => {
    // Avoid double binding
    if ((node as any)._smoothBound) return;
    node.addEventListener("click", handleClick);
    (node as any)._smoothBound = true;
  });
}

/**
 * Restore scroll position per route/hash during navigation.
 * - Uses sessionStorage keyed by pathname+hash.
 * - Requests manual restoration to avoid browser conflicts.
 */
let _scrollRestorationInit = false;
export function useScrollRestoration() {
  if (typeof window === "undefined") return;
  if (_scrollRestorationInit) return; // prevent double-binding in StrictMode
  _scrollRestorationInit = true;

  // Hint browsers we handle restoration manually
  try { (history as any).scrollRestoration = "manual"; } catch {}

  const keyForLocation = () => `${location.pathname}${location.hash}`;
  const restore = () => {
    const key = keyForLocation();
    const saved = sessionStorage.getItem(`scroll:${key}`);
    const y = saved ? parseInt(saved, 10) : null;
    if (Number.isFinite(y as any)) {
      window.scrollTo({ top: y as number, behavior: "auto" });
    }
  };

  const save = () => {
    const key = keyForLocation();
    sessionStorage.setItem(`scroll:${key}`, String(window.scrollY || document.documentElement.scrollTop || 0));
  };

  // Initial restore on load
  window.addEventListener("load", restore, { once: true });

  // Save on visibility change / before unload
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") save(); });
  window.addEventListener("beforeunload", save);

  // Save on navigation changes
  window.addEventListener("hashchange", () => { save(); restore(); });
  window.addEventListener("popstate", () => { restore(); });
}