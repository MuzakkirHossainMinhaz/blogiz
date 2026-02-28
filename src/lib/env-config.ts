import { z } from "zod";

// Environment variable schema
const envSchema = z.object({
  // Database
  MONGODB_URI: z.string().min(1, "MongoDB URI is required"),

  // NextAuth
  NEXTAUTH_SECRET: z.string().min(1, "NextAuth secret is required"),
  NEXTAUTH_URL: z.string().url().optional(),

  // Application
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().transform(Number).pipe(z.number()).default(3000),
  BASE_URL: z.string().url().optional(),

  // Optional: External services
  EMAIL_FROM: z.string().email().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().transform(Number).optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),

  // Optional: Analytics
  GOOGLE_ANALYTICS_ID: z.string().optional(),
  SENTRY_DSN: z.string().optional(),

  // Optional: File upload settings
  MAX_FILE_SIZE: z.string().transform(Number).pipe(z.number()).default(5242880), // 5MB
  UPLOAD_DIR: z.string().default("public/uploads"),
});

// Type for validated environment variables
export type Env = z.infer<typeof envSchema>;

// Validate and export environment variables
function validateEnv(): Env {
  try {
    return envSchema.parse(process.env);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues.map((err: any) => `${err.path.join(".")}: ${err.message}`);
      throw new Error(
        `❌ Invalid environment variables:\n${missingVars.join("\n")}\n\n` +
          `Please check your .env.local file and ensure all required variables are set.`
      );
    }
    throw error;
  }
}

// Export validated environment
export const env = validateEnv();

// Helper functions for common environment checks
export const isDevelopment = env.NODE_ENV === "development";
export const isProduction = env.NODE_ENV === "production";
export const isTest = env.NODE_ENV === "test";

// Database configuration
export const databaseConfig = {
  uri: env.MONGODB_URI,
  options: {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    bufferMaxEntries: 0,
    bufferCommands: false,
  },
};

// NextAuth configuration
export const authConfig = {
  secret: env.NEXTAUTH_SECRET,
  url: env.NEXTAUTH_URL || (isDevelopment ? "http://localhost:3000" : undefined),
  trustHost: true,
};

// File upload configuration
export const uploadConfig = {
  maxSize: env.MAX_FILE_SIZE,
  allowedTypes: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
  uploadDir: env.UPLOAD_DIR,
  maxFiles: 1,
};

// Email configuration (if enabled)
export const emailConfig =
  env.EMAIL_FROM && env.SMTP_HOST
    ? {
        from: env.EMAIL_FROM,
        host: env.SMTP_HOST,
        port: env.SMTP_PORT || 587,
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      }
    : null;

// Analytics configuration
export const analyticsConfig = {
  googleAnalyticsId: env.GOOGLE_ANALYTICS_ID,
  sentryDsn: env.SENTRY_DSN,
};

// Application configuration
export const appConfig = {
  name: "Blogiz",
  description: "A modern blog platform",
  url: env.NEXTAUTH_URL || "http://localhost:3000",
  env: env.NODE_ENV,
  port: env.PORT,
};

// Export all configurations
export const config = {
  env,
  app: appConfig,
  database: databaseConfig,
  auth: authConfig,
  upload: uploadConfig,
  email: emailConfig,
  analytics: analyticsConfig,
  isDevelopment,
  isProduction,
  isTest,
};

// Validation function for runtime checks
export function validateConfig(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check critical configurations
  if (!env.MONGODB_URI) {
    errors.push("MongoDB URI is required");
  }

  if (!env.NEXTAUTH_SECRET) {
    errors.push("NextAuth secret is required");
  }

  // Check optional but recommended configurations
  if (isProduction && !env.NEXTAUTH_URL) {
    errors.push("NEXTAUTH_URL is recommended in production");
  }

  // Check upload directory
  try {
    const fs = require("fs");
    if (!fs.existsSync(env.UPLOAD_DIR)) {
      errors.push(`Upload directory ${env.UPLOAD_DIR} does not exist`);
    }
  } catch {
    // File system check failed, but don't crash the app
    console.warn("Could not validate upload directory");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Log configuration on startup (development only)
if (isDevelopment) {
  console.log("🔧 Environment Configuration:");
  console.log(`  - Environment: ${env.NODE_ENV}`);
  console.log(`  - Port: ${env.PORT}`);
  console.log(`  - Database: ${env.MONGODB_URI ? "✅ Configured" : "❌ Missing"}`);
  console.log(`  - NextAuth: ${env.NEXTAUTH_SECRET ? "✅ Configured" : "❌ Missing"}`);
  console.log(`  - Upload Dir: ${env.UPLOAD_DIR}`);
  console.log(`  - Max File Size: ${env.MAX_FILE_SIZE} bytes`);

  if (emailConfig) {
    console.log(`  - Email: ✅ Configured`);
  } else {
    console.log(`  - Email: ⚠️ Not configured`);
  }

  if (analyticsConfig.googleAnalyticsId) {
    console.log(`  - Google Analytics: ✅ Configured`);
  }

  if (analyticsConfig.sentryDsn) {
    console.log(`  - Sentry: ✅ Configured`);
  }
}
