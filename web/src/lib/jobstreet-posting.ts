import { formatJobDescription } from "./job-detail.ts";

function readPostingField(html: string, field: string): string {
  const opening = new RegExp(`<([a-z][\\w-]*)\\b[^>]*\\bdata-automation=["']${field}["'][^>]*>`, "i").exec(html);
  if (!opening) return "";

  const tag = opening[1];
  const contentStart = opening.index + opening[0].length;
  const tags = new RegExp(`</?${tag}\\b[^>]*>`, "gi");
  tags.lastIndex = contentStart;
  let depth = 1;
  let match: RegExpExecArray | null;
  while ((match = tags.exec(html))) {
    depth += match[0].startsWith("</") ? -1 : 1;
    if (depth === 0) return formatJobDescription(html.slice(contentStart, match.index)).replace(/^[ \t]+/gm, "").trim();
  }
  return "";
}

export function readJobStreetPosting(html: string, sourceUrl: string) {
  const title = readPostingField(html, "job-detail-title");
  const description = readPostingField(html, "jobAdDetails");
  if (!title || !description) return null;

  return {
    title,
    company: readPostingField(html, "advertiser-name"),
    location: readPostingField(html, "job-detail-location"),
    employmentType: readPostingField(html, "job-detail-work-type"),
    description,
    sourceUrl,
  };
}
