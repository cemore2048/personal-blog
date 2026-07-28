"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import type { Editor } from "@tiptap/core";
import { EditorContent, useEditor } from "@tiptap/react";
import { createEditorExtensions } from "./extensions";
import { createHandlePaste } from "./paste";
import { selectionToMarkdown } from "./selection";

type EditorPaneProps = {
  initialMarkdown: string;
  onMarkdownChange: (markdown: string) => void;
};

export default function EditorPane({
  initialMarkdown,
  onMarkdownChange,
}: EditorPaneProps) {
  const editorRef = useRef<Editor | null>(null);
  const extensions = useMemo(() => createEditorExtensions(), []);

  const editor = useEditor({
    extensions,
    content: initialMarkdown ?? "",
    contentType: "markdown",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "tiptap-editor",
      },
      handlePaste: (view, event) => {
        const current = editorRef.current;
        if (!current) {
          return false;
        }
        return createHandlePaste(current)(view, event);
      },
      handleDOMEvents: {
        keydown: (view, event) => {
          const isMod = event.metaKey || event.ctrlKey;
          if (!isMod || !event.shiftKey || event.key.toLowerCase() !== "c") {
            return false;
          }

          const current = editorRef.current;
          if (!current || current.view !== view) {
            return false;
          }

          const markdown = selectionToMarkdown(current);
          if (!markdown) {
            return false;
          }

          event.preventDefault();
          void navigator.clipboard.writeText(markdown);
          return true;
        },
      },
    },
    onCreate: ({ editor: created }) => {
      editorRef.current = created;
    },
    onDestroy: () => {
      editorRef.current = null;
    },
    onUpdate: ({ editor: updated }) => {
      onMarkdownChange(updated.getMarkdown());
    },
  });

  useEffect(() => {
    if (editor) {
      editorRef.current = editor;
    }
  }, [editor]);

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
        Content is stored as Markdown. Type <code>#</code>, <code>-</code>, or{" "}
        <code>```</code> for structure. Paste markdown or use{" "}
        <kbd>⌘⇧C</kbd>/<kbd>Ctrl+Shift+C</kbd> to copy selection as markdown.
        Embeds serialize as <code>@[type](id)</code>.
      </p>
    </div>
  );
}
