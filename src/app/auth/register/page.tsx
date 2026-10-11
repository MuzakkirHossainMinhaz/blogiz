"use client";

import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Input } from "@/components/ui/Input";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { FiEdit3, FiLock, FiMail, FiUser } from "react-icons/fi";
import { passwordSchema } from "@/lib/validation";
import { z } from "zod";

const registerSchema = z
  .object({
    name: z.string().min(1, "Username is required"),
    email: z.string().email("Invalid email address"),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Confirm password is required"),
    fullName: z.string().min(1, "Full name is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
          fullName: data.fullName,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess(result.message);
        setTimeout(() => {
          router.push("/auth/login");
        }, 2000);
      } else {
        setError(result.message || "Registration failed");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container className="max-w-2xl w-full">
      <div className="space-y-6">
        <div className="text-center">
          <Link href="/" className="inline-block">
            <Image src="/logo.png" alt="Blogiz" width={64} height={64} className="mx-auto h-16 w-auto" priority />
          </Link>
        </div>

        <div className="bg-surface py-6 px-4 sm:py-8 sm:px-8 shadow-soft-lg border border-neutral-200 rounded-2xl">
          <h1 className="font-display text-xl sm:text-2xl font-semibold text-ink tracking-tight text-center mb-2">
            Create Account
          </h1>
          <p className="text-sm text-accent-500 text-center mb-8">
            Join Blogiz as a reader. You can request an author upgrade later from Settings.
          </p>

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
              <p className="text-green-800 text-sm text-center">{success}</p>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-800 text-sm text-center">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              {...register("name")}
              type="text"
              label="Username"
              placeholder="Choose a username"
              icon={<FiUser className="w-5 h-5" />}
              error={errors.name?.message}
              disabled={isLoading}
              required
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                {...register("fullName")}
                type="text"
                label="Full Name"
                placeholder="Enter your full name"
                icon={<FiEdit3 className="w-5 h-5" />}
                error={errors.fullName?.message}
                disabled={isLoading}
                required
              />

              <Input
                {...register("email")}
                type="email"
                label="Email Address"
                placeholder="your@email.com"
                icon={<FiMail className="w-5 h-5" />}
                error={errors.email?.message}
                disabled={isLoading}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                {...register("password")}
                type="password"
                label="Password"
                placeholder="Create a password"
                icon={<FiLock className="w-5 h-5" />}
                error={errors.password?.message}
                disabled={isLoading}
                showTogglePassword
                required
              />

              <Input
                {...register("confirmPassword")}
                type="password"
                label="Confirm Password"
                placeholder="Confirm your password"
                icon={<FiLock className="w-5 h-5" />}
                error={errors.confirmPassword?.message}
                disabled={isLoading}
                showTogglePassword
                required
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              fullWidth
              className="rounded-xl cursor-pointer"
            >
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-neutral-600">
            Already have an account?{" "}
            <Link href="/auth/login" className="font-medium text-primary-600 hover:text-primary-500 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </Container>
  );
}
