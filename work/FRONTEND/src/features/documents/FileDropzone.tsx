import React, { useState, useRef } from 'react';
import { documentQueries } from '../../api/queries/documents';
import { DocumentMeta } from '../../api/types';
import {
  UploadCloud,
  File,
  CheckCircle,
  AlertCircle,
  X,
  FileText,
  RefreshCw,
} from 'lucide-react';

interface UploadItem {
  id: string;
  file: File;
  docType: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  errorMessage?: string;
  uploadedMeta?: DocumentMeta;
}

interface FileDropzoneProps {
  applicationId: string;
  docTypeDefault?: string;
  onUploadSuccess: (meta: DocumentMeta) => void;
  allowedTypes?: string[];
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({
  applicationId,
  docTypeDefault = 'Supporting Document',
  onUploadSuccess,
  allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'],
}) => {
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [selectedDocType, setSelectedDocType] = useState<string>(docTypeDefault);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startUpload = async (item: UploadItem) => {
    setUploads((prev) =>
      prev.map((u) => (u.id === item.id ? { ...u, status: 'uploading', progress: 30 } : u))
    );

    // Simulate progress animation
    const progressTimer = setInterval(() => {
      setUploads((prev) =>
        prev.map((u) => {
          if (u.id === item.id && u.status === 'uploading' && u.progress < 90) {
            return { ...u, progress: u.progress + 20 };
          }
          return u;
        })
      );
    }, 150);

    try {
      const formData = new FormData();
      formData.append('file', item.file);
      formData.append('doc_type', item.docType);

      const res = await documentQueries.uploadDocument(applicationId, formData);
      clearInterval(progressTimer);

      setUploads((prev) =>
        prev.map((u) =>
          u.id === item.id ? { ...u, status: 'completed', progress: 100, uploadedMeta: res } : u
        )
      );

      onUploadSuccess(res);
    } catch (err: any) {
      clearInterval(progressTimer);
      setUploads((prev) =>
        prev.map((u) =>
          u.id === item.id
            ? {
                ...u,
                status: 'error',
                errorMessage: err.message || 'Upload rejected by validation service',
              }
            : u
        )
      );
    }
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newItems: UploadItem[] = Array.from(files).map((f) => ({
      id: `up_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      file: f,
      docType: selectedDocType,
      progress: 0,
      status: 'pending',
    }));

    setUploads((prev) => [...newItems, ...prev]);

    // Trigger upload for each new file
    newItems.forEach((item) => {
      startUpload(item);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeUpload = (id: string) => {
    setUploads((prev) => prev.filter((u) => u.id !== id));
  };

  const retryUpload = (item: UploadItem) => {
    startUpload(item);
  };

  return (
    <div className="space-y-4">
      {/* Document Type Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <label className="font-mono uppercase tracking-wider text-muted">
          Designate Statutory Document Type
        </label>
        <select
          value={selectedDocType}
          onChange={(e) => setSelectedDocType(e.target.value)}
          className="px-3 py-1.5 rounded-lg border border-line-light bg-white text-ink text-xs font-sans outline-none focus:border-brand"
        >
          <option value="Land Ownership / Lease Deed">Land Ownership / Lease Deed</option>
          <option value="Fire & Safety Certificate">Fire & Safety Certificate</option>
          <option value="Faculty Cadre & Salary Declaration">Faculty Cadre & Salary Declaration</option>
          <option value="Approved Building Floor Plan">Approved Building Floor Plan</option>
          <option value="Society Registration Certificate">Society Registration Certificate</option>
          <option value="Audited Financial Statements">Audited Financial Statements</option>
          <option value="Supporting Evidence">Supporting Evidence</option>
        </select>
      </div>

      {/* Drag & Drop Surface */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`p-8 rounded-2xl border-2 border-dashed text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-brand bg-tint-brand/40'
            : 'border-line-light bg-white/40 hover:bg-white/80 hover:border-brand/40'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center gap-2">
          <div className="w-10 h-10 rounded-full bg-tint-brand text-brand flex items-center justify-center mb-1">
            <UploadCloud className="w-5 h-5" />
          </div>
          <p className="font-medium text-sm text-ink">
            Click to upload or drag and drop official document
          </p>
          <p className="font-mono text-[11px] text-muted">
            Accepted formats: PDF, JPG, PNG (Max 15MB per file) · Real cryptographic hashing applied on server
          </p>
        </div>
      </div>

      {/* Per-File Upload Items List */}
      {uploads.length > 0 && (
        <div className="space-y-2 pt-2">
          <p className="font-mono text-[11px] uppercase tracking-wider text-muted font-semibold">
            Upload Progress ({uploads.length})
          </p>
          <div className="space-y-2">
            {uploads.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl border border-line-light bg-white text-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 truncate max-w-md">
                    <FileText className="w-4 h-4 text-brand shrink-0" />
                    <div>
                      <p className="font-medium text-ink truncate">{item.file.name}</p>
                      <p className="font-mono text-[10px] text-muted">
                        {(item.file.size / 1024 / 1024).toFixed(2)} MB · {item.docType}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.status === 'uploading' && (
                      <span className="font-mono text-[10px] text-brand">
                        {item.progress}%
                      </span>
                    )}

                    {item.status === 'completed' && (
                      <span className="inline-flex items-center gap-1 font-mono text-[10px] text-ok font-semibold">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Uploaded
                      </span>
                    )}

                    {item.status === 'error' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          retryUpload(item);
                        }}
                        className="inline-flex items-center gap-1 text-[10px] font-mono text-danger hover:underline"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Retry
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeUpload(item.id);
                      }}
                      className="p-1 text-muted hover:text-ink rounded"
                      aria-label="Remove item"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                {item.status === 'uploading' && (
                  <div className="w-full bg-black/[0.05] h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-brand h-full transition-all duration-200"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                )}

                {/* Per-file error */}
                {item.status === 'error' && item.errorMessage && (
                  <div className="p-2 rounded bg-tint-danger text-danger text-[11px] flex items-center gap-2 font-mono">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <p>{item.errorMessage}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
