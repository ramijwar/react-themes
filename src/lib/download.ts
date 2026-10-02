import JSZip from 'jszip';

/* أدوات التنزيل والحزم */

export function downloadBlob(data: BlobPart, filename: string, type = 'text/plain;charset=utf-8') {
  const blob = new Blob([data], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export async function downloadZip(files: Record<string, string | Blob>, zipName: string) {
  const zip = new JSZip();
  for (const [path, content] of Object.entries(files)) {
    zip.file(path, content);
  }
  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
  downloadBlob(blob, zipName, 'application/zip');
}

export function safeName(s: string): string {
  return (s || 'template').trim().replace(/[^\p{L}\p{N} _-]/gu, '').replace(/\s+/g, '-').slice(0, 60) || 'template';
}
