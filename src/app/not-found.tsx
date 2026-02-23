import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { ROUTES } from "@/config/constants";
import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-linear-to-br from-primary-50 to-neutral-50">
      <Container>
        <div className="max-w-2xl mx-auto text-center">
          {/* 404 Illustration */}
          <div className="mb-8">
            <h1 className="text-9xl md:text-[10rem] font-bold gradient-text leading-none">
              404
            </h1>
          </div>

          {/* Message */}
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
            Page Not Found
          </h2>
          <p className="text-lg text-neutral-600 mb-8 max-w-md mx-auto">
            Oops! The page you're looking for doesn't exist. It might have been
            moved or deleted.
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href={ROUTES.HOME}>
              <Button
                variant="primary"
                size="md"
                className="w-full border-2 border-primary-600 sm:w-auto cursor-pointer"
              >
                Go Home
              </Button>
            </Link>
            <Link href={ROUTES.BLOGS}>
              <Button
                variant="outline"
                size="md"
                className="w-full border-2 border-primary-600 sm:w-auto cursor-pointer"
              >
                Browse Blogs
              </Button>
            </Link>
          </div>
        </div>
      </Container>
    </main>
  );
}
