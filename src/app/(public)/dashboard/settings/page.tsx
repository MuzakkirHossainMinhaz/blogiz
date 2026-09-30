"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { hasPermission, UserRole } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { passwordSchema } from "@/lib/validation";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { FiUpload } from "react-icons/fi";

function SettingsSection({
  title,
  description,
  children,
  tone = "default",
  id,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  tone?: "default" | "danger" | "accent";
  id?: string;
  className?: string;
}) {
  const border =
    tone === "danger"
      ? "border-red-200"
      : tone === "accent"
        ? "border-primary-200 bg-primary-50/30"
        : "border-neutral-200 bg-white";

  const titleClass = tone === "danger" ? "text-red-700" : "text-ink";

  return (
    <section
      id={id}
      className={cn(`rounded-xl border ${border} p-4 sm:p-5 scroll-mt-24`, className)}
    >
      <div className="mb-3 shrink-0">
        <h2 className={`font-display text-base font-semibold tracking-tight ${titleClass}`}>{title}</h2>
        {description ? <p className="mt-0.5 text-sm text-accent-500">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const userId = session?.user?.id;
  const userRole = (session?.user?.role as UserRole) || "user";
  const emailVerified = Boolean(session?.user?.emailVerified);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");
  const [avatar, setAvatar] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
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
        setAvatar(data.user?.profile?.avatar || "");
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

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !userId) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("Avatar must be less than 5MB");
      return;
    }

    setAvatarUploading(true);
    setError("");
    setMessage("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("kind", "avatars");
      const uploadResponse = await fetch("/api/upload", { method: "POST", body: formData });
      const uploadResult = await uploadResponse.json().catch(() => ({}));
      if (!uploadResponse.ok) {
        setError(uploadResult.error || "Could not upload avatar");
        return;
      }

      const response = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: { avatar: uploadResult.url } }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(result.error || "Could not save avatar");
        return;
      }

      setAvatar(uploadResult.url);
      await update({ user: { avatar: uploadResult.url } });
      setMessage("Avatar updated");
    } catch {
      setError("Could not upload avatar");
    } finally {
      setAvatarUploading(false);
    }
  };

  const clearAvatar = async () => {
    if (!userId || !avatar) return;
    setError("");
    setMessage("");
    const response = await fetch(`/api/users/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile: { avatar: "" } }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(result.error || "Could not remove avatar");
      return;
    }
    setAvatar("");
    await update({ user: { avatar: "" } });
    setMessage("Avatar removed");
  };

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
    else {
      setMessage("Profile saved");
      await update({ user: { name } });
    }
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
    <div className="w-full space-y-4">
      <DashboardPageHeader title="Settings" description="Profile, sign-in, and account." />

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}
      {message ? (
        <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">{message}</p>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-4 items-stretch">
        <div className="flex flex-col gap-4 min-w-0 h-full">
          <form onSubmit={saveProfile} className="flex-1 flex flex-col min-h-0">
            <SettingsSection
              title="Profile"
              description="How you appear across Blogiz."
              className="flex-1 flex flex-col h-full"
            >
              <div className="flex flex-col gap-3 flex-1 min-h-0">
                <div className="flex items-center gap-3 shrink-0">
                  <UserAvatar src={avatar} name={name} size="lg" priority />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={avatarUploading}
                        onClick={() => avatarInputRef.current?.click()}
                      >
                        <FiUpload className="w-4 h-4" />
                        {avatarUploading ? "Uploading…" : "Upload photo"}
                      </Button>
                      {avatar ? (
                        <Button type="button" variant="ghost" size="sm" onClick={() => void clearAvatar()}>
                          Remove
                        </Button>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs text-accent-400">JPEG, PNG, or WebP · max 5MB</p>
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(event) => void uploadAvatar(event)}
                    />
                  </div>
                </div>

                <Input id="name" label="Name" value={name} onChange={(event) => setName(event.target.value)} required />
                <Textarea
                  id="bio"
                  label="Bio"
                  rows={8}
                  value={bio}
                  onChange={(event) => setBio(event.target.value)}
                  className="flex-1 flex flex-col min-h-0 [&>textarea]:flex-1 [&>textarea]:min-h-40 [&>textarea]:h-full [&>textarea]:resize-y"
                />
                <Input
                  id="website"
                  label="Portfolio website"
                  value={website}
                  onChange={(event) => setWebsite(event.target.value)}
                  placeholder="https://"
                />
                <Button type="submit" variant="primary" size="sm" className="self-start">
                  Save profile
                </Button>
              </div>
            </SettingsSection>
          </form>

          {(canRequestAuthor || canRequestAdmin) && (
            <form id="role-upgrade" onSubmit={requestUpgrade} className="shrink-0">
              <SettingsSection
                id="role-upgrade"
                tone="accent"
                title="Role upgrade"
                description={
                  canRequestAuthor
                    ? "Request the author role to draft and publish posts."
                    : "Request the admin role for moderation tools."
                }
              >
                <div className="space-y-3">
                  {upgradeStatus ? <p className="text-sm font-medium text-primary-800">{upgradeStatus}</p> : null}
                  <Textarea
                    id="upgradeReason"
                    label="Why should we upgrade you?"
                    value={upgradeReason}
                    onChange={(event) => setUpgradeReason(event.target.value)}
                    rows={3}
                    required
                  />
                  <Button type="submit" variant="primary" size="sm" disabled={Boolean(upgradeStatus)}>
                    {canRequestAuthor ? "Request author role" : "Request admin role"}
                  </Button>
                </div>
              </SettingsSection>
            </form>
          )}
        </div>

        <div className="flex flex-col gap-4 min-w-0 h-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch flex-1 min-h-0">
            <form onSubmit={changePassword} className="min-w-0 h-full flex flex-col">
              <SettingsSection
                title="Password"
                description="You’ll sign in again after changing it."
                className="h-full flex flex-col"
              >
                <div className="space-y-3 flex-1 flex flex-col">
                  <Input
                    id="currentPassword"
                    label="Current password"
                    type="password"
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    required
                  />
                  <Input
                    id="nextPassword"
                    label="New password"
                    type="password"
                    value={nextPassword}
                    onChange={(event) => setNextPassword(event.target.value)}
                    required
                  />
                  <Button type="submit" variant="primary" size="sm" className="mt-auto self-start">
                    Update password
                  </Button>
                </div>
              </SettingsSection>
            </form>

            <form onSubmit={changeEmail} className="min-w-0 h-full flex flex-col">
              <SettingsSection
                title="Email"
                description="Confirm via link before it applies."
                className="h-full flex flex-col"
              >
                <div className="space-y-3 flex-1 flex flex-col">
                  <Input
                    id="nextEmail"
                    label="New email"
                    type="email"
                    value={nextEmail}
                    onChange={(event) => setNextEmail(event.target.value)}
                    required
                  />
                  <Input
                    id="emailCurrentPassword"
                    label="Current password"
                    type="password"
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    required
                  />
                  <Button type="submit" variant="primary" size="sm" className="mt-auto self-start">
                    Send confirmation
                  </Button>
                </div>
              </SettingsSection>
            </form>
          </div>

          <form onSubmit={deleteAccount} className="shrink-0">
            <SettingsSection
              tone="danger"
              title="Delete account"
              description="Permanently removes your account and related content."
            >
              <div className="space-y-3">
                <Input
                  id="deletePassword"
                  label="Confirm password"
                  type="password"
                  value={deletePassword}
                  onChange={(event) => setDeletePassword(event.target.value)}
                  required
                />
                <Button type="submit" variant="danger" size="sm">
                  Delete account
                </Button>
              </div>
            </SettingsSection>
          </form>
        </div>
      </div>
    </div>
  );
}
