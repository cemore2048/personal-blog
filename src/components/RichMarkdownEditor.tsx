"use client";

import { useCallback, useEffect, useMemo } from "react";
import { Node } from "@tiptap/core";
import { EditorContent, NodeViewWrapper, ReactNodeViewRenderer, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { Markdown } from "@tiptap/markdown";

type RichMarkdownEditorProps = {
  initialMarkdown: string;
  onMarkdownChange: (markdown: string) => void;
};

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

const EmbedNode = Node.create({
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

function EmbedNodeView({ node }: { node: { attrs: { type?: string; id?: string; title?: string } } }) {
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

export default function RichMarkdownEditor({
  initialMarkdown,
  onMarkdownChange,
}: RichMarkdownEditorProps) {
  const extensions = useMemo(
    () => [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        strike: false,
        horizontalRule: false,
        hardBreak: false,
      }),
      Link.configure({
        openOnClick: false,
        autolink: false,
        linkOnPaste: true,
      }),
      EmbedNode,
      Markdown.configure({}),
    ],
    []
  );

  const editor = useEditor({
    extensions,
    content: initialMarkdown ?? "",
    contentType: "markdown",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "tiptap-editor",
      },
    },
    onUpdate: ({ editor }) => {
      onMarkdownChange(editor.getMarkdown());
    },
  });

  useEffect(() => {
    if (!editor) {
      return;
    }
    onMarkdownChange(editor.getMarkdown());
  }, [editor, onMarkdownChange]);

  const handleSetLink = useCallback(() => {
    if (!editor) {
      return;
    }
    const previousUrl = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Enter URL", previousUrl ?? "");
    if (url === null) {
      return;
    }
    const nextUrl = url.trim();
    if (!nextUrl) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: nextUrl }).run();
  }, [editor]);

  const handleInsertEmbed = useCallback(() => {
    if (!editor) {
      return;
    }
    const embedType = window.prompt("Embed type (youtube, vimeo, etc)");
    if (!embedType) {
      return;
    }
    const embedId = window.prompt("Embed id or src");
    if (!embedId) {
      return;
    }
    const embedTitle = window.prompt("Optional title");
    editor
      .chain()
      .focus()
      .insertContent({
        type: "embed",
        attrs: {
          type: embedType.trim(),
          id: embedId.trim(),
          title: embedTitle?.trim() || null,
        },
      })
      .run();
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="tiptap-shell">
      <div className="tiptap-toolbar" role="toolbar" aria-label="Formatting controls">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          data-active={editor.isActive("heading", { level: 1 }) ? "true" : "false"}
        >
          H1
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          data-active={editor.isActive("heading", { level: 2 }) ? "true" : "false"}
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          data-active={editor.isActive("heading", { level: 3 }) ? "true" : "false"}
        >
          H3
        </button>
        <span className="tiptap-toolbar-separator" aria-hidden="true" />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          data-active={editor.isActive("bold") ? "true" : "false"}
        >
          Bold
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          data-active={editor.isActive("italic") ? "true" : "false"}
        >
          Italic
        </button>
        <span className="tiptap-toolbar-separator" aria-hidden="true" />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          data-active={editor.isActive("bulletList") ? "true" : "false"}
        >
          Bulleted
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          data-active={editor.isActive("orderedList") ? "true" : "false"}
        >
          Numbered
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          data-active={editor.isActive("blockquote") ? "true" : "false"}
        >
          Quote
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          data-active={editor.isActive("codeBlock") ? "true" : "false"}
        >
          Code
        </button>
        <span className="tiptap-toolbar-separator" aria-hidden="true" />
        <button type="button" onClick={handleSetLink}>
          Link
        </button>
        <button type="button" onClick={handleInsertEmbed}>
          Insert Embed
        </button>
      </div>
      <EditorContent editor={editor} />
      <p className="tiptap-help">
        Content is stored as Markdown. Embeds serialize as <code>@[type](id)</code>.
      </p>
    </div>
  );
}
