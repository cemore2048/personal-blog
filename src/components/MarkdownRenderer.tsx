import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

type MarkdownRendererProps = {
  content: string;
};

type MarkdownChunk =
  | { kind: "markdown"; content: string }
  | { kind: "embed"; embedType: string; embedId: string; title?: string };

const embedLinePattern =
  /^\s*@\[([\w-]+)\]\(([^)\s]+)(?:\s+"([^"]+)")?\)\s*$/;

function splitMarkdownEmbeds(content: string): MarkdownChunk[] {
  const lines = content.split(/\r?\n/);
  const chunks: MarkdownChunk[] = [];
  let buffer: string[] = [];
  let inCodeFence = false;

  for (const line of lines) {
    if (/^```/.test(line.trim())) {
      inCodeFence = !inCodeFence;
      buffer.push(line);
      continue;
    }

    if (inCodeFence) {
      buffer.push(line);
      continue;
    }

    const match = embedLinePattern.exec(line);
    if (match) {
      if (buffer.length) {
        chunks.push({ kind: "markdown", content: buffer.join("\n") });
        buffer = [];
      }
      chunks.push({
        kind: "embed",
        embedType: match[1],
        embedId: match[2],
        title: match[3],
      });
      continue;
    }
    buffer.push(line);
  }

  if (buffer.length) {
    chunks.push({ kind: "markdown", content: buffer.join("\n") });
  }

  return chunks;
}

function renderEmbedBlock(embedType: string, embedId: string, title?: string) {
  if (embedType === "youtube") {
    return (
      <div className="markdown-embed">
        <iframe
          src={`https://www.youtube.com/embed/${embedId}`}
          title={title || "YouTube embed"}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  if (embedType === "vimeo") {
    return (
      <div className="markdown-embed">
        <iframe
          src={`https://player.vimeo.com/video/${embedId}`}
          title={title || "Vimeo embed"}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div className="markdown-embed markdown-embed--placeholder">
      <strong>{embedType || "embed"}</strong>
      <span>{embedId || "missing id"}</span>
      {title ? <em>{title}</em> : null}
    </div>
  );
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const chunks = splitMarkdownEmbeds(content);

  return (
    <article className="markdown">
      {chunks.map((chunk, index) => {
        if (chunk.kind === "embed") {
          return (
            <div key={`embed-${index}`}>
              {renderEmbedBlock(chunk.embedType, chunk.embedId, chunk.title)}
            </div>
          );
        }
        return (
          <ReactMarkdown
            key={`md-${index}`}
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
          >
            {chunk.content}
          </ReactMarkdown>
        );
      })}
    </article>
  );
}
