'use client';

import { useRef, useState } from 'react';

interface DocumentDropzoneProps {
  documentId: string;
  documentLabel: string;
  applicationId?: string;
  onUploaded: (fileUrl: string, fileName: string) => void;
}

export function DocumentDropzone({ documentId, documentLabel, applicationId, onUploaded }: DocumentDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (file: File) => {
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentId', documentId);
      formData.append('documentLabel', documentLabel);
      if (applicationId) formData.append('applicationId', applicationId);

      const res = await fetch('/api/investor-documents/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.fileUrl) {
        onUploaded(data.fileUrl, data.fileName);
      } else {
        setError(data.error || 'Upload failed');
      }
    } catch {
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `1.5px dashed ${dragging ? 'var(--ledger-green)' : 'var(--line)'}`,
          borderRadius: '4px',
          padding: '16px',
          textAlign: 'center',
          cursor: 'pointer',
          background: dragging ? 'var(--ledger-green-soft)' : 'var(--paper)',
          transition: 'all 0.15s',
        }}
      >
        {uploading ? (
          <p style={{ fontSize: '13px', color: 'var(--slate)', margin: 0 }}>Uploading…</p>
        ) : (
          <>
            <p style={{ fontSize: '13px', color: 'var(--slate)', margin: '0 0 4px' }}>
              Drop file here or <span style={{ color: 'var(--blue)', textDecoration: 'underline' }}>browse</span>
            </p>
            <p style={{ fontSize: '11px', color: 'var(--slate-light)', margin: 0 }}>PDF, JPG, PNG up to 10MB</p>
          </>
        )}
      </div>
      {error && <p style={{ fontSize: '12px', color: 'var(--clay)', marginTop: '4px' }}>{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
        style={{ display: 'none' }}
        onChange={onFileSelect}
      />
    </div>
  );
}
