import { useEffect, useRef, useState } from 'react';
import { renderAsync } from 'docx-preview';
import { AlertTriangle, Download } from 'lucide-react';

interface DocxPreviewProps {
  url: string;
  fileName: string;
}

type Status = 'loading' | 'ready' | 'failed';

export function DocxPreview({ url, fileName }: DocxPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');

    async function load() {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
        const blob = await res.blob();
        if (cancelled || !containerRef.current) return;
        containerRef.current.innerHTML = '';
        await renderAsync(blob, containerRef.current, undefined, {
          ignoreWidth: false,
          ignoreHeight: false,
          className: 'docx-preview',
        });
        if (!cancelled) setStatus('ready');
      } catch {
        if (!cancelled) setStatus('failed');
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [url]);

  if (status === 'failed') {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center text-sm text-gray-500">
        <AlertTriangle className="h-6 w-6 text-amber-500" />
        <p className="font-medium text-gray-700">Preview unavailable for this document.</p>
        <p>Download it instead to view the full content.</p>
        <a
          href={url}
          download={fileName}
          className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-800"
        >
          <Download className="h-3.5 w-3.5" /> Download
        </a>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto bg-gray-100 px-4 py-6">
      {status === 'loading' && (
        <p className="py-16 text-center text-sm text-gray-400">Loading document…</p>
      )}
      <div
        ref={containerRef}
        className={status === 'ready' ? 'mx-auto max-w-3xl [&_.docx-preview]:bg-white [&_.docx-preview]:shadow-lg' : 'hidden'}
      />
    </div>
  );
}
