"use client";

import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Pagination } from "@/components/ui/Pagination";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { FieldRequiredMark } from "@/components/ui/FieldRequiredMark";
import { fieldErrorClassName, fieldLabelClassName } from "@/lib/field-styles";
import { cn } from "@/lib/utils";
import { hasPermission, UserRole } from "@/lib/permissions";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { FiArrowLeft, FiImage, FiTrash2, FiUpload } from "react-icons/fi";

type BannerRow = {
  _id: string;
  title: string;
  subtitle?: string;
  description?: string;
  image: string;
  ctaText?: string;
  ctaLink?: string;
  isActive: boolean;
  order: number;
  type: string;
};

const BANNER_TYPE_OPTIONS = [
  { value: "hero", label: "Hero" },
  { value: "featured", label: "Featured" },
  { value: "announcement", label: "Announcement" },
  { value: "promotion", label: "Promotion" },
];

function typeLabel(type: string) {
  return BANNER_TYPE_OPTIONS.find((option) => option.value === type)?.label ?? type;
}

export default function AdminBannersPage() {
  const { data: session, status } = useSession();
  const role = (session?.user?.role as UserRole) || "user";
  const canManage = hasPermission(role, "manageBanners");

  const [banners, setBanners] = useState<BannerRow[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [ctaText, setCtaText] = useState("");
  const [ctaLink, setCtaLink] = useState("");
  const [type, setType] = useState("hero");
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/banners?page=${page}&limit=10`);
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error || "Could not load banners");
        return;
      }
      setBanners(Array.isArray(data.banners) ? data.banners : []);
      setPages(data.pagination?.pages || 1);
      setTotal(data.pagination?.total || 0);
    } catch {
      setError("Could not load banners");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    if (status === "loading" || !canManage) return;
    void load();
  }, [status, canManage, load]);

  if (status === "loading") {
    return (
      <div className="flex justify-center min-h-100 items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!canManage) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-red-700">You do not have permission to manage banners.</p>
        <Link href="/dashboard/admin" className="text-sm font-medium text-primary-600">
          Back to Admin
        </Link>
      </div>
    );
  }

  const uploadImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be less than 5MB");
      return;
    }
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/admin/banners/upload", { method: "POST", body: formData });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(result.error || "Upload failed");
        return;
      }
      setImage(result.url);
    } catch {
      setError("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const createBanner = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/banners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          subtitle,
          description,
          image,
          ctaText,
          ctaLink: ctaLink || undefined,
          type,
          isActive: true,
          order: 0,
          targetAudience: "all",
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(result.error || "Could not create banner");
        return;
      }
      setTitle("");
      setSubtitle("");
      setDescription("");
      setImage("");
      setCtaText("");
      setCtaLink("");
      setType("hero");
      setMessage("Banner created");
      setPage(1);
      await load();
    } catch {
      setError("Could not create banner");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (banner: BannerRow) => {
    setError("");
    const response = await fetch(`/api/admin/banners/${banner._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !banner.isActive }),
    });
    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      setError(result.error || "Could not update banner");
      return;
    }
    await load();
  };

  const removeBanner = async (id: string) => {
    if (!window.confirm("Delete this banner?")) return;
    setError("");
    const response = await fetch(`/api/admin/banners/${id}`, { method: "DELETE" });
    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      setError(result.error || "Could not delete banner");
      return;
    }
    await load();
  };

  return (
    <div className="w-full space-y-6">
      <DashboardPageHeader
        title="Banners"
        description="Home hero carousel images and calls to action."
        actions={
          <Link href="/dashboard/admin">
            <Button variant="ghost" size="sm">
              <FiArrowLeft className="h-4 w-4" />
              Admin Panel
            </Button>
          </Link>
        }
      />

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      ) : null}
      {message ? (
        <p className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{message}</p>
      ) : null}

      <form onSubmit={(event) => void createBanner(event)} className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-display text-base font-semibold tracking-tight text-ink">New Banner</h2>
            <p className="mt-0.5 text-sm text-accent-500">Copy, CTA, and a wide hero image.</p>
          </div>
          <Button type="submit" variant="primary" size="sm" disabled={saving || !title.trim() || !image}>
            {saving ? "Creating…" : "Create Banner"}
          </Button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)] gap-4 items-stretch">
          <div className="rounded-xl border border-neutral-200 bg-white p-4 sm:p-5 space-y-4 h-full">
            <div>
              <h3 className="text-sm font-semibold text-ink">Content</h3>
              <p className="mt-0.5 text-xs text-accent-400">What visitors read on the slide.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                id="banner-title"
                label="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Headline for the slide"
                required
              />
              <Input
                id="banner-subtitle"
                label="Subtitle"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Short eyebrow or kicker"
              />
            </div>

            <Textarea
              id="banner-description"
              label="Description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional supporting line"
            />

            <div className="border-t border-neutral-100 pt-4 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-ink">Call To Action</h3>
                <p className="mt-0.5 text-xs text-accent-400">Button label, link, and banner type.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  id="banner-type"
                  label="Type"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  options={BANNER_TYPE_OPTIONS}
                />
                <Input
                  id="banner-cta-text"
                  label="Button Text"
                  value={ctaText}
                  onChange={(e) => setCtaText(e.target.value)}
                  placeholder="Read more"
                />
              </div>

              <Input
                id="banner-cta-link"
                label="Button Link"
                value={ctaLink}
                onChange={(e) => setCtaLink(e.target.value)}
                placeholder="/blogs"
              />
            </div>
          </div>

          <aside className="rounded-xl border border-neutral-200 bg-white p-4 sm:p-5 flex flex-col gap-3 h-full min-h-0">
            <div className="shrink-0">
              <p className={fieldLabelClassName}>
                Banner Image
                <FieldRequiredMark />
              </p>
              <p className="text-xs text-accent-400 -mt-1">JPEG, PNG, or WebP · max 5MB · wide crop works best</p>
            </div>

            <div
              className={cn(
                "relative flex-1 min-h-48 overflow-hidden rounded-xl border",
                image ? "border-neutral-200" : "border-dashed border-neutral-300 bg-neutral-50"
              )}
            >
              {image ? (
                <Image
                  src={image}
                  alt="Banner preview"
                  fill
                  priority
                  className="object-cover"
                  sizes="400px"
                />
              ) : (
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => fileRef.current?.click()}
                  className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4 text-center text-sm text-accent-400 hover:bg-neutral-100/60 transition-colors disabled:opacity-50"
                >
                  <FiImage className="h-8 w-8 text-primary-400" />
                  <span>Click to upload a hero image</span>
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
              >
                <FiUpload className="w-4 h-4" />
                {uploading ? "Uploading…" : image ? "Replace Image" : "Upload Image"}
              </Button>
              {image ? (
                <Button type="button" variant="ghost" size="sm" onClick={() => setImage("")}>
                  Clear
                </Button>
              ) : null}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => void uploadImage(e)}
            />
          </aside>
        </div>
      </form>

      <section className="space-y-4">
        <div className="min-w-0">
          <h2 className="font-display text-base font-semibold tracking-tight text-ink">Existing Banners</h2>
          <p className="mt-0.5 text-sm text-accent-500">
            {loading ? "Loading…" : `${total} banner${total === 1 ? "" : "s"}`}
          </p>
        </div>

        {loading ? (
          <div className="rounded-xl border border-neutral-200 bg-white p-10 text-center text-sm text-accent-500">
            Loading banners…
          </div>
        ) : banners.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-10 text-center">
            <FiImage className="mx-auto h-10 w-10 text-primary-400" />
            <p className="mt-3 font-medium text-ink">No Banners Yet</p>
            <p className="mt-1 text-sm text-accent-500">Create one above to populate the home carousel.</p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {banners.map((banner, index) => (
              <li
                key={banner._id}
                className="rounded-xl border border-neutral-200 bg-white overflow-hidden flex flex-col"
              >
                <div className="relative aspect-video bg-neutral-100">
                  <Image
                    src={banner.image}
                    alt={banner.title}
                    fill
                    priority={index === 0 && !image}
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/55 to-transparent p-3 pt-8">
                    <p className="font-semibold text-white line-clamp-1">{banner.title}</p>
                    {banner.subtitle ? (
                      <p className="text-xs text-white/85 line-clamp-1 mt-0.5">{banner.subtitle}</p>
                    ) : null}
                  </div>
                  <span
                    className={cn(
                      "absolute top-3 left-3 rounded-lg px-2 py-0.5 text-xs font-medium",
                      banner.isActive
                        ? "bg-green-50 text-green-800 border border-green-200"
                        : "bg-neutral-100 text-neutral-600 border border-neutral-200"
                    )}
                  >
                    {banner.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="p-4 flex flex-col gap-3 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-accent-500">
                    <span className="rounded-lg border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-neutral-700">
                      {typeLabel(banner.type)}
                    </span>
                    <span>Order {banner.order}</span>
                    {banner.ctaText ? <span>· {banner.ctaText}</span> : null}
                  </div>

                  {banner.description ? (
                    <p className="text-sm text-neutral-600 line-clamp-2">{banner.description}</p>
                  ) : (
                    <p className="text-sm text-accent-400">No description</p>
                  )}

                  <div className="mt-auto flex flex-wrap gap-2 pt-1">
                    <Button type="button" variant="outline" size="sm" onClick={() => void toggleActive(banner)}>
                      {banner.isActive ? "Deactivate" : "Activate"}
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => void removeBanner(banner._id)}>
                      <FiTrash2 className="w-4 h-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        {pages > 1 ? (
          <div className="rounded-xl border border-neutral-200 bg-white px-4 sm:px-5 py-3">
            <Pagination page={page} pages={pages} total={total} onPageChange={setPage} />
          </div>
        ) : null}
      </section>
    </div>
  );
}
