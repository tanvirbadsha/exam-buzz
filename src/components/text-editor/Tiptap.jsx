"use client";

import Color from "@tiptap/extension-color";
import FontFamily from "@tiptap/extension-font-family";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import { BulletList, ListItem, ListKeymap, OrderedList } from "@tiptap/extension-list";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import { FontSize, TextStyle } from "@tiptap/extension-text-style";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Heading1,
  Heading2,
  Highlighter,
  ImagePlus,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Palette,
  Pilcrow,
  Redo2,
  Type,
  Underline as UnderlineIcon,
  Undo2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef } from "react";

const DEFAULT_CONTENT = "<p></p>";

const fontFamilyOptions = [
  { label: "Default", value: "" },
  { label: "Inter", value: "Inter, Arial, sans-serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Mono", value: "ui-monospace, SFMono-Regular, Menlo, monospace" },
  { label: "Noto Bangla", value: "'Noto Sans Bengali', Arial, sans-serif" },
];

const fontSizeOptions = [
  { label: "12", value: "12px" },
  { label: "14", value: "14px" },
  { label: "16", value: "16px" },
  { label: "18", value: "18px" },
  { label: "22", value: "22px" },
  { label: "28", value: "28px" },
];

const swatches = ["#172033", "#262262", "#0f766e", "#b91c1c", "#c2410c"];
const highlightSwatches = ["#ffffff", "#fef3c7", "#dcfce7", "#dbeafe", "#fee2e2"];

function ToolbarButton({ active = false, disabled = false, icon: Icon, label, onClick }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={`icon-button h-8 w-8 border border-border ${
        active ? "bg-brand text-white hover:bg-brand hover:text-white" : "bg-white"
      }`}
    >
      <Icon size={15} />
    </button>
  );
}

function ToolbarSelect({ label, value, onChange, options }) {
  return (
    <label className="flex items-center gap-1 rounded-lg border border-border bg-white px-2 py-1">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="max-w-32 bg-transparent text-xs font-semibold text-foreground outline-none"
        title={label}
      >
        {options.map((option) => (
          <option key={`${label}-${option.value}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function ToolbarSwatches({ icon: Icon, label, colors, onSelect }) {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-border bg-white px-2 py-1">
      <Icon size={14} className="text-muted" aria-hidden="true" />
      <span className="sr-only">{label}</span>
      {colors.map((color) => (
        <button
          key={`${label}-${color}`}
          type="button"
          title={`${label}: ${color}`}
          aria-label={`${label}: ${color}`}
          onClick={() => onSelect(color)}
          className="h-5 w-5 rounded-md border border-border"
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );
}

function TiptapToolbar({ editor }) {
  const fileInputRef = useRef(null);
  const editorState = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => ({
      canUndo: currentEditor.can().undo(),
      canRedo: currentEditor.can().redo(),
      isBold: currentEditor.isActive("bold"),
      isItalic: currentEditor.isActive("italic"),
      isUnderline: currentEditor.isActive("underline"),
      isBulletList: currentEditor.isActive("bulletList"),
      isOrderedList: currentEditor.isActive("orderedList"),
      isHeading1: currentEditor.isActive("heading", { level: 1 }),
      isHeading2: currentEditor.isActive("heading", { level: 2 }),
      isAlignLeft: currentEditor.isActive({ textAlign: "left" }),
      isAlignCenter: currentEditor.isActive({ textAlign: "center" }),
      isAlignRight: currentEditor.isActive({ textAlign: "right" }),
      fontFamily: currentEditor.getAttributes("textStyle").fontFamily || "",
      fontSize: currentEditor.getAttributes("textStyle").fontSize || "",
    }),
  });

  const addLink = () => {
    const previousUrl = editor.getAttributes("link").href || "";
    const url = window.prompt("Paste link URL", previousUrl);
    if (url === null) return;

    if (!url.trim()) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  };

  const addImageByUrl = () => {
    const src = window.prompt("Paste image URL");
    if (!src?.trim()) return;

    editor.chain().focus().setImage({ src: src.trim() }).run();
  };

  const addImageFile = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      const src = String(reader.result || "");
      if (src) {
        editor.chain().focus().setImage({ src }).run();
      }
    });
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border bg-surface-muted p-2">
      <ToolbarButton
        icon={Undo2}
        label="Undo"
        disabled={!editorState.canUndo}
        onClick={() => editor.chain().focus().undo().run()}
      />
      <ToolbarButton
        icon={Redo2}
        label="Redo"
        disabled={!editorState.canRedo}
        onClick={() => editor.chain().focus().redo().run()}
      />

      <span className="h-6 w-px bg-border" aria-hidden="true" />

      <ToolbarButton
        icon={Pilcrow}
        label="Paragraph"
        onClick={() => editor.chain().focus().setParagraph().run()}
      />
      <ToolbarButton
        icon={Heading1}
        label="Heading 1"
        active={editorState.isHeading1}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      />
      <ToolbarButton
        icon={Heading2}
        label="Heading 2"
        active={editorState.isHeading2}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      />
      <ToolbarSelect
        label="Font family"
        value={editorState.fontFamily}
        options={fontFamilyOptions}
        onChange={(value) => {
          if (value) {
            editor.chain().focus().setFontFamily(value).run();
            return;
          }
          editor.chain().focus().unsetFontFamily().run();
        }}
      />
      <ToolbarSelect
        label="Font size"
        value={editorState.fontSize}
        options={[{ label: "Size", value: "" }, ...fontSizeOptions]}
        onChange={(value) => {
          if (value) {
            editor.chain().focus().setFontSize(value).run();
            return;
          }
          editor.chain().focus().unsetFontSize().run();
        }}
      />

      <span className="h-6 w-px bg-border" aria-hidden="true" />

      <ToolbarButton
        icon={Bold}
        label="Bold"
        active={editorState.isBold}
        onClick={() => editor.chain().focus().toggleBold().run()}
      />
      <ToolbarButton
        icon={Italic}
        label="Italic"
        active={editorState.isItalic}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      />
      <ToolbarButton
        icon={UnderlineIcon}
        label="Underline"
        active={editorState.isUnderline}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      />

      <span className="h-6 w-px bg-border" aria-hidden="true" />

      <ToolbarButton
        icon={AlignLeft}
        label="Align left"
        active={editorState.isAlignLeft}
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
      />
      <ToolbarButton
        icon={AlignCenter}
        label="Align center"
        active={editorState.isAlignCenter}
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
      />
      <ToolbarButton
        icon={AlignRight}
        label="Align right"
        active={editorState.isAlignRight}
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
      />
      <ToolbarButton
        icon={List}
        label="Bulleted list"
        active={editorState.isBulletList}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      />
      <ToolbarButton
        icon={ListOrdered}
        label="Numbered list"
        active={editorState.isOrderedList}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      />

      <span className="h-6 w-px bg-border" aria-hidden="true" />

      <ToolbarSwatches
        icon={Palette}
        label="Text color"
        colors={swatches}
        onSelect={(color) => editor.chain().focus().setColor(color).run()}
      />
      <ToolbarSwatches
        icon={Highlighter}
        label="Background color"
        colors={highlightSwatches}
        onSelect={(color) => {
          if (color === "#ffffff") {
            editor.chain().focus().unsetHighlight().run();
            return;
          }
          editor.chain().focus().toggleHighlight({ color }).run();
        }}
      />

      <span className="h-6 w-px bg-border" aria-hidden="true" />

      <ToolbarButton icon={LinkIcon} label="Add link" onClick={addLink} />
      <ToolbarButton icon={ImagePlus} label="Add image URL" onClick={addImageByUrl} />
      <ToolbarButton
        icon={Type}
        label="Upload image"
        onClick={() => fileInputRef.current?.click()}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={addImageFile}
        className="hidden"
      />
    </div>
  );
}

export default function Tiptap({
  ariaLabel,
  minHeight = 220,
  onChange,
  placeholder = "Write content...",
  value = DEFAULT_CONTENT,
}) {
  const extensions = useMemo(
    () => [
      StarterKit.configure({
        bulletList: false,
        heading: { levels: [1, 2, 3] },
        listItem: false,
        orderedList: false,
      }),
      BulletList.configure({
        keepAttributes: true,
        keepMarks: true,
      }),
      OrderedList.configure({
        keepAttributes: true,
        keepMarks: true,
      }),
      ListItem,
      ListKeymap,
      Underline,
      TextStyle,
      FontSize,
      FontFamily,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: "https",
        HTMLAttributes: {
          class: "text-brand-strong underline underline-offset-2",
        },
      }),
      Image.configure({
        allowBase64: true,
        HTMLAttributes: {
          class: "max-w-full rounded-lg border border-border",
        },
      }),
    ],
    [],
  );

  const emitChange = useCallback(
    (editor) => {
      const html = editor.isEmpty ? DEFAULT_CONTENT : editor.getHTML();
      queueMicrotask(() => onChange?.(html));
    },
    [onChange],
  );

  const editor = useEditor({
    extensions,
    content: value || DEFAULT_CONTENT,
    immediatelyRender: false,
    shouldRerenderOnTransaction: false,
    editorProps: {
      attributes: {
        "aria-label": ariaLabel || placeholder,
        class:
          "tiptap-editor-content min-h-[var(--editor-min-height)] px-4 py-3 text-sm leading-6 text-foreground outline-none",
      },
    },
    onUpdate({ editor }) {
      emitChange(editor);
    },
  });

  useEffect(() => {
    if (!editor) return;

    const nextValue = value || DEFAULT_CONTENT;
    if (editor.getHTML() === nextValue) return;

    editor.commands.setContent(nextValue, { emitUpdate: false });
  }, [editor, value]);

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-sm focus-within:border-brand focus-within:ring-2 focus-within:ring-brand-soft">
      {editor ? <TiptapToolbar editor={editor} /> : null}
      <EditorContent
        editor={editor}
        style={{ "--editor-min-height": `${minHeight}px` }}
      />
    </div>
  );
}
