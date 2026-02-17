// components/chat/MarkdownRenderer.tsx
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';

// Strict allowlist — only safe structural HTML, no event handlers, no scripts
const sanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    // Allow className for code blocks (syntax highlighting classes)
    code: ['className'],
    span: ['className'],
  },
  // Explicitly block these tags even if react-markdown tries to render them
  tagNames: [
    ...(defaultSchema.tagNames ?? []).filter(
      tag => !['script', 'iframe', 'object', 'embed', 'form', 'input'].includes(tag)
    ),
  ],
};

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[[rehypeSanitize, sanitizeSchema]]}
      components={{
        // Map markdown elements to Tailwind-styled elements
        h2: ({ children }) => (
          <h2 className="text-2xl font-bold mt-4 mb-3 text-white">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-xl font-bold mt-3 mb-2 text-white">{children}</h3>
        ),
        h4: ({ children }) => (
          <h4 className="text-lg font-bold mt-2 mb-1 text-white">{children}</h4>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold text-white">{children}</strong>
        ),
        em: ({ children }) => (
          <em className="italic text-gray-300">{children}</em>
        ),
        ul: ({ children }) => (
          <ul className="space-y-1 my-2">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="space-y-1 my-2 list-decimal list-inside">{children}</ol>
        ),
        li: ({ children }) => (
          <div className="flex items-start gap-2 mt-1">
            <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0" />
            <span className="text-gray-200">{children}</span>
          </div>
        ),
        p: ({ children }) => (
          <p className="mb-2 leading-relaxed text-gray-200">{children}</p>
        ),
        code: ({ className, children, ...props }) => {
          const isInline = !className;
          return isInline ? (
            <code className="px-1.5 py-0.5 bg-gray-700 rounded text-purple-300 text-sm font-mono">
              {children}
            </code>
          ) : (
            <code className="block bg-gray-900 border border-gray-700 rounded-lg p-4 text-sm font-mono text-green-300 overflow-x-auto my-2">
              {children}
            </code>
          );
        },
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-purple-500 pl-4 my-2 text-gray-400 italic">
            {children}
          </blockquote>
        ),
        a: ({ href, children }) => (
          // Force all links to open in new tab with noopener for safety
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-400 underline hover:text-purple-300"
          >
            {children}
          </a>
        ),
        // Block tables from injecting raw HTML
        table: ({ children }) => (
          <div className="overflow-x-auto my-3">
            <table className="text-sm text-left border-collapse w-full">{children}</table>
          </div>
        ),
        th: ({ children }) => (
          <th className="border border-gray-600 px-3 py-2 text-white font-semibold bg-gray-800">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="border border-gray-700 px-3 py-2 text-gray-300">{children}</td>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
