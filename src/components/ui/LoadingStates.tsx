import { FiImage, FiLoader } from "react-icons/fi";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingSpinner({ size = "md", className = "" }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  return (
    <div className={`animate-spin ${sizeClasses[size]} ${className}`}>
      <FiLoader className="w-full h-full text-primary-600" />
    </div>
  );
}

interface LoadingCardProps {
  variant?: "blog" | "dashboard" | "skeleton";
}

export function LoadingCard({ variant = "blog" }: LoadingCardProps) {
  if (variant === "skeleton") {
    return (
      <div className="bg-white rounded-xl shadow-soft overflow-hidden animate-pulse">
        <div className="h-48 bg-neutral-200" />
        <div className="p-6 space-y-4">
          <div className="h-4 bg-neutral-200 rounded w-24" />
          <div className="h-6 bg-neutral-200 rounded w-3/4" />
          <div className="space-y-2">
            <div className="h-4 bg-neutral-200 rounded" />
            <div className="h-4 bg-neutral-200 rounded w-5/6" />
          </div>
        </div>
      </div>
    );
  }

  if (variant === "dashboard") {
    return (
      <div className="bg-white rounded-xl shadow-soft p-6 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 bg-neutral-200 rounded w-32" />
          <div className="h-8 bg-neutral-200 rounded w-8" />
        </div>
        <div className="space-y-3">
          <div className="h-4 bg-neutral-200 rounded" />
          <div className="h-4 bg-neutral-200 rounded w-4/5" />
          <div className="h-4 bg-neutral-200 rounded w-3/5" />
        </div>
      </div>
    );
  }

  // Blog card variant
  return (
    <div className="bg-white rounded-xl shadow-soft overflow-hidden animate-pulse">
      <div className="h-56 bg-neutral-200 relative">
        <div className="absolute top-4 left-4 h-6 bg-neutral-300 rounded w-20" />
      </div>
      <div className="p-6 space-y-4">
        <div className="h-4 bg-neutral-200 rounded w-24" />
        <div className="h-6 bg-neutral-200 rounded w-3/4" />
        <div className="space-y-2">
          <div className="h-4 bg-neutral-200 rounded" />
          <div className="h-4 bg-neutral-200 rounded w-5/6" />
          <div className="h-4 bg-neutral-200 rounded w-4/6" />
        </div>
        <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-neutral-200 rounded-full" />
            <div className="h-4 bg-neutral-200 rounded w-20" />
          </div>
          <div className="h-4 bg-neutral-200 rounded w-8" />
        </div>
      </div>
    </div>
  );
}

interface LoadingPageProps {
  type?: "blogs" | "blog-detail" | "dashboard" | "auth";
}

export function LoadingPage({ type = "blogs" }: LoadingPageProps) {
  if (type === "blog-detail") {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="animate-pulse">
            <div className="text-center mb-12">
              <div className="h-6 bg-neutral-200 rounded w-32 mx-auto mb-4" />
              <div className="h-12 bg-neutral-200 rounded w-3/4 mx-auto mb-6" />
              <div className="flex items-center justify-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 bg-neutral-200 rounded-full" />
                  <div className="h-4 bg-neutral-200 rounded w-24" />
                </div>
                <div className="h-8 bg-neutral-200 rounded w-px" />
                <div className="h-4 bg-neutral-200 rounded w-16" />
              </div>
            </div>

            <div className="h-96 bg-neutral-200 rounded-2xl mb-12" />

            <div className="space-y-4">
              <div className="h-6 bg-neutral-200 rounded" />
              <div className="h-6 bg-neutral-200 rounded" />
              <div className="h-6 bg-neutral-200 rounded w-5/6" />
              <div className="h-6 bg-neutral-200 rounded" />
              <div className="h-6 bg-neutral-200 rounded w-4/5" />
            </div>

            <div className="flex items-center justify-between pt-8 border-t border-neutral-200 mt-12">
              <div className="h-10 bg-neutral-200 rounded w-24" />
              <div className="flex gap-2">
                <div className="h-10 bg-neutral-200 rounded w-10" />
                <div className="h-10 bg-neutral-200 rounded w-10" />
                <div className="h-10 bg-neutral-200 rounded w-10" />
                <div className="h-10 bg-neutral-200 rounded w-10" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (type === "dashboard") {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-neutral-200 rounded w-48 mb-8" />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl p-6">
                  <div className="h-6 bg-neutral-200 rounded w-24 mb-2" />
                  <div className="h-8 bg-neutral-200 rounded w-16" />
                </div>
              ))}
            </div>

            <div className="bg-white rounded-xl p-6">
              <div className="h-6 bg-neutral-200 rounded w-32 mb-4" />
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between py-3 border-b border-neutral-100">
                    <div className="flex items-center gap-3">
                      <div className="h-4 bg-neutral-200 rounded w-32" />
                      <div className="h-4 bg-neutral-200 rounded w-16" />
                    </div>
                    <div className="flex gap-2">
                      <div className="h-8 bg-neutral-200 rounded w-16" />
                      <div className="h-8 bg-neutral-200 rounded w-16" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (type === "auth") {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="animate-pulse">
            <div className="h-8 bg-neutral-200 rounded w-32 mx-auto mb-8" />
            <div className="bg-white rounded-xl shadow-soft-lg p-8">
              <div className="space-y-4">
                <div className="h-4 bg-neutral-200 rounded" />
                <div className="h-10 bg-neutral-200 rounded" />
                <div className="h-4 bg-neutral-200 rounded" />
                <div className="h-10 bg-neutral-200 rounded" />
                <div className="h-10 bg-neutral-200 rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Blogs list loading
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="animate-pulse text-center mb-12">
          <div className="h-8 bg-neutral-200 rounded w-64 mx-auto mb-4" />
          <div className="h-4 bg-neutral-200 rounded w-96 mx-auto" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(6)].map((_, i) => (
            <LoadingCard key={i} variant="blog" />
          ))}
        </div>
      </div>
    </div>
  );
}

interface LoadingButtonProps {
  children: React.ReactNode;
  isLoading?: boolean;
  className?: string;
}

export function LoadingButton({ children, isLoading, className = "" }: LoadingButtonProps) {
  return (
    <button
      disabled={isLoading}
      className={`
        inline-flex items-center justify-center gap-2 px-4 py-2 
        bg-primary-600 text-white rounded-lg 
        hover:bg-primary-700 transition-colors
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    >
      {isLoading && <LoadingSpinner size="sm" />}
      {children}
    </button>
  );
}

// Inline loading components for specific use cases
export function LoadingText() {
  return <div className="h-4 bg-neutral-200 rounded animate-pulse w-3/4" />;
}

export function LoadingAvatar() {
  return <div className="w-10 h-10 bg-neutral-200 rounded-full animate-pulse" />;
}

export function LoadingImage() {
  return (
    <div className="relative bg-neutral-200 animate-pulse rounded-lg overflow-hidden">
      <FiImage className="w-8 h-8 text-neutral-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
    </div>
  );
}
