import { isSafeNavigationUrl, isStoredImageUrl } from "@/lib/urls";

const ALLOWED_TAGS = new Set([
  "p",
  "br",
  "hr",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "ul",
  "ol",
  "li",
  "h1",
  "h2",
  "h3",
  "h4",
  "a",
  "img",
  "code",
  "pre",
  "blockquote",
]);

export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeHref(escapedHref: string): string | null {
  const decoded = escapedHref.replace(/&amp;/g, "&").replace(/&quot;/g, '"');
  if (!isSafeNavigationUrl(decoded)) return null;
  return escapeHtml(decoded);
}

function extractAttr(attrs: string, name: string): string | null {
  const match = attrs.match(new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));
  if (!match) return null;
  return match[2] ?? match[3] ?? match[4] ?? null;
}

/** True when the source already looks like HTML (seeded posts, pasted HTML). */
export function looksLikeHtml(input: string): boolean {
  const trimmed = input.trim();
  if (!trimmed.startsWith("<")) return false;
  return /<\/?(?:p|div|h[1-6]|ul|ol|li|br|strong|em|b|i|a|img|blockquote|pre|code)\b/i.test(trimmed);
}

/**
 * Allowlist sanitizer for stored HTML blog bodies.
 * Drops unknown tags/attrs and unsafe href/src values.
 */
export function sanitizeHtml(html: string): string {
  const withoutComments = html.replace(/<!--[\s\S]*?-->/g, "");
  return withoutComments.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g, (match, rawTag: string, attrs: string) => {
    const tag = rawTag.toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) return "";

    const isClose = match.startsWith("</");
    if (isClose) return `</${tag}>`;

    if (tag === "br" || tag === "hr") return `<${tag} />`;

    if (tag === "a") {
      const href = extractAttr(attrs, "href");
      if (!href) return "<a>";
      const safe = safeHref(escapeHtml(href));
      if (!safe) return "<a>";
      return `<a href="${safe}" rel="noopener noreferrer nofollow">`;
    }

    if (tag === "img") {
      const src = extractAttr(attrs, "src");
      const alt = extractAttr(attrs, "alt") ?? "";
      if (!src) return "";
      const decoded = src.replace(/&amp;/g, "&");
      if (!isStoredImageUrl(decoded) && !isSafeNavigationUrl(decoded)) return "";
      return `<img src="${escapeHtml(decoded)}" alt="${escapeHtml(alt)}" />`;
    }

    return `<${tag}>`;
  });
}

/**
 * Render a Markdown subset to HTML.
 * The source is escaped first, so raw HTML and script cannot survive.
 */
export function renderMarkdown(markdown: string): string {
  const escaped = escapeHtml(markdown.replace(/\r\n/g, "\n"));
  const lines = escaped.split("\n");
  const html: string[] = [];
  let inList = false;

  const closeList = () => {
    if (inList) {
      html.push("</ul>");
      inList = false;
    }
  };

  for (const line of lines) {
    const listItem = line.match(/^- (.*)$/);
    if (listItem) {
      if (!inList) {
        html.push("<ul>");
        inList = true;
      }
      html.push(`<li>${inlineMarkdown(listItem[1])}</li>`);
      continue;
    }

    closeList();
    if (line.trim() === "") {
      continue;
    }

    const heading = line.match(/^(#{1,3}) (.*)$/);
    if (heading) {
      const level = heading[1].length;
      html.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`);
      continue;
    }

    html.push(`<p>${inlineMarkdown(line)}</p>`);
  }

  closeList();
  return html.join("");
}

/**
 * Blog bodies may be Markdown (editor) or HTML (seeds / pasted).
 * Pick the safe renderer for each.
 */
export function renderContent(source: string): string {
  if (!source) return "";
  if (looksLikeHtml(source)) return sanitizeHtml(source);
  return renderMarkdown(source);
}

function inlineMarkdown(text: string): string {
  return text
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_match, alt: string, href: string) => {
      const decoded = href.replace(/&amp;/g, "&");
      if (!isStoredImageUrl(decoded) && !isSafeNavigationUrl(decoded)) return alt;
      return `<img src="${escapeHtml(decoded)}" alt="${alt}" />`;
    })
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, label: string, href: string) => {
      const safe = safeHref(href);
      if (!safe) return label;
      return `<a href="${safe}" rel="noopener noreferrer nofollow">${label}</a>`;
    })
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>");
}
