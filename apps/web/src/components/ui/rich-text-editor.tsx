/**
 * Rich Text Editor
 * TipTap-based WYSIWYG editor for composing formatted content (bold, lists,
 * headings, links). Emits sanitized-friendly HTML via `onChange`.
 */

import { useEffect, useState } from 'react';
import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link2,
  Link2Off,
  Undo2,
  Redo2,
  RemoveFormatting,
  Check,
  X,
} from 'lucide-react';

import { cn } from '@/lib/utils';

const EMPTY_HTML = '<p></p>';

export interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  error?: boolean;
  className?: string;
}

interface ToolbarButtonProps {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  label: string;
  children: React.ReactNode;
}

function ToolbarButton({ onClick, active, disabled, label, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={cn(
        'inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-600 transition-colors',
        'hover:bg-slate-100 hover:text-slate-900',
        'disabled:pointer-events-none disabled:opacity-40',
        active && 'bg-primary/10 text-primary hover:bg-primary/15'
      )}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="mx-1 h-5 w-px shrink-0 bg-slate-200" aria-hidden="true" />;
}

function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) {
    return '';
  }
  if (/^(https?:|mailto:|tel:)/i.test(trimmed)) {
    return trimmed;
  }
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return `mailto:${trimmed}`;
  }
  return `https://${trimmed}`;
}

function Toolbar({ editor }: { editor: Editor }) {
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkRange, setLinkRange] = useState<{ from: number; to: number } | null>(null);

  const openLinkEditor = () => {
    const previous = (editor.getAttributes('link').href as string | undefined) ?? '';
    const { from, to } = editor.state.selection;
    setLinkRange({ from, to });
    setLinkUrl(previous);
    setLinkOpen(true);
  };

  const closeLinkEditor = () => {
    setLinkOpen(false);
    setLinkUrl('');
    setLinkRange(null);
    editor.chain().focus().run();
  };

  const applyLink = () => {
    const href = normalizeUrl(linkUrl);
    const range = linkRange ?? {
      from: editor.state.selection.from,
      to: editor.state.selection.to,
    };
    const collapsed = range.from === range.to;
    const chain = editor.chain().focus().setTextSelection(range);
    if (!href) {
      chain.extendMarkRange('link').unsetLink().run();
    } else if (collapsed) {
      chain
        .insertContent({
          type: 'text',
          text: linkUrl.trim(),
          marks: [{ type: 'link', attrs: { href } }],
        })
        .run();
    } else {
      chain.extendMarkRange('link').setLink({ href }).run();
    }
    setLinkOpen(false);
    setLinkUrl('');
    setLinkRange(null);
  };

  return (
    <div className="border-b border-slate-200 bg-slate-50">
      <div className="flex flex-wrap items-center gap-0.5 p-1.5">
        <ToolbarButton
          label="Bold"
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Italic"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Underline"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive('underline')}
        >
          <UnderlineIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Strikethrough"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive('strike')}
        >
          <Strikethrough className="h-4 w-4" />
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          label="Heading"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive('heading', { level: 2 })}
        >
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Subheading"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive('heading', { level: 3 })}
        >
          <Heading3 className="h-4 w-4" />
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          label="Bullet list"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
        >
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Numbered list"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Quote"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive('blockquote')}
        >
          <Quote className="h-4 w-4" />
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          label="Add link"
          onClick={openLinkEditor}
          active={editor.isActive('link') || linkOpen}
        >
          <Link2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Remove link"
          onClick={() => editor.chain().focus().unsetLink().run()}
          disabled={!editor.isActive('link')}
        >
          <Link2Off className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Clear formatting"
          onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
        >
          <RemoveFormatting className="h-4 w-4" />
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          label="Undo"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        >
          <Undo2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Redo"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        >
          <Redo2 className="h-4 w-4" />
        </ToolbarButton>
      </div>

      {linkOpen && (
        <div className="flex items-center gap-2 border-t border-slate-200 px-2 py-2">
          <Link2 className="h-4 w-4 shrink-0 text-slate-400" />
          <input
            type="url"
            autoFocus
            value={linkUrl}
            onChange={(event) => setLinkUrl(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                applyLink();
              } else if (event.key === 'Escape') {
                event.preventDefault();
                closeLinkEditor();
              }
            }}
            placeholder="Paste or type a link, then Apply"
            className="focus:border-primary focus:ring-primary/30 border-input h-8 flex-1 rounded-md border bg-white px-2 text-sm text-slate-700 outline-none focus:ring-2"
          />
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={applyLink}
            className="bg-primary hover:bg-primary/90 inline-flex h-8 items-center gap-1 rounded-md px-2.5 text-sm font-medium text-white"
          >
            <Check className="h-4 w-4" />
            Apply
          </button>
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={closeLinkEditor}
            aria-label="Cancel"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  disabled = false,
  id,
  error = false,
  className,
}: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: {
          openOnClick: false,
          autolink: true,
          HTMLAttributes: { rel: 'noopener noreferrer nofollow', target: '_blank' },
        },
      }),
      Placeholder.configure({ placeholder: placeholder ?? 'Write your message…' }),
    ],
    content: value || '',
    editable: !disabled,
    editorProps: {
      attributes: {
        id: id ?? '',
        class: 'rte-content focus:outline-none',
      },
    },
    onUpdate: ({ editor: current }) => {
      const html = current.getHTML();
      onChange(html === EMPTY_HTML ? '' : html);
    },
  });

  useEffect(() => {
    if (!editor || editor.isDestroyed) {
      return;
    }
    const currentHtml = editor.getHTML();
    const normalizedCurrent = currentHtml === EMPTY_HTML ? '' : currentHtml;
    if (value !== normalizedCurrent) {
      editor.commands.setContent(value || '', { emitUpdate: false });
    }
  }, [value, editor]);

  useEffect(() => {
    if (!editor || editor.isDestroyed) {
      return;
    }
    editor.setEditable(!disabled);
  }, [disabled, editor]);

  return (
    <div
      className={cn(
        'overflow-hidden rounded-md border bg-white shadow-sm transition-colors',
        'focus-within:ring-primary/30 focus-within:border-primary focus-within:ring-2',
        error ? 'border-destructive' : 'border-input',
        disabled && 'cursor-not-allowed opacity-60',
        className
      )}
    >
      {editor && <Toolbar editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  );
}

export default RichTextEditor;
