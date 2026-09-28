import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { FiInfo } from "react-icons/fi";

export default function AboutPage() {
  return (
    <main className="bg-paper">
      <Section className="min-h-[60vh] flex items-center justify-center">
        <Container>
          <div className="max-w-2xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-100 border border-primary-200 mb-6">
              <FiInfo className="w-8 h-8 text-primary-700" />
            </div>

            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-ink mb-4">
              About Blogiz
            </h1>
            <p className="text-base sm:text-lg text-accent-500 mb-8 leading-relaxed">
              This page is currently under construction. We&apos;re shaping the story of Blogiz as an editorial home for
              writers and readers.
            </p>

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-50 border border-primary-200">
              <div className="w-2 h-2 rounded-full bg-primary-500" />
              <span className="text-primary-800 font-medium text-sm">Coming soon</span>
            </div>
          </div>
        </Container>
      </Section>
    </main>
  );
}
