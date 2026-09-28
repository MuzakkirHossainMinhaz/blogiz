import { isSafeNavigationUrl, isStoredImageUrl } from "@/lib/urls";

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
