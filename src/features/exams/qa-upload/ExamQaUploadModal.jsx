"use client";

import { CustomDropdown } from "@/components/ui/forms/CustomDropdown";
import { EXAM_PDF_MAX_FILE_SIZE } from "@/lib/examData";
import { FileText, Image as ImageIcon, UploadCloud, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const DOCUMENT_TYPE_OPTIONS = [
  { label: "Question", value: "question" },
  { label: "Demo answer", value: "demoAnswer" },
];

const ACCEPTED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];

function getInitialDocumentType(exam) {
  if (!exam?.questionPDF) return "question";
  if (!exam?.demoAnswerPDF) return "demoAnswer";
  return "question";
}

function isAcceptedFile(file) {
  if (!file) return false;
  if (ACCEPTED_TYPES.includes(file.type)) return true;

  return /\.(pdf|jpe?g|png|webp)$/i.test(file.name || "");
}

function FilePreview({ file, previewUrl }) {
  if (!file) {
    return (
      <div className="flex min-h-32 flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-surface-muted px-4 py-6 text-center">
        <UploadCloud size={24} className="text-brand" />
        <p className="mt-2 text-sm font-semibold text-foreground">
          Select an image or PDF
        </p>
        <p className="mt-1 text-xs text-muted">PDF, JPG, PNG, WEBP up to 5MB</p>
      </div>
    );
  }

  const isImage = file.type.startsWith("image/") && previewUrl;

  return (
    <div className="rounded-lg border border-border bg-surface p-3">
      <div className="flex items-center gap-3">
        {isImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt={`Preview of ${file.name}`}
            className="h-16 w-16 rounded-lg border border-border object-cover"
          />
        ) : (
          <span className="flex h-16 w-16 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <FileText size={26} />
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">
            {file.name}
          </p>
          <p className="mt-1 text-xs text-muted">
            {(file.size / 1024 / 1024).toFixed(2)} MB
          </p>
        </div>
      </div>
    </div>
  );
}

export function ExamQaUploadModal({ exam, isSubmitting, onClose, onSubmit }) {
  const [documentType, setDocumentType] = useState(() =>
    getInitialDocumentType(exam),
  );
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const previewUrl = useMemo(() => {
    if (!file || !file.type.startsWith("image/")) return "";
    return URL.createObjectURL(file);
  }, [file]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    if (!exam) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !isSubmitting) onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [exam, isSubmitting, onClose]);

  if (!exam) return null;

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0] || null;

    if (!selectedFile) {
      setFile(null);
      setError("");
      return;
    }

    if (!isAcceptedFile(selectedFile)) {
      setFile(null);
      setError("Upload a PDF or image file.");
      return;
    }

    if (selectedFile.size > EXAM_PDF_MAX_FILE_SIZE) {
      setFile(null);
      setError("Upload a file that is 5MB or smaller.");
      return;
    }

    setFile(selectedFile);
    setError("");
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!file) {
      setError("Select a file before uploading.");
      return;
    }

    onSubmit({ documentType, file });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/50 px-4 py-6 backdrop-blur-[2px] sm:py-10"
      role="dialog"
      aria-modal="true"
      aria-labelledby="exam-qa-upload-title"
    >
      <button
        type="button"
        aria-label="Close upload modal"
        className="fixed inset-0 cursor-default"
        disabled={isSubmitting}
        onClick={onClose}
      />
      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-full max-w-lg rounded-xl border border-border bg-surface p-5 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-brand-strong">
              Question & answer
            </p>
            <h2
              id="exam-qa-upload-title"
              className="mt-1 break-words text-xl font-black text-foreground"
            >
              Upload exam file
            </h2>
            <p className="mt-1 break-words text-sm text-muted">{exam.name}</p>
          </div>
          <button
            type="button"
            className="icon-button h-9 w-9"
            disabled={isSubmitting}
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-5 grid gap-4">
          <CustomDropdown
            label="Upload type"
            icon={ImageIcon}
            options={DOCUMENT_TYPE_OPTIONS}
            value={documentType}
            onChange={(option) => setDocumentType(option.value)}
            placeholder="Select file type"
            searchPlaceholder="Search type..."
          />

          <label className="field-group">
            <span className="field-label">File</span>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="field-shell min-h-11 w-full cursor-pointer px-3 py-2 text-sm text-foreground file:mr-3 file:rounded-md file:border-0 file:bg-brand-soft file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-brand-strong"
            />
          </label>

          <FilePreview file={file} previewUrl={previewUrl} />
          {error && (
            <span className="field-error" role="alert">
              {error}
            </span>
          )}
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            className="button button-secondary"
            disabled={isSubmitting}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="button button-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Uploading..." : "Upload file"}
          </button>
        </div>
      </form>
    </div>
  );
}
