import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { Markdown } from "@tiptap/markdown";
import type { Extensions } from "@tiptap/core";
import { EmbedNode } from "./embed";

/**
 * Shared TipTap extensions: StarterKit input rules, keyboard shortcuts, and markdown round-trip.
 */
export function createEditorExtensions(): Extensions {
  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3, 4, 5, 6] },
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
  ];
}
