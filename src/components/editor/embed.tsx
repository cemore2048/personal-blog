import { Node } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";

type EmbedToken = {
  type: "embed";
  raw: string;
  embedType: string;
  embedId: string;
  embedTitle?: string;
};

function renderEmbedUrl(embedType: string, embedId: string) {
  if (embedType === "youtube") {
    return `https://www.youtube.com/embed/${embedId}`;
  }
  if (embedType === "vimeo") {
    return `https://player.vimeo.com/video/${embedId}`;
  }
  return null;
}

function EmbedNodeView({
  node,
}: {
  node: { attrs: { type?: string; id?: string; title?: string } };
}) {
  const embedType = String(node.attrs.type ?? "");
  const embedId = String(node.attrs.id ?? "");
  const title = String(node.attrs.title ?? "");
  const embedUrl = renderEmbedUrl(embedType, embedId);

  return (
    <NodeViewWrapper className="tiptap-embed" contentEditable={false}>
      {embedUrl ? (
        <div className="tiptap-embed-frame">
          <iframe
            src={embedUrl}
            title={title || `${embedType} embed`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : (
        <div className="tiptap-embed-placeholder">
          <strong>{embedType || "embed"}</strong>
          <span>{embedId || "missing id"}</span>
          {title ? <em>{title}</em> : null}
        </div>
      )}
    </NodeViewWrapper>
  );
}

export const EmbedNode = Node.create({
  name: "embed",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      type: {
        default: null,
      },
      id: {
        default: null,
      },
      title: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "div[data-embed-type][data-embed-id]",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      {
        "data-embed-type": HTMLAttributes.type,
        "data-embed-id": HTMLAttributes.id,
        "data-embed-title": HTMLAttributes.title ?? "",
      },
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(EmbedNodeView);
  },

  markdownTokenName: "embed",
  parseMarkdown: (token) => {
    const t = token as EmbedToken;
    return {
      type: "embed",
      attrs: {
        type: t.embedType,
        id: t.embedId,
        title: t.embedTitle ?? null,
      },
    };
  },
  renderMarkdown: ({ node }) => {
    const type = String(node.attrs.type ?? "").trim();
    const id = String(node.attrs.id ?? "").trim();
    if (!type || !id) {
      return "";
    }
    const title = node.attrs.title
      ? ` "${String(node.attrs.title).replace(/"/g, '\\"')}"`
      : "";
    return `@[${type}](${id}${title})\n\n`;
  },
  markdownTokenizer: {
    name: "embed",
    level: "block",
    start: (src: string) => src.indexOf("@["),
    tokenize: (src: string) => {
      const match =
        /^@\[(?<type>[\w-]+)\]\((?<id>[^)\s]+)(?:\s+"(?<title>[^"]+)")?\)\s*(?:\n|$)/.exec(
          src
        );
      if (!match || !match.groups) {
        return undefined;
      }
      return {
        type: "embed",
        raw: match[0],
        embedType: match.groups.type,
        embedId: match.groups.id,
        embedTitle: match.groups.title,
      } satisfies EmbedToken;
    },
  },
});
