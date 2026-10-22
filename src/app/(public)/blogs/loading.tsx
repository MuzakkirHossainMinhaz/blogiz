import { EditorialPageHero } from "@/components/shared/EditorialPageHero";
import LoadingCard from "@/components/ui/LoadingCard";
import { APP_CONFIG } from "@/config/constants";

export default function BlogLoadingPage() {
  return (
    <main className="bg-paper" aria-busy="true" aria-label="Loading Articles">
      <EditorialPageHero
        eyebrow="Library"
        title="All Articles"
        description={APP_CONFIG.SITE_DESCRIPTION}
      />

      <section className="container-custom py-12 sm:py-16 md:py-20">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <LoadingCard key={index} />
          ))}
        </div>
      </section>
    </main>
  );
}
