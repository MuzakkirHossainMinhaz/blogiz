"use client";

import RichTextEditor from "@/components/dashboard/RichTextEditor";
import { Button } from "@/components/ui/Button";
import { renderMarkdown } from "@/lib/sanitize";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function EditBlogPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [blogImage, setBlogImage] = useState("");
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!params.id) return;
    fetch(`/api/blogs/${params.id}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not load post");
        setTitle(data.blog.title || "");
        setDescription(data.blog.description || "");
        setContent(data.blog.content || "");
        setAuthorName(data.blog.author_name || "");
        setBlogImage(data.blog.blog_image || "");
      })
      .catch(() => setError("Could not load post"));
  }, [params.id]);

  const save = async () => {
    setIsSaving(true);
    setError("");
    const response = await fetch(`/api/blogs/${params.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        content,
        author_name: authorName,
        ...(blogImage ? { blog_image: blogImage } : {}),
      }),
    });
    const result = await response.json();
    setIsSaving(false);
    if (!response.ok) {
      setError(result.error || "Could not save post");
      return;
    }
    router.push("/dashboard/blogs");
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900">Edit post</h1>
        <Link href="/dashboard/blogs" className="text-sm text-primary-600">
          Back
        </Link>
      </div>
      {error && <p className="text-sm text-red-700">{error}</p>}
      {preview ? (
        <div className="bg-white rounded-lg border border-neutral-200 p-8">
          <h2 className="text-3xl font-bold mb-4">{title}</h2>
          <div dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} />
          <Button className="mt-6" variant="outline" onClick={() => setPreview(false)}>
            Back to edit
          </Button>
        </div>
      ) : (
        <div className="space-y-4 bg-white p-6 rounded-xl border border-neutral-200">
          <label className="block text-sm font-medium text-neutral-700">
            Title
            <input className="mt-1 w-full border border-neutral-300 rounded-lg px-3 py-2" value={title} onChange={(event) => setTitle(event.target.value)} />
          </label>
          <label className="block text-sm font-medium text-neutral-700">
            Description
            <textarea className="mt-1 w-full border border-neutral-300 rounded-lg px-3 py-2" value={description} onChange={(event) => setDescription(event.target.value)} />
          </label>
          <label className="block text-sm font-medium text-neutral-700">
            Author name
            <input className="mt-1 w-full border border-neutral-300 rounded-lg px-3 py-2" value={authorName} onChange={(event) => setAuthorName(event.target.value)} />
          </label>
          <RichTextEditor value={content} onChange={setContent} />
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => setPreview(true)}>
              Preview
            </Button>
            <Button type="button" variant="primary" onClick={save} isLoading={isSaving}>
              Save
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
