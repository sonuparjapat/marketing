'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import ImageExt from '@tiptap/extension-image';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { TableKit } from '@tiptap/extension-table';
import { Youtube } from '@tiptap/extension-youtube';
import { createLowlight, common } from 'lowlight';
import { useState } from 'react';
import apiClient from '@/lib/apiClient';
import {
  BoldIcon,
  ItalicIcon,
  UnderlineIcon,
  StrikeIcon,
  HighlightIcon,
  H1Icon,
  H2Icon,
  H3Icon,
  QuoteIcon,
  CodeIcon,
  CodeBlockIcon,
  BulletListIcon,
  OrderedListIcon,
  HrIcon,
  LinkIcon,
  ImageIcon2,
  UndoIcon,
  RedoIcon,
  AlignLeftIcon,
  AlignCenterIcon,
  AlignRightIcon,
  TableIcon,
  YoutubeIcon,
} from './editorIcons';

const lowlight = createLowlight(common);

function ToolbarButton({
  onClick,
  active,
  disabled,
  children,
  title,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`flex h-8 w-8 items-center justify-center rounded-sm transition-colors disabled:opacity-30 ${
        active ? 'bg-accent text-bg' : 'text-muted hover:bg-bg hover:text-fg'
      }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="mx-1 h-5 w-px bg-line" />;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Start writing…',
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}) {
  const [uploading, setUploading] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      Link.configure({ openOnClick: false }),
      ImageExt.configure({ HTMLAttributes: { class: 'rounded-sm' } }),
      Underline,
      Highlight.configure({ multicolor: false }),
      Placeholder.configure({ placeholder }),
      CharacterCount,
      CodeBlockLowlight.configure({ lowlight }),
      TextStyle,
      Color,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TableKit.configure({ table: { resizable: true } }),
      Youtube.configure({ width: 560, height: 315, HTMLAttributes: { class: 'rounded-sm' } }),
    ],
    content: value,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose-editor prose max-w-none min-h-[420px] px-6 py-6 text-[15.5px] focus:outline-none',
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  const uploadImage = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file || !editor) return;
      setUploading(true);
      const form = new FormData();
      form.append('file', file);
      try {
        const res = await apiClient.post('/admin/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });
        editor.chain().focus().setImage({ src: res.data.data.url }).run();
      } catch (err: unknown) {
        const message =
          err && typeof err === 'object' && 'response' in err
            ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
            : undefined;
        alert(message || 'Image upload failed — please try again.');
      } finally {
        setUploading(false);
      }
    };
    input.click();
  };

  const setLink = () => {
    if (!editor) return;
    const previous = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('URL', previous || 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const insertTable = () => {
    if (!editor) return;
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  const embedYoutube = () => {
    if (!editor) return;
    const url = window.prompt('YouTube video URL');
    if (!url) return;
    editor.commands.setYoutubeVideo({ src: url });
  };

  if (!editor) return null;

  const words = editor.storage.characterCount?.words() ?? 0;
  const readingTime = Math.max(1, Math.round(words / 200));

  return (
    <div className="border border-line bg-bg2">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-line p-1.5">
        <ToolbarButton title="Undo" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}>
          <UndoIcon size={15} />
        </ToolbarButton>
        <ToolbarButton title="Redo" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}>
          <RedoIcon size={15} />
        </ToolbarButton>
        <Divider />
        <ToolbarButton title="Heading 1" active={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
          <H1Icon size={15} />
        </ToolbarButton>
        <ToolbarButton title="Heading 2" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          <H2Icon size={15} />
        </ToolbarButton>
        <ToolbarButton title="Heading 3" active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          <H3Icon size={15} />
        </ToolbarButton>
        <Divider />
        <ToolbarButton title="Bold" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
          <BoldIcon size={15} />
        </ToolbarButton>
        <ToolbarButton title="Italic" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <ItalicIcon size={15} />
        </ToolbarButton>
        <ToolbarButton title="Underline" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <UnderlineIcon size={15} />
        </ToolbarButton>
        <ToolbarButton title="Strikethrough" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}>
          <StrikeIcon size={15} />
        </ToolbarButton>
        <ToolbarButton title="Highlight" active={editor.isActive('highlight')} onClick={() => editor.chain().focus().toggleHighlight().run()}>
          <HighlightIcon size={15} />
        </ToolbarButton>
        <Divider />
        <ToolbarButton title="Quote" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <QuoteIcon size={15} />
        </ToolbarButton>
        <ToolbarButton title="Inline code" active={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()}>
          <CodeIcon size={15} />
        </ToolbarButton>
        <ToolbarButton title="Code block" active={editor.isActive('codeBlock')} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
          <CodeBlockIcon size={15} />
        </ToolbarButton>
        <Divider />
        <ToolbarButton title="Bullet list" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <BulletListIcon size={15} />
        </ToolbarButton>
        <ToolbarButton title="Numbered list" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <OrderedListIcon size={15} />
        </ToolbarButton>
        <ToolbarButton title="Divider" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
          <HrIcon size={15} />
        </ToolbarButton>
        <Divider />
        <ToolbarButton title="Align left" active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()}>
          <AlignLeftIcon size={15} />
        </ToolbarButton>
        <ToolbarButton title="Align center" active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()}>
          <AlignCenterIcon size={15} />
        </ToolbarButton>
        <ToolbarButton title="Align right" active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()}>
          <AlignRightIcon size={15} />
        </ToolbarButton>
        <label title="Text color" className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-sm text-muted hover:bg-bg hover:text-fg">
          <span className="text-[13px] font-bold" style={{ color: editor.getAttributes('textStyle').color || undefined }}>
            A
          </span>
          <input
            type="color"
            className="sr-only"
            value={editor.getAttributes('textStyle').color || '#d4af6a'}
            onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
          />
        </label>
        <Divider />
        <ToolbarButton title="Insert table" active={editor.isActive('table')} onClick={insertTable}>
          <TableIcon size={15} />
        </ToolbarButton>
        <ToolbarButton title="Embed YouTube video" onClick={embedYoutube}>
          <YoutubeIcon size={15} />
        </ToolbarButton>
        <Divider />
        <ToolbarButton title="Link" active={editor.isActive('link')} onClick={setLink}>
          <LinkIcon size={15} />
        </ToolbarButton>
        <ToolbarButton title={uploading ? 'Uploading…' : 'Image'} disabled={uploading} onClick={uploadImage}>
          <ImageIcon2 size={15} />
        </ToolbarButton>
      </div>

      {editor && (
        <BubbleMenu editor={editor} options={{ placement: 'top' }}>
          <div className="flex items-center gap-0.5 rounded-sm border border-line bg-bg p-1 shadow-lg">
            <ToolbarButton title="Bold" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
              <BoldIcon size={14} />
            </ToolbarButton>
            <ToolbarButton title="Italic" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
              <ItalicIcon size={14} />
            </ToolbarButton>
            <ToolbarButton title="Underline" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>
              <UnderlineIcon size={14} />
            </ToolbarButton>
            <ToolbarButton title="Link" active={editor.isActive('link')} onClick={setLink}>
              <LinkIcon size={14} />
            </ToolbarButton>
          </div>
        </BubbleMenu>
      )}

      <EditorContent editor={editor} />

      <div className="flex items-center justify-between border-t border-line px-4 py-2 text-xs text-faint">
        <span>{words} words</span>
        <span>{readingTime} min read</span>
      </div>
    </div>
  );
}
