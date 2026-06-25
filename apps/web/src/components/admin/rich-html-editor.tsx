"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import Link from "@tiptap/extension-link";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { Bold, Code2, Eraser, Heading2, Italic, Link as LinkIcon, List, ListOrdered, Pilcrow, Quote, Redo2, Strikethrough, Underline as UnderlineIcon, Undo2 } from "lucide-react";
import { useState } from "react";
import styles from "./admin.module.css";

type RichHtmlEditorProps = {
  defaultValue: string;
  label: string;
  name: string;
};

export function RichHtmlEditor({ defaultValue, label, name }: RichHtmlEditorProps) {
  const [html, setHtml] = useState(defaultValue || "<p></p>");
  const [sourceMode, setSourceMode] = useState(false);
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ autolink: true, openOnClick: false })
    ],
    content: defaultValue || "<p></p>",
    immediatelyRender: false,
    onUpdate: ({ editor: instance }) => setHtml(instance.getHTML())
  });

  const toggleSource = () => {
    if (!editor) return;
    if (sourceMode) {
      editor.commands.setContent(html || "<p></p>");
      setSourceMode(false);
      return;
    }
    setHtml(editor.getHTML());
    setSourceMode(true);
  };

  const setLink = () => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Paste link URL", previousUrl ?? "");
    if (url === null) return;
    if (!url.trim()) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  };

  const currentHtml = sourceMode ? html : editor?.getHTML() ?? html;

  return (
    <div className={`${styles.field} ${styles.fieldFull}`}>
      <label>{label}</label>
      <input type="hidden" name={name} value={currentHtml} />
      <div className={styles.richEditor}>
        <div className={styles.richHeader}>
          <div>
            <strong>Chapter body</strong>
            <span>Write, format, and clean chapter text before saving.</span>
          </div>
          <button type="button" onClick={toggleSource} className={sourceMode ? styles.richToggleActive : ""} disabled={!editor}>
            <Code2 size={15} /> {sourceMode ? "Visual editor" : "HTML"}
          </button>
        </div>
        {!sourceMode ? (
          <div className={styles.richToolbar} aria-label="Chapter formatting toolbar">
            <button type="button" onClick={() => editor?.chain().focus().setParagraph().run()} className={editor?.isActive("paragraph") ? styles.richButtonActive : ""} title="Paragraph"><Pilcrow size={16} /><span>Paragraph</span></button>
            <button type="button" onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} className={editor?.isActive("heading", { level: 2 }) ? styles.richButtonActive : ""} title="Heading"><Heading2 size={16} /></button>
            <button type="button" onClick={() => editor?.chain().focus().toggleBold().run()} className={editor?.isActive("bold") ? styles.richButtonActive : ""} title="Bold"><Bold size={16} /></button>
            <button type="button" onClick={() => editor?.chain().focus().toggleItalic().run()} className={editor?.isActive("italic") ? styles.richButtonActive : ""} title="Italic"><Italic size={16} /></button>
            <button type="button" onClick={() => editor?.chain().focus().toggleUnderline().run()} className={editor?.isActive("underline") ? styles.richButtonActive : ""} title="Underline"><UnderlineIcon size={16} /></button>
            <button type="button" onClick={() => editor?.chain().focus().toggleStrike().run()} className={editor?.isActive("strike") ? styles.richButtonActive : ""} title="Strike"><Strikethrough size={16} /></button>
            <button type="button" onClick={setLink} className={editor?.isActive("link") ? styles.richButtonActive : ""} title="Link"><LinkIcon size={16} /></button>
            <button type="button" onClick={() => editor?.chain().focus().toggleBlockquote().run()} className={editor?.isActive("blockquote") ? styles.richButtonActive : ""} title="Quote"><Quote size={16} /></button>
            <button type="button" onClick={() => editor?.chain().focus().toggleBulletList().run()} className={editor?.isActive("bulletList") ? styles.richButtonActive : ""} title="Bulleted list"><List size={16} /></button>
            <button type="button" onClick={() => editor?.chain().focus().toggleOrderedList().run()} className={editor?.isActive("orderedList") ? styles.richButtonActive : ""} title="Numbered list"><ListOrdered size={16} /></button>
            <button type="button" onClick={() => editor?.chain().focus().undo().run()} disabled={!editor?.can().undo()} title="Undo"><Undo2 size={16} /></button>
            <button type="button" onClick={() => editor?.chain().focus().redo().run()} disabled={!editor?.can().redo()} title="Redo"><Redo2 size={16} /></button>
            <button type="button" onClick={() => editor?.chain().focus().unsetAllMarks().clearNodes().run()} title="Clear formatting"><Eraser size={16} /></button>
          </div>
        ) : null}
        {sourceMode ? (
          <textarea className={styles.richSource} value={html} onChange={(event) => setHtml(event.target.value)} spellCheck={false} />
        ) : (
          <EditorContent editor={editor} className={styles.richContent} />
        )}
      </div>
      <span className={styles.helperText}>Tiptap editor. Use visual mode for normal edits and HTML mode only when you need to adjust markup.</span>
    </div>
  );
}
