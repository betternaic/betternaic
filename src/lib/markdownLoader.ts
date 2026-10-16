/**
 * Loads Markdown content by path. Files are code-split: each page is fetched
 * only when someone opens it.
 */

const serviceFiles = import.meta.glob('../../content/services/*/*.md', {
  query: '?raw',
  import: 'default',
}) as Record<string, () => Promise<string>>;

const pageFiles = import.meta.glob('../../content/pages/*.md', {
  query: '?raw',
  import: 'default',
}) as Record<string, () => Promise<string>>;

export interface MarkdownContent {
  content: string;
  title?: string;
  description?: string;
}

/** Replaces {VITE_KEY}-style tokens, e.g. {SITE_NAME}, with VITE_ env vars. */
function interpolate(content: string): string {
  return content.replace(/\{([A-Z0-9_]+)\}/g, (match, key) => {
    const value = import.meta.env[`VITE_${key}`];
    return value !== undefined ? String(value) : match;
  });
}

function parse(raw: string): MarkdownContent {
  const content = interpolate(raw);
  const title = content.match(/^#\s+(.+)$/m)?.[1];
  const description = content
    .match(/^#\s+.+$\r?\n\r?\n(.+?)(?:\r?\n\r?\n|$)/s)?.[1]
    ?.replace(/^>\s*/, '')
    .trim();
  return { content, title, description };
}

async function load(
  files: Record<string, () => Promise<string>>,
  key: string
): Promise<MarkdownContent> {
  const loader = files[key];
  if (!loader) throw new Error('Page not found');
  return parse(await loader());
}

export function loadServiceMarkdown(category: string, slug: string) {
  return load(serviceFiles, `../../content/services/${category}/${slug}.md`);
}

export function loadPageMarkdown(slug: string) {
  return load(pageFiles, `../../content/pages/${slug}.md`);
}

export function hasPage(slug: string): boolean {
  return `../../content/pages/${slug}.md` in pageFiles;
}
