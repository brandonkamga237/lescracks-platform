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
import { adminApi } from '@/services/adminApi';

interface SunEditorInstance {
  getContents: () => string;
  setContents: (html: string) => void;
  destroy: () => void;
}

interface ArticleEditorProps {
  value?: string;
  onChange: (html: string) => void;
}

export default function ArticleEditor({ value, onChange }: ArticleEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<SunEditorInstance | null>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!containerRef.current) return;

    const onImageUploadBefore = (
      files: File[],
      _info: object,
      uploadHandler: (data: { result: Array<{ url: string; name: string; size: number }> }) => void,
    ) => {
      const file = files[0];
      if (!file) return;
      adminApi
        .uploadImage(file)
        .then(({ url }) => uploadHandler({ result: [{ url, name: file.name, size: file.size }] }))
        .catch(() => uploadHandler({ result: [{ url: '', name: file.name, size: file.size }] }));
    };

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
        onChange: (content: string) => onChange(content),
        onImageUploadBefore,
      },
    };

    const editor = SUNEDITOR.create(containerRef.current, options as unknown as Parameters<typeof SUNEDITOR.create>[1]) as unknown as SunEditorInstance;
    editorRef.current = editor;

    return () => {
      try {
        editor.destroy();
      } catch {
        // already removed
      }
      editorRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (editorRef.current && value !== undefined && value !== editorRef.current.getContents()) {
      editorRef.current.setContents(value);
    }
  }, [value]);

  return <div ref={containerRef} className="rounded-2xl border border-line bg-noir-900 p-2" />;
}
