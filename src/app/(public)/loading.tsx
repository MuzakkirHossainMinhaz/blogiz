import { Container } from "@/components/ui/Container";

export default function LoadingPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-white">
      <Container>
        <div className="text-center">
          {/* Animated Logo/Spinner */}
          <div className="inline-flex items-center justify-center mb-6">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 rounded-full border-4 border-primary-200"></div>
              <div className="absolute inset-0 rounded-full border-4 border-primary-600 border-t-transparent animate-spin"></div>
            </div>
          </div>

          {/* Loading Text */}
          <h2 className="text-2xl font-semibold text-neutral-900 mb-2">Loading</h2>
          <p className="text-neutral-600">Please wait while we fetch your content</p>

          {/* Animated Dots */}
          <div className="flex items-center justify-center gap-2 mt-6">
            <div className="w-1.5 h-1.5 rounded-full bg-primary-600 animate-bounce"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-primary-600 animate-bounce [animation-delay:200ms]"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-primary-600 animate-bounce [animation-delay:400ms]"></div>
          </div>
        </div>
      </Container>
    </main>
  );
}
