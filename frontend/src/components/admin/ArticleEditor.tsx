import 'suneditor/src/assets/suneditor.css';
import 'suneditor/src/assets/suneditor-contents.css';
import 'suneditor/src/themes/dark.css';

import { useEffect, useRef } from 'react';
import SUNEDITOR from 'suneditor';
import {
  align,
  backgroundColor,
  blockStyle,
  font,
  fontColor,
  fontSize,
  hr,
  image,
  link,
  list,
  table,
  video,
} from 'suneditor/plugins';

interface ArticleEditorProps {
  value?: string;
  onChange: (html: string) => void;
}

export default function ArticleEditor({ value, onChange }: ArticleEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<{ destroy: () => void } | null>(null);
  const onChangeRef = useRef(onChange);

  onChangeRef.current = onChange;

  useEffect(() => {
    if (!containerRef.current) return;

    const plugins = [
      align,
      backgroundColor,
      blockStyle,
      font,
      fontColor,
      fontSize,
      hr,
      image,
      link,
      list,
      table,
      video,
    ];

    const options: Record<string, unknown> = {
      height: 'auto',
      minHeight: '300px',
      theme: 'dark',
      value: value ?? '',
      plugins,
      image: {
        uploadUrl: '/api/admin/upload/image',
      },
      buttonList: [
        ['undo', 'redo'],
        ['font', 'fontSize'],
        ['bold', 'italic', 'underline', 'strike', 'subscript', 'superscript'],
        ['fontColor', 'backgroundColor'],
        ['align', 'list', 'table', 'hr', 'blockStyle'],
        ['link', 'image', 'video'],
        ['fullScreen', 'codeView'],
      ],
      placeholder: 'Rédige ton article ici…',
      events: {
        onChange: ({ data }: { data: string }) => onChangeRef.current(data),
      },
    };

    const editor = SUNEDITOR.create(
      containerRef.current,
      options as unknown as Parameters<typeof SUNEDITOR.create>[1],
    ) as unknown as { destroy: () => void };
    editorRef.current = editor;

    return () => {
      try {
        editor.destroy();
      } catch {
        // already removed
      }
      editorRef.current = null;
    };
    // The editor is recreated only on mount; value updates come from the editor itself.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={containerRef} className="rounded-2xl border border-line bg-noir-900 p-2" />;
}
