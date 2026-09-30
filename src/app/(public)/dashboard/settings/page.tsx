"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { hasPermission, UserRole } from "@/lib/permissions";
import { passwordSchema } from "@/lib/validation";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export default function SettingsPage() {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const userRole = (session?.user?.role as UserRole) || "user";
  const emailVerified = Boolean(session?.user?.emailVerified);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [nextPassword, setNextPassword] = useState("");
  const [nextEmail, setNextEmail] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [upgradeReason, setUpgradeReason] = useState("");
  const [upgradeStatus, setUpgradeStatus] = useState<string | null>(null);

  const canRequestAuthor = userRole === "user";
  const canRequestAdmin = userRole === "author" && hasPermission(userRole, "createBlog");

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

  useEffect(() => {
    if (!canRequestAuthor && !canRequestAdmin) return;
    fetch("/api/user/role-upgrade")
      .then((response) => response.json())
      .then((data) => {
        const pending = Array.isArray(data.requests)
          ? data.requests.find((r: { status: string }) => r.status === "pending")
          : null;
        setUpgradeStatus(pending ? `Pending ${pending.requestedRole} request` : null);
      })
      .catch(() => {
        /* ignore */
      });
  }, [canRequestAuthor, canRequestAdmin]);

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

  const requestUpgrade = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!emailVerified) {
      setError("Verify your email before requesting a role upgrade.");
      return;
    }
    const requestedRole = canRequestAuthor ? "author" : "admin";
    const response = await fetch("/api/user/role-upgrade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestedRole, reason: upgradeReason }),
    });
    const result = await response.json();
    if (!response.ok) setError(result.error || "Could not submit request");
    else {
      setMessage("Role upgrade request submitted.");
      setUpgradeStatus(`Pending ${requestedRole} request`);
      setUpgradeReason("");
    }
  };

  return (
    <div className="w-full space-y-8">
      <header className="space-y-1">
        <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-ink">Settings</h1>
        <p className="text-sm sm:text-base text-accent-500 max-w-2xl">
          Manage your profile, sign-in details, and account.
        </p>
      </header>

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}
      {message && (
        <p className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{message}</p>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <form
          onSubmit={saveProfile}
          className="space-y-4 rounded-2xl border border-neutral-200 bg-surface p-5 sm:p-6 shadow-soft"
        >
          <div>
            <h2 className="font-display text-lg font-semibold text-ink">Profile</h2>
            <p className="mt-1 text-sm text-accent-500">How you appear across Blogiz.</p>
          </div>
          <Input id="name" label="Name" value={name} onChange={(event) => setName(event.target.value)} />
          <Input id="bio" label="Bio" value={bio} onChange={(event) => setBio(event.target.value)} />
          <Input
            id="website"
            label="Website"
            value={website}
            onChange={(event) => setWebsite(event.target.value)}
            placeholder="https://"
          />
          <Button type="submit" variant="primary" className="min-h-11">
            Save profile
          </Button>
        </form>

        <form
          onSubmit={changePassword}
          className="space-y-4 rounded-2xl border border-neutral-200 bg-surface p-5 sm:p-6 shadow-soft"
        >
          <div>
            <h2 className="font-display text-lg font-semibold text-ink">Password</h2>
            <p className="mt-1 text-sm text-accent-500">You will need to sign in again after changing it.</p>
          </div>
          <Input
            id="currentPassword"
            label="Current password"
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
          />
          <Input
            id="nextPassword"
            label="New password"
            type="password"
            value={nextPassword}
            onChange={(event) => setNextPassword(event.target.value)}
          />
          <Button type="submit" variant="primary" className="min-h-11">
            Change password
          </Button>
        </form>

        <form
          onSubmit={changeEmail}
          className="space-y-4 rounded-2xl border border-neutral-200 bg-surface p-5 sm:p-6 shadow-soft"
        >
          <div>
            <h2 className="font-display text-lg font-semibold text-ink">Email</h2>
            <p className="mt-1 text-sm text-accent-500">We send a confirmation link before the change applies.</p>
          </div>
          <Input
            id="nextEmail"
            label="New email"
            type="email"
            value={nextEmail}
            onChange={(event) => setNextEmail(event.target.value)}
          />
          <Input
            id="emailCurrentPassword"
            label="Current password"
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
          />
          <Button type="submit" variant="outline" className="min-h-11">
            Send confirmation
          </Button>
        </form>

        {(canRequestAuthor || canRequestAdmin) && (
          <form
            id="role-upgrade"
            onSubmit={requestUpgrade}
            className="space-y-4 rounded-2xl border border-primary-200 bg-primary-50/40 p-5 sm:p-6 scroll-mt-24"
          >
            <div>
              <h2 className="font-display text-lg font-semibold text-ink">Role upgrade</h2>
              <p className="mt-1 text-sm text-accent-500">
                {canRequestAuthor
                  ? "Request the author role to draft and publish posts."
                  : "Request the admin role for moderation tools."}
              </p>
              {upgradeStatus && <p className="mt-2 text-sm font-medium text-primary-800">{upgradeStatus}</p>}
            </div>
            <Textarea
              id="upgradeReason"
              label="Why should we upgrade you?"
              value={upgradeReason}
              onChange={(event) => setUpgradeReason(event.target.value)}
              rows={4}
              required
            />
            <Button type="submit" variant="primary" className="min-h-11" disabled={Boolean(upgradeStatus)}>
              {canRequestAuthor ? "Request author role" : "Request admin role"}
            </Button>
          </form>
        )}

        <form
          onSubmit={deleteAccount}
          className="space-y-4 rounded-2xl border border-red-200 bg-surface p-5 sm:p-6"
        >
          <div>
            <h2 className="font-display text-lg font-semibold text-red-700">Delete account</h2>
            <p className="mt-1 text-sm text-accent-500">This permanently removes your account and related content.</p>
          </div>
          <Input
            id="deletePassword"
            label="Confirm password"
            type="password"
            value={deletePassword}
            onChange={(event) => setDeletePassword(event.target.value)}
          />
          <Button type="submit" variant="outline" className="min-h-11">
            Delete account
          </Button>
        </form>
      </div>
    </div>
  );
}
