'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import {
  Bold as IconBold,
  Italic as IconItalic,
  Link as IconLink,
  Image as IconImage,
  List as IconList,
  ListOrdered as IconListOrdered,
  Heading1 as IconH1,
  Heading2 as IconH2,
  Code as IconCode,
  Undo as IconUndo,
  Redo as IconRedo,
} from 'lucide-react';

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
};

const TOOLBAR_BTN =
  'inline-flex h-8 w-8 items-center justify-center rounded-md border border-transparent text-muted-foreground hover:bg-muted hover:text-foreground transition-colors';
const TOOLBAR_BTN_ACTIVE = 'bg-muted text-foreground border-border';

export function MailRichEditor({ value, onChange, placeholder, className }: Props) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    immediatelyRender: false, // Next.js SSR-Hydration-Mismatch vermeiden
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
      }),
      Image.configure({
        HTMLAttributes: { class: 'max-w-full h-auto rounded' },
      }),
    ],
    content: value || '<p></p>',
    editorProps: {
      attributes: {
        class:
          'min-h-[280px] w-full max-w-full px-3 py-3 text-[14px] leading-relaxed focus:outline-none prose prose-sm dark:prose-invert prose-headings:font-semibold prose-p:my-2 prose-img:my-2',
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());
    },
  });

  // Wenn `value` extern resettet wird (z.B. nach Send), Editor synchronisieren
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (value && value !== current) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [value, editor]);

  const handleAddLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('URL', prev ?? 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().unsetLink().run();
      return;
    }
    let normalized = url.trim();
    if (!/^https?:\/\//i.test(normalized)) normalized = 'https://' + normalized;
    editor.chain().focus().extendMarkRange('link').setLink({ href: normalized }).run();
  }, [editor]);

  const handleImageUpload = useCallback(
    async (file: File) => {
      if (!editor) return;
      setUploading(true);
      try {
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch('/api/mail/upload-image', { method: 'POST', body: fd });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'upload_failed' }));
          alert(`Upload fehlgeschlagen: ${err.error ?? 'unbekannt'}`);
          return;
        }
        const { url } = (await res.json()) as { url: string };
        editor.chain().focus().setImage({ src: url, alt: file.name }).run();
      } catch (e) {
        alert(`Upload-Fehler: ${e instanceof Error ? e.message : 'unbekannt'}`);
      } finally {
        setUploading(false);
      }
    },
    [editor],
  );

  const onPickFile = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  if (!editor) {
    return (
      <div className="rounded-md border border-border bg-background p-3 text-[13px] text-muted-foreground">
        Editor lädt...
      </div>
    );
  }

  return (
    <div className={`rounded-md border border-border bg-background ${className ?? ''}`}>
      <Toolbar
        editor={editor}
        onAddLink={handleAddLink}
        onPickImage={onPickFile}
        uploading={uploading}
      />
      <div className="border-t border-border">
        <EditorContent editor={editor} />
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/gif,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleImageUpload(f);
          e.target.value = '';
        }}
      />
      {placeholder && !editor.getText() && (
        <div className="pointer-events-none absolute mt-[-280px] px-3 py-3 text-[14px] text-muted-foreground/50">
          {placeholder}
        </div>
      )}
    </div>
  );
}

type ToolbarProps = {
  editor: Editor;
  onAddLink: () => void;
  onPickImage: () => void;
  uploading: boolean;
};

function Toolbar({ editor, onAddLink, onPickImage, uploading }: ToolbarProps) {
  const btn = (active: boolean) => `${TOOLBAR_BTN} ${active ? TOOLBAR_BTN_ACTIVE : ''}`;

  return (
    <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5">
      <button
        type="button"
        title="Bold (Ctrl+B)"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={btn(editor.isActive('bold'))}
      >
        <IconBold size={15} />
      </button>
      <button
        type="button"
        title="Italic (Ctrl+I)"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={btn(editor.isActive('italic'))}
      >
        <IconItalic size={15} />
      </button>

      <div className="mx-1 h-5 w-px bg-border" />

      <button
        type="button"
        title="Überschrift 1"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={btn(editor.isActive('heading', { level: 1 }))}
      >
        <IconH1 size={15} />
      </button>
      <button
        type="button"
        title="Überschrift 2"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={btn(editor.isActive('heading', { level: 2 }))}
      >
        <IconH2 size={15} />
      </button>

      <div className="mx-1 h-5 w-px bg-border" />

      <button
        type="button"
        title="Aufzählung"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={btn(editor.isActive('bulletList'))}
      >
        <IconList size={15} />
      </button>
      <button
        type="button"
        title="Nummerierte Liste"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={btn(editor.isActive('orderedList'))}
      >
        <IconListOrdered size={15} />
      </button>
      <button
        type="button"
        title="Code"
        onClick={() => editor.chain().focus().toggleCode().run()}
        className={btn(editor.isActive('code'))}
      >
        <IconCode size={15} />
      </button>

      <div className="mx-1 h-5 w-px bg-border" />

      <button
        type="button"
        title="Link einfügen / entfernen"
        onClick={onAddLink}
        className={btn(editor.isActive('link'))}
      >
        <IconLink size={15} />
      </button>
      <button
        type="button"
        title="Bild hochladen"
        onClick={onPickImage}
        disabled={uploading}
        className={`${btn(false)} ${uploading ? 'opacity-50 cursor-wait' : ''}`}
      >
        <IconImage size={15} />
      </button>
      {uploading && <span className="ml-1 text-[11px] text-muted-foreground">Lade hoch...</span>}

      <div className="mx-1 h-5 w-px bg-border" />

      <button
        type="button"
        title="Rückgängig"
        onClick={() => editor.chain().focus().undo().run()}
        className={btn(false)}
      >
        <IconUndo size={15} />
      </button>
      <button
        type="button"
        title="Wiederholen"
        onClick={() => editor.chain().focus().redo().run()}
        className={btn(false)}
      >
        <IconRedo size={15} />
      </button>
    </div>
  );
}
