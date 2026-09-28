"use client";

import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import Link from "next/link";
import { useState } from "react";

export default function VerifyEmailPage() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const onVerify = async () => {
    setIsLoading(true);
    setError("");
    const token = new URLSearchParams(window.location.search).get("token");
    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
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
      <div className="bg-white py-8 px-8 shadow-xl rounded-2xl text-center">
        <h1 className="text-2xl font-bold text-neutral-900 mb-4">Verify email</h1>
        {error && <p className="mb-4 text-sm text-red-700">{error}</p>}
        {message && <p className="mb-4 text-sm text-green-700">{message}</p>}
        <Button type="button" variant="primary" onClick={onVerify} isLoading={isLoading}>
          Confirm email
        </Button>
        <p className="mt-6 text-sm">
          <Link href="/auth/login" className="text-primary-600">
            Back to sign in
          </Link>
        </p>
      </div>
    </Container>
  );
}
