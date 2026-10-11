"use client";

import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/components/ui/Toast";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { useSessionStatus } from "@/hooks/useSessionStatus";
import { passwordSchema } from "@/lib/validation";
import { signOut } from "next-auth/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { FiAlertTriangle, FiUpload } from "react-icons/fi";

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={`rounded-2xl border border-neutral-200/90 bg-white p-5 sm:p-6 ${className}`}
    >
      {children}
    </section>
  );
}

function CardTitle({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-5">
      <h2 className="font-display text-lg font-semibold tracking-tight text-ink">{title}</h2>
      {description ? <p className="mt-1 text-sm text-accent-500">{description}</p> : null}
    </div>
  );
}

function SubSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-ink">{title}</h3>
        {description ? <p className="mt-0.5 text-xs text-accent-400">{description}</p> : null}
      </div>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const { session, update } = useSessionStatus();
  const toast = useToast();
  const userId = session?.user?.id;
  const currentEmail = session?.user?.email || "";
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");
  const [avatar, setAvatar] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [emailSaving, setEmailSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [nextPassword, setNextPassword] = useState("");
  const [nextEmail, setNextEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

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
      .catch(() => toast.error("Could not load profile"));
  }, [toast, userId]);

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !userId) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Avatar must be less than 5MB");
      return;
    }

    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("kind", "avatars");
      const uploadResponse = await fetch("/api/upload", { method: "POST", body: formData });
      const uploadResult = await uploadResponse.json().catch(() => ({}));
      if (!uploadResponse.ok) {
        toast.error(uploadResult.error || "Could not upload avatar");
        return;
      }

      const response = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: { avatar: uploadResult.url } }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast.error(result.error || "Could not save avatar");
        return;
      }

      setAvatar(uploadResult.url);
      await update({ user: { avatar: uploadResult.url } });
      toast.success("Avatar updated");
    } catch {
      toast.error("Could not upload avatar");
    } finally {
      setAvatarUploading(false);
    }
  };

  const clearAvatar = async () => {
    if (!userId || !avatar) return;
    const response = await fetch(`/api/users/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile: { avatar: "" } }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      toast.error(result.error || "Could not remove avatar");
      return;
    }
    setAvatar("");
    await update({ user: { avatar: "" } });
    toast.success("Avatar removed");
  };

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!userId || profileSaving) return;
    setProfileSaving(true);
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, profile: { bio, website } }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast.error(result.error || "Could not save profile");
        return;
      }
      await update({ user: { name } });
      toast.success("Profile saved");
    } catch {
      toast.error("Could not save profile");
    } finally {
      setProfileSaving(false);
    }
  };

  const changePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (passwordSaving) return;
    const parsed = passwordSchema.safeParse(nextPassword);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || "Invalid password");
      return;
    }
    setPasswordSaving(true);
    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, password: nextPassword }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast.error(result.error || "Could not change password");
        return;
      }
      toast.success("Password updated. Sign in again.");
      await signOut({ callbackUrl: "/auth/login" });
    } catch {
      toast.error("Could not change password");
    } finally {
      setPasswordSaving(false);
    }
  };

  const changeEmail = async (event: React.FormEvent) => {
    event.preventDefault();
    if (emailSaving) return;
    setEmailSaving(true);
    try {
      const response = await fetch("/api/auth/change-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: nextEmail, currentPassword: emailPassword }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast.error(result.error || "Could not change email");
        return;
      }
      toast.success(typeof result.message === "string" ? result.message : "Confirmation email sent");
      setEmailPassword("");
      setNextEmail("");
    } catch {
      toast.error("Could not change email");
    } finally {
      setEmailSaving(false);
    }
  };

  const openDeleteModal = () => {
    setDeletePassword("");
    setDeleteOpen(true);
  };

  const closeDeleteModal = () => {
    if (deleteSubmitting) return;
    setDeleteOpen(false);
    setDeletePassword("");
  };

  const deleteAccount = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!userId) return;
    setDeleteSubmitting(true);
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: deletePassword }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast.error(result.error || "Could not delete account");
        return;
      }
      await signOut({ callbackUrl: "/" });
    } catch {
      toast.error("Could not delete account");
    } finally {
      setDeleteSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      <DashboardPageHeader
        title="Settings"
        description="Manage your profile, sign-in details, and account."
      />

      <div className="grid grid-cols-1 items-stretch gap-5 lg:grid-cols-2">
        {/* Profile */}
        <form onSubmit={saveProfile} className="flex h-full min-w-0 flex-col">
          <Card className="flex h-full flex-col">
            <CardTitle
              title="Profile"
              description="How you appear across Blogiz."
            />

            <div className="flex items-center gap-4">
              <UserAvatar src={avatar} name={name} size="xl" priority />
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-base font-semibold text-ink">
                  {name || "Your name"}
                </p>
                {currentEmail ? (
                  <p className="mt-0.5 truncate text-sm text-accent-500">{currentEmail}</p>
                ) : null}
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={avatarUploading}
                    onClick={() => avatarInputRef.current?.click()}
                  >
                    <FiUpload className="h-4 w-4" />
                    {avatarUploading ? "Uploading…" : "Upload photo"}
                  </Button>
                  {avatar ? (
                    <Button type="button" variant="ghost" size="sm" onClick={() => void clearAvatar()}>
                      Remove
                    </Button>
                  ) : null}
                </div>
                <p className="mt-1.5 text-xs text-accent-400">JPEG, PNG, or WebP · max 5MB</p>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(event) => void uploadAvatar(event)}
                />
              </div>
            </div>

            <div className="mt-6 flex min-h-0 flex-1 flex-col gap-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Input
                  id="name"
                  label="Name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                />
                <Input
                  id="website"
                  label="Portfolio website"
                  value={website}
                  onChange={(event) => setWebsite(event.target.value)}
                  placeholder="https://"
                />
              </div>
              <Textarea
                id="bio"
                label="Bio"
                fill
                value={bio}
                onChange={(event) => setBio(event.target.value)}
              />
              <div className="flex justify-end pt-1">
                <Button type="submit" variant="primary" size="sm" isLoading={profileSaving} disabled={profileSaving}>
                  Save profile
                </Button>
              </div>
            </div>
          </Card>
        </form>

        {/* Security — one card, password then email */}
        <Card className="flex h-full min-w-0 flex-col">
          <CardTitle
            title="Security"
            description="Update your password and email."
          />

          <div className="flex flex-1 flex-col gap-6">
            <form onSubmit={changePassword} className="space-y-3">
              <SubSection title="Password" description="You’ll sign in again after changing it.">
                <div className="space-y-3">
                  <Input
                    id="currentPassword"
                    label="Current password"
                    type="password"
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    showTogglePassword
                    required
                  />
                  <Input
                    id="nextPassword"
                    label="New password"
                    type="password"
                    value={nextPassword}
                    onChange={(event) => setNextPassword(event.target.value)}
                    showTogglePassword
                    required
                  />
                  <div className="flex justify-end pt-1">
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      isLoading={passwordSaving}
                      disabled={passwordSaving}
                    >
                      Update password
                    </Button>
                  </div>
                </div>
              </SubSection>
            </form>

            <div className="border-t border-neutral-100" />

            <form onSubmit={changeEmail} className="space-y-3">
              <SubSection title="Email" description="Confirm via link before it applies.">
                <div className="space-y-3">
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
                    value={emailPassword}
                    onChange={(event) => setEmailPassword(event.target.value)}
                    showTogglePassword
                    required
                  />
                  <div className="flex justify-end pt-1">
                    <Button type="submit" variant="primary" size="sm" isLoading={emailSaving} disabled={emailSaving}>
                      Send confirmation
                    </Button>
                  </div>
                </div>
              </SubSection>
            </form>
          </div>
        </Card>
      </div>

      {/* Danger zone — full width, quiet */}
      <div className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-red-800">Delete account</p>
          <p className="mt-0.5 text-sm text-red-700/80">
            Permanently remove your account and related content. This cannot be undone.
          </p>
        </div>
        <Button type="button" variant="danger" size="sm" onClick={openDeleteModal} className="shrink-0">
          Delete account
        </Button>
      </div>

      <Modal
        open={deleteOpen}
        onClose={closeDeleteModal}
        title="Delete account"
        description="Enter your password to permanently delete this account."
        size="sm"
      >
        <form onSubmit={deleteAccount} className="space-y-5">
          <div className="flex items-start gap-2.5 rounded-xl border border-red-100 bg-red-50/70 px-3.5 py-3 text-sm text-red-700">
            <FiAlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <p>All of your profile data and related content will be removed.</p>
          </div>

          <Input
            id="deletePassword"
            label="Confirm password"
            type="password"
            value={deletePassword}
            onChange={(event) => setDeletePassword(event.target.value)}
            showTogglePassword
            required
            autoComplete="current-password"
          />

          <div className="flex flex-col-reverse gap-2 border-t border-neutral-100 pt-4 sm:flex-row sm:justify-end sm:gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={closeDeleteModal}
              disabled={deleteSubmitting}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              size="sm"
              isLoading={deleteSubmitting}
              className="w-full sm:w-auto"
            >
              Delete forever
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
