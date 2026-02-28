"use client";

import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { FiEdit3, FiLock, FiMail, FiUser, FiUsers } from "react-icons/fi";
import { z } from "zod";

const registerSchema = z
  .object({
    name: z.string().min(1, "Username is required"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Confirm password is required"),
    fullName: z.string().min(1, "Full name is required"),
    role: z.enum(["user", "author"]),
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
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: "user",
    },
  });

  const selectedRole = watch("role");

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
          role: data.role,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess(result.message);
        setTimeout(() => {
          router.push("/auth/login");
        }, 2000);
      } else {
        setError(result.error || "Registration failed");
      }
    } catch (error) {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container className="max-w-2xl w-full">
      <div className="space-y-6">
        {/* Logo */}
        <div className="text-center">
          <Link href="/" className="inline-block">
            <Image src="/logo.png" alt="Blogiz" width={64} height={64} className="mx-auto h-16 w-auto" priority />
          </Link>
        </div>

        {/* Registration Card */}
        <div className="bg-white py-8 px-8 shadow-xl rounded-2xl">
          <h1 className="text-2xl font-bold text-neutral-900 text-center mb-2">Create Account</h1>
          <p className="text-sm text-neutral-500 text-center mb-8">Join Blogiz today</p>

          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 text-sm text-center">{success}</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm text-center">{error}</p>
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Name */}
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

            {/* Full Name & Email - 2 columns on md+ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Full Name */}
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

              {/* Email */}
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

            {/* Role Selection */}
            <Select
              {...register("role")}
              label="Account Type"
              error={errors.role?.message}
              disabled={isLoading}
              icon={<FiUsers className="w-5 h-5" />}
              options={[
                { value: "user", label: "Reader - Can read and comment on blogs" },
                { value: "author", label: "Author - Can write and manage blogs" },
              ]}
            />
            {selectedRole === "author" && (
              <p className="text-sm text-amber-600 -mt-2">
                <strong>Note:</strong> Author accounts require admin approval before you can publish blogs.
              </p>
            )}

            {/* Password Fields - 2 columns on md+ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Password */}
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

              {/* Confirm Password */}
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

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              fullWidth
              className="rounded-full cursor-pointer"
            >
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>

          {/* Login Link */}
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
