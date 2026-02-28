import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";

export default function AboutPage() {
  return (
    <main className="bg-white">
      <Section className="min-h-[60vh] flex items-center justify-center">
        <Container>
          <div className="max-w-3xl mx-auto text-center">
            {/* Icon */}
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary-100 mb-6">
              <svg
                className="w-10 h-10 text-primary-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>

            {/* Message */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              About <span className="gradient-text">Blogiz</span>
            </h1>
            <p className="text-xl text-neutral-600 mb-8">
              This page is currently under construction. We're working hard to
              bring you something amazing!
            </p>

            {/* Coming Soon Badge */}
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary-50 border border-primary-200">
              <div className="w-2 h-2 rounded-full bg-primary-600 animate-pulse"></div>
              <span className="text-primary-700 font-medium">
                Coming Soon
              </span>
            </div>

            {/* Decorative Element */}
            <div className="mt-12 text-6xl">😴</div>
          </div>
        </Container>
      </Section>
    </main>
  );
}
