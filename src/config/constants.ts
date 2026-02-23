// API Configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// API Endpoints
export const API_ENDPOINTS = {
  BLOGS: "/blogs",
  BLOG_BY_ID: (id: string) => `/blogs/${id}`,
} as const;

// App Configuration
export const APP_CONFIG = {
  SITE_NAME: "Blogiz",
  SITE_DESCRIPTION: "Discover insightful articles and stories from our community of writers",
  REVALIDATE_TIME: 30, // seconds
  ITEMS_PER_PAGE: 9,
  LATEST_BLOGS_COUNT: 5,
} as const;

// UI Configuration
export const UI_CONFIG = {
  MAX_TITLE_LENGTH: 60,
  MAX_DESCRIPTION_LENGTH_CARD: 120,
  MAX_DESCRIPTION_LENGTH_LATEST: 180,
  DEFAULT_AVATAR: "/author.png",
} as const;

// Route Paths
export const ROUTES = {
  HOME: "/",
  BLOGS: "/blogs",
  BLOG_DETAIL: (id: string) => `/blogs/${id}`,
  CREATE_BLOG: "/blogs/create",
  ABOUT: "/about",
  SUPPORT: "/support",
} as const;
