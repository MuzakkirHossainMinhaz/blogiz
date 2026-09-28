import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { FiHeadphones } from "react-icons/fi";

export default function SupportPage() {
  return (
    <main className="bg-paper">
      <Section className="min-h-[60vh] flex items-center justify-center">
        <Container>
          <div className="max-w-2xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-100 border border-primary-200 mb-6">
              <FiHeadphones className="w-8 h-8 text-primary-700" />
            </div>

            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-ink mb-4">
              Support Center
            </h1>
            <p className="text-base sm:text-lg text-accent-500 mb-8 leading-relaxed">
              Our support page is under construction. Helpful resources and assistance will land here soon.
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
