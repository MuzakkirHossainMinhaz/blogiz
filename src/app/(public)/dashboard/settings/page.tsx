"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { passwordSchema } from "@/lib/validation";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export default function SettingsPage() {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [nextPassword, setNextPassword] = useState("");
  const [nextEmail, setNextEmail] = useState("");
  const [deletePassword, setDeletePassword] = useState("");

  useEffect(() => {
    if (!userId) return;
    fetch(`/api/users/${userId}`)
      .then((response) => response.json())
      .then((data) => {
        setName(data.user?.name || "");
        setBio(data.user?.profile?.bio || "");
        setWebsite(data.user?.profile?.website || "");
      })
      .catch(() => setError("Could not load profile"));
  }, [userId]);

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!userId) return;
    setError("");
    setMessage("");
    const response = await fetch(`/api/users/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, profile: { bio, website } }),
    });
    const result = await response.json();
    if (!response.ok) setError(result.error || "Could not save profile");
    else setMessage("Profile saved");
  };

  const changePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = passwordSchema.safeParse(nextPassword);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || "Invalid password");
      return;
    }
    setError("");
    setMessage("");
    const response = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, password: nextPassword }),
    });
    const result = await response.json();
    if (!response.ok) setError(result.error || "Could not change password");
    else {
      setMessage("Password updated. Sign in again.");
      await signOut({ callbackUrl: "/auth/login" });
    }
  };

  const changeEmail = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");
    const response = await fetch("/api/auth/change-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: nextEmail, currentPassword }),
    });
    const result = await response.json();
    if (!response.ok) setError(result.error || "Could not change email");
    else setMessage(result.message);
  };

  const deleteAccount = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!userId) return;
    setError("");
    const response = await fetch(`/api/users/${userId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: deletePassword }),
    });
    const result = await response.json();
    if (!response.ok) setError(result.error || "Could not delete account");
    else await signOut({ callbackUrl: "/" });
  };

  return (
    <div className="space-y-8 max-w-xl">
      <h1 className="text-2xl font-bold text-neutral-900">Settings</h1>
      {error && <p className="text-sm text-red-700">{error}</p>}
      {message && <p className="text-sm text-green-700">{message}</p>}

      <form onSubmit={saveProfile} className="space-y-4 bg-white p-6 rounded-xl border border-neutral-200">
        <h2 className="font-semibold">Profile</h2>
        <Input id="name" label="Name" value={name} onChange={(event) => setName(event.target.value)} />
        <Input id="bio" label="Bio" value={bio} onChange={(event) => setBio(event.target.value)} />
        <Input id="website" label="Website" value={website} onChange={(event) => setWebsite(event.target.value)} placeholder="https://" />
        <Button type="submit" variant="primary">Save profile</Button>
      </form>

      <form onSubmit={changePassword} className="space-y-4 bg-white p-6 rounded-xl border border-neutral-200">
        <h2 className="font-semibold">Password</h2>
        <Input id="currentPassword" label="Current password" type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} />
        <Input id="nextPassword" label="New password" type="password" value={nextPassword} onChange={(event) => setNextPassword(event.target.value)} />
        <Button type="submit" variant="primary">Change password</Button>
      </form>

      <form onSubmit={changeEmail} className="space-y-4 bg-white p-6 rounded-xl border border-neutral-200">
        <h2 className="font-semibold">Email</h2>
        <Input id="nextEmail" label="New email" type="email" value={nextEmail} onChange={(event) => setNextEmail(event.target.value)} />
        <Button type="submit" variant="outline">Send confirmation</Button>
      </form>

      <form onSubmit={deleteAccount} className="space-y-4 bg-white p-6 rounded-xl border border-red-200">
        <h2 className="font-semibold text-red-700">Delete account</h2>
        <Input id="deletePassword" label="Confirm password" type="password" value={deletePassword} onChange={(event) => setDeletePassword(event.target.value)} />
        <Button type="submit" variant="outline">Delete account</Button>
      </form>
    </div>
  );
}
