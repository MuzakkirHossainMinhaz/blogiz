"use client";

import RichTextEditor from "@/components/dashboard/RichTextEditor";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
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
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-neutral-900">Edit post</h1>
        <Link href="/dashboard/blogs" className="inline-flex items-center min-h-11 text-sm font-medium text-primary-600">
          Back
        </Link>
      </div>
      {error && <p className="text-sm text-red-700">{error}</p>}
      {preview ? (
        <div className="bg-white rounded-lg border border-neutral-200 p-4 sm:p-6 md:p-8 overflow-hidden">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 break-words">{title}</h2>
          <div className="prose max-w-none break-words" dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} />
          <Button className="mt-6" variant="outline" onClick={() => setPreview(false)}>
            Back to edit
          </Button>
        </div>
      ) : (
        <div className="space-y-4 bg-white p-4 sm:p-6 rounded-xl border border-neutral-200">
          <Input label="Title" value={title} onChange={(event) => setTitle(event.target.value)} />
          <Textarea
            label="Description"
            rows={3}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
          <Input label="Author name" value={authorName} onChange={(event) => setAuthorName(event.target.value)} />
          <RichTextEditor value={content} onChange={setContent} />
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Button type="button" variant="outline" onClick={() => setPreview(true)} className="w-full sm:w-auto">
              Preview
            </Button>
            <Button type="button" variant="primary" onClick={save} isLoading={isSaving} className="w-full sm:w-auto">
              Save
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
