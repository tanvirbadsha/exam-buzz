"use client";

import { FileText, UploadCloud, X } from "lucide-react";
import Image from "next/image";
import { forwardRef, useEffect, useRef, useState } from "react";

export const FileUpload = forwardRef(
  (
    {
      label,
      error,
      onChange,
      existingUrl,
      existingFileName,
      onRemoveExisting,
      uploadHint = "PDF, JPG, PNG (Max. 5MB)",
      ...props
    },
    ref,
  ) => {
    // Initialize state with existing server data if it exists
    const [preview, setPreview] = useState(existingUrl || null);
    const [fileName, setFileName] = useState(
      existingFileName || (existingUrl ? "Existing Document" : ""),
    );

    const inputRef = useRef(null);
    const inputId = props.id || props.name;
    const errorId = error && inputId ? `${inputId}-error` : undefined;

    const setInputRef = (node) => {
      inputRef.current = node;
      if (typeof ref === "function") {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    };

    const handleFileChange = (e) => {
      const file = e.target.files[0];
      if (file) {
        setFileName(file.name);
        if (file.type.startsWith("image/")) {
          setPreview(URL.createObjectURL(file));
        } else {
          setPreview("document");
        }
      }

      if (onChange) onChange(e);
    };

    const clearFile = (e) => {
      e.preventDefault();
      e.stopPropagation();

      // Notify the parent form so persisted URLs and newly selected files clear together.
      if (onRemoveExisting) {
        onRemoveExisting();
      }

      setPreview(null);
      setFileName("");

      if (inputRef.current) {
        inputRef.current.value = "";
        inputRef.current.dispatchEvent(new Event("change", { bubbles: true }));
      }
    };

    useEffect(() => {
      return () => {
        // CRITICAL FIX: Only revoke temporary local blob URLs.
        // Do not attempt to revoke standard https:// URLs or the string "document".
        if (preview && preview.startsWith("blob:")) {
          URL.revokeObjectURL(preview);
        }
      };
    }, [preview]);

    // Check if the preview is a PDF link from the server
    const isServerPdf = preview && preview.includes(".pdf");

    return (
      <div className="field-group">
        {label && (
          <label htmlFor={inputId} className="field-label">
            {label}
          </label>
        )}

        <div
          className={`relative flex min-h-40 flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition-colors ${
            error
              ? "border-rose-400 bg-rose-50"
              : "border-border-strong bg-surface-muted hover:border-brand hover:bg-brand-soft/40"
          }`}
        >
          <input
            ref={setInputRef}
            id={inputId}
            type="file"
            accept=".jpg,.jpeg,.png,.pdf"
            onChange={handleFileChange}
            aria-invalid={Boolean(error)}
            aria-describedby={errorId}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            {...props}
          />

          {!preview ? (
            <div className="pointer-events-none flex flex-col items-center text-center">
              <div className="mb-3 rounded-full bg-surface p-3 shadow-sm">
                <UploadCloud size={24} className="text-brand" />
              </div>
              <p className="text-sm font-semibold text-foreground">
                Click to upload or drag and drop
              </p>
              <p className="mt-1 text-xs text-muted">{uploadHint}</p>
            </div>
          ) : (
            <div className="relative z-10 flex w-full items-center justify-between rounded-lg border border-border bg-surface p-3 shadow-sm">
              <div className="flex items-center gap-3 overflow-hidden">
                {preview === "document" || isServerPdf ? (
                  <div className="shrink-0 rounded-lg bg-blue-50 p-2 text-blue-600">
                    <FileText size={20} />
                  </div>
                ) : (
                  <Image
                    src={preview}
                    alt={`Preview of ${fileName}`}
                    width={40}
                    height={40}
                    unoptimized // Keep this, as external server URLs will fail Next.js optimization without config
                    className="h-10 w-10 shrink-0 rounded-lg border border-border object-cover"
                  />
                )}

                {isServerPdf ? (
                  <a
                    href={preview}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate text-sm font-semibold text-brand-strong hover:underline"
                    // Stop click from bubbling up and opening the file dialogue again
                    onClick={(e) => e.stopPropagation()}
                  >
                    {fileName} (Click to view PDF)
                  </a>
                ) : (
                  <span className="truncate text-sm font-semibold text-foreground">
                    {fileName}
                  </span>
                )}
              </div>
              <button
                type="button"
                aria-label="Remove selected file"
                onClick={clearFile}
                className="icon-button h-8 w-8 hover:bg-rose-50 hover:text-rose-500"
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>
        {error && (
          <span id={errorId} className="field-error" role="alert">
            {error.message}
          </span>
        )}
      </div>
    );
  },
);

FileUpload.displayName = "FileUpload";
