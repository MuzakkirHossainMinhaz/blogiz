"use client";

import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Input } from "@/components/ui/Input";
import { passwordSchema } from "@/lib/validation";
import Link from "next/link";
import { useState } from "react";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = passwordSchema.safeParse(password);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || "Invalid password");
      return;
    }
    setIsLoading(true);
    setError("");
    const token = new URLSearchParams(window.location.search).get("token");
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const result = await response.json();
      if (!response.ok) setError(result.error || "Something went wrong");
      else setMessage(result.message);
    } catch {
      setError("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container className="max-w-lg w-full">
      <div className="bg-white py-6 px-4 sm:py-8 sm:px-8 shadow-xl rounded-2xl">
        <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 text-center mb-6">Choose a new password</h1>
        {error && <p className="mb-4 text-sm text-red-700 text-center">{error}</p>}
        {message && <p className="mb-4 text-sm text-green-700 text-center">{message}</p>}
        <form onSubmit={onSubmit} className="space-y-4">
          <Input id="password" label="New password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          <Button type="submit" variant="primary" fullWidth isLoading={isLoading}>
            Update password
          </Button>
        </form>
        <p className="mt-6 text-center text-sm">
          <Link href="/auth/login" className="text-primary-600">
            Back to sign in
          </Link>
        </p>
      </div>
    </Container>
  );
}
