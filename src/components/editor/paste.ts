import { createNodeFromContent, type JSONContent } from "@tiptap/core";
import type { Editor } from "@tiptap/core";
import type { Node as ProseMirrorNode, Schema } from "@tiptap/pm/model";
import { Slice } from "@tiptap/pm/model";
import type { EditorView } from "@tiptap/pm/view";

/** Heuristic: plain text looks like markdown worth parsing on paste. */
export function looksLikeMarkdown(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) {
    return false;
  }

  const lines = trimmed.split(/\r?\n/);

  if (lines.some((line) => /^#{1,6}\s/.test(line))) {
    return true;
  }
  if (lines.some((line) => /^[-*+]\s/.test(line))) {
    return true;
  }
  if (lines.some((line) => /^\d+\.\s/.test(line))) {
    return true;
  }
  if (lines.some((line) => /^>\s/.test(line))) {
    return true;
  }
  if (/```/.test(trimmed)) {
    return true;
  }
  if (/\*\*[^*\n]+\*\*/.test(trimmed) || /__[^_\n]+__/.test(trimmed)) {
    return true;
  }
  if (/\[[^\]]+\]\([^)]+\)/.test(trimmed)) {
    return true;
  }

  return false;
}

/**
 * Some Google Docs / VS Code clipboard payloads include a hidden markdown export in HTML.
 */
export function extractGoogleDocsMarkdown(html: string): string | null {
  if (!html.trim()) {
    return null;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  const dataMarkdown = doc.querySelector("[data-markdown], [data-source-md]");
  if (dataMarkdown?.textContent?.trim()) {
    return dataMarkdown.textContent.trim();
  }

  const hiddenMarkdown = doc.querySelector(
    '#vscode-markdown, .vscode-markdown, #docs-markdown-export, [id*="markdown-export"]'
  );
  if (hiddenMarkdown?.textContent?.trim()) {
    return hiddenMarkdown.textContent.trim();
  }

  const metaMarkdown = doc.querySelector('meta[name="markdown"]');
  const metaContent = metaMarkdown?.getAttribute("content");
  if (metaContent?.trim()) {
    return metaContent.trim();
  }

  const commentMatch = html.match(/<!--\s*markdown:([\s\S]*?)-->/i);
  if (commentMatch?.[1]?.trim()) {
    return commentMatch[1].trim();
  }

  return null;
}

export function parseMarkdownForPaste(
  markdown: string,
  schema: Schema,
  editor: Editor
): Slice {
  const manager = editor.markdown;
  if (!manager) {
    throw new Error("Markdown extension is required for markdown paste");
  }

  const json = manager.parse(markdown) as JSONContent;
  const created = createNodeFromContent(json, schema, {
    parseOptions: { preserveWhitespace: "full" },
  });

  const docNode = created as ProseMirrorNode;
  if (docNode.type.name === "doc") {
    return new Slice(docNode.content, 1, 1);
  }
  return new Slice(docNode.content, 0, 0);
}

function isInsideCodeBlock(view: EditorView): boolean {
  const { $from } = view.state.selection;
  for (let depth = $from.depth; depth > 0; depth -= 1) {
    if ($from.node(depth).type.name === "codeBlock") {
      return true;
    }
  }
  return false;
}

export function createHandlePaste(editor: Editor) {
  return (view: EditorView, event: ClipboardEvent): boolean => {
    const clipboardData = event.clipboardData;
    if (!clipboardData) {
      return false;
    }

    if (isInsideCodeBlock(view)) {
      return false;
    }

    const html = clipboardData.getData("text/html");
    const plain = clipboardData.getData("text/plain");

    let markdown: string | null = null;

    if (html) {
      markdown = extractGoogleDocsMarkdown(html);
    }

    if (!markdown && plain && looksLikeMarkdown(plain)) {
      markdown = plain;
    }

    if (!markdown) {
      if (html) {
        return false;
      }
      return false;
    }

    try {
      const slice = parseMarkdownForPaste(markdown, view.state.schema, editor);
      const tr = view.state.tr.replaceSelection(slice).scrollIntoView();
      view.dispatch(tr);
      event.preventDefault();
      return true;
    } catch {
      return false;
    }
  };
}
