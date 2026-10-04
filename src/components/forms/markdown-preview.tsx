import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';

// Renders admin-written Markdown; the sanitizer removes raw HTML, scripts and unsafe links before anything is shown.
export function MarkdownPreview({ markdown }: { markdown: string }) {
  if (markdown.trim() === '') {
    return <p className="text-sm text-muted-foreground">Nothing to preview yet.</p>;
  }
  return (
    <div className="prose prose-sm max-w-none dark:prose-invert">
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
