"use client";

import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Input } from "@/components/ui/Input";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn, useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { FiLock, FiMail } from "react-icons/fi";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  remember: z.boolean(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      remember: false,
    },
  });

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
      } else {
        const callbackUrl = new URLSearchParams(window.location.search).get("callbackUrl");
        router.push(callbackUrl || "/dashboard");
        router.refresh();
      }
    } catch (error) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while checking session
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Don't render login page if authenticated (will redirect)
  if (status === "authenticated") {
    return null;
  }

  return (
    <Container className="max-w-lg w-full">
      <div className="space-y-6">
        {/* Logo */}
        <div className="text-center">
          <Link href="/" className="inline-block">
            <Image src="/logo.png" alt="Blogiz" width={64} height={64} className="mx-auto h-16 w-auto" priority />
          </Link>
        </div>

        {/* Login Card */}
        <div className="bg-white py-8 px-8 shadow-xl rounded-2xl">
          <h1 className="text-2xl font-bold text-neutral-900 text-center mb-2">Welcome Back</h1>
          <p className="text-sm text-neutral-500 text-center mb-8">Sign in to continue to Blogiz</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email Field */}
            <Input
              {...register("email")}
              id="email"
              type="email"
              label="Email Address"
              placeholder="your@email.com"
              icon={<FiMail className="w-5 h-5" />}
              error={errors.email?.message}
              disabled={isLoading}
              autoComplete="email"
              required
            />

            {/* Password Field */}
            <Input
              {...register("password")}
              id="password"
              type="password"
              label="Password"
              placeholder="Enter your password"
              icon={<FiLock className="w-5 h-5" />}
              error={errors.password?.message}
              disabled={isLoading}
              autoComplete="current-password"
              showTogglePassword
              required
            />

            {/* Remember Me */}
            <div className="flex items-center">
              <input
                {...register("remember")}
                type="checkbox"
                id="remember"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
                disabled={isLoading}
              />
              <label htmlFor="remember" className="ml-2 block text-sm text-neutral-700">
                Remember me
              </label>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm text-center">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              fullWidth
              className="rounded-full cursor-pointer"
            >
              {isLoading ? "Logging in..." : "Sign In"}
            </Button>
          </form>

          {/* Register Link */}
          <p className="mt-6 text-center text-sm text-neutral-600">
            Don&apos;t have an account?{" "}
            <Link
              href="/auth/register"
              className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </Container>
  );
}
