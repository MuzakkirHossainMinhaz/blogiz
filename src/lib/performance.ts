// Performance optimization utilities

import { useState } from "react";

// Image optimization helper
export function getOptimizedImageUrl(src: string, width?: number, quality?: number): string {
  if (!src) return "/placeholder-blog.jpg";

  // If it's already an external URL, return as-is
  if (src.startsWith("http")) return src;

  // For local images, we could add CDN parameters here
  const params = new URLSearchParams();
  if (width) params.set("w", width.toString());
  if (quality) params.set("q", quality.toString());

  const paramString = params.toString();
  return paramString ? `${src}?${paramString}` : src;
}

// Debounce utility for search and other input events
export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Throttle utility for scroll events
export function throttle<T extends (...args: any[]) => any>(func: T, limit: number): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Lazy load images with Intersection Observer
export function useLazyLoad() {
  if (typeof window === "undefined") return null;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          const src = img.dataset.src;
          if (src) {
            img.src = src;
            img.removeAttribute("data-src");
            observer.unobserve(img);
          }
        }
      });
    },
    {
      rootMargin: "50px 0px",
      threshold: 0.01,
    }
  );

  return observer;
}

// Preload critical resources
export function preloadResources(resources: Array<{ href: string; as: string }>) {
  if (typeof window === "undefined") return;

  resources.forEach(({ href, as }) => {
    const link = document.createElement("link");
    link.rel = "preload";
    link.href = href;
    link.as = as;
    document.head.appendChild(link);
  });
}

// Performance monitoring
export class PerformanceMonitor {
  private static marks: Map<string, number> = new Map();

  static mark(name: string) {
    this.marks.set(name, performance.now());
  }

  static measure(name: string, startMark: string) {
    const start = this.marks.get(startMark);
    if (start) {
      const duration = performance.now() - start;
      console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`);
      return duration;
    }
    return 0;
  }

  static logMemoryUsage() {
    if ("memory" in performance) {
      const memory = (performance as any).memory;
      console.log("💾 Memory Usage:", {
        used: `${(memory.usedJSHeapSize / 1048576).toFixed(2)} MB`,
        total: `${(memory.totalJSHeapSize / 1048576).toFixed(2)} MB`,
        limit: `${(memory.jsHeapSizeLimit / 1048576).toFixed(2)} MB`,
      });
    }
  }
}

// Optimized scroll behavior
export function smoothScrollTo(element: HTMLElement, offset = 0) {
  const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
  const offsetPosition = elementPosition - offset;

  window.scrollTo({
    top: offsetPosition,
    behavior: "smooth",
  });
}

// Virtual scrolling helper for large lists
export function useVirtualScrolling<T>(items: T[], itemHeight: number, containerHeight: number) {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.min(visibleStart + Math.ceil(containerHeight / itemHeight) + 1, items.length - 1);

  const visibleItems = items.slice(visibleStart, visibleEnd + 1);
  const offsetY = visibleStart * itemHeight;

  return {
    visibleItems,
    offsetY,
    totalHeight: items.length * itemHeight,
    onScroll: throttle((e: React.UIEvent<HTMLDivElement>) => {
      setScrollTop(e.currentTarget.scrollTop);
    }, 16), // 60fps
  };
}

// Cache API responses
class SimpleCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  set(key: string, data: any, ttl = 300000) {
    // 5 minutes default TTL
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  clear() {
    this.cache.clear();
  }

  size() {
    return this.cache.size;
  }
}

export const apiCache = new SimpleCache();

// Optimized image component props
export interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  quality?: number;
  placeholder?: "blur" | "empty";
  blurDataURL?: string;
}

// Bundle size monitoring
export function logBundleSize() {
  if (typeof window !== "undefined" && "performance" in window) {
    const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
    const transferSize = navigation.transferSize;

    if (transferSize > 0) {
      console.log(`📦 Bundle size: ${(transferSize / 1024).toFixed(2)} KB`);
    }
  }
}

// Critical CSS inlining helper
export function getCriticalCSS() {
  // Return critical CSS for above-the-fold content
  return `
    /* Critical CSS for immediate rendering */
    body { margin: 0; font-family: system-ui, sans-serif; }
    .loading { min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    .skeleton { background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%); background-size: 200% 100%; animation: loading 1.5s infinite; }
    @keyframes loading { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
  `;
}

// Service Worker registration for offline support
export function registerServiceWorker() {
  if (typeof window !== "undefined" && "serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("✅ Service Worker registered:", registration);
        })
        .catch((error) => {
          console.log("❌ Service Worker registration failed:", error);
        });
    });
  }
}

// Web Vitals monitoring
export function reportWebVitals(metric: any) {
  // Send to analytics service
  if (process.env.NODE_ENV === "production") {
    // Example: gtag('event', metric.name, { value: metric.value });
    console.log(`📊 ${metric.name}:`, metric.value);
  }
}
