import type { JSONContent } from "@tiptap/core";
import type { Editor } from "@tiptap/core";

/** Serialize the current selection to markdown for clipboard copy (Mod+Shift+C). */
export function selectionToMarkdown(editor: Editor): string | null {
  const { from, to } = editor.state.selection;
  if (from === to) {
    return null;
  }

  const manager = editor.markdown;
  if (!manager) {
    return null;
  }

  const slice = editor.state.doc.slice(from, to);
  const content: JSONContent[] = [];
  slice.content.forEach((node) => {
    content.push(node.toJSON());
  });

  if (!content.length) {
    return null;
  }

  return manager.serialize({ type: "doc", content });
}
