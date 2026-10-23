import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Send,
  Link as LinkIcon,
  Mail,
  X,
  Sparkles,
  Info,
} from 'lucide-react';
import { DetectionRequest, ParsedEmailResponse } from '../types';
import { parseEmailFile } from '../services/api';

interface EmailUploadPanelProps {
  request: DetectionRequest;
  onChange: (field: keyof DetectionRequest, value: string) => void;
  onAnalyze: () => void;
  isLoading: boolean;
  analysisError: string | null;
  onClearAll: () => void;
}

const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB

const SAMPLE_EML_CONTENT = `From: Security Notification <security-alert@paypal-update.net>
To: recipient@example.com
Subject: URGENT: Your PayPal Account Has Been Suspended
Date: Fri, 23 Oct 2026 10:14:00 +0000
Content-Type: text/plain; charset="utf-8"

Dear Valued Customer,

We detected unusual login attempts from an unknown device (IP: 192.168.1.55).
Your account has been temporarily restricted to safeguard your funds.

Please restore access immediately by authenticating your credentials at:
http://192.168.1.55/update-banking-security-alert.xyz/auth

Failure to verify within 24 hours will result in permanent account termination.

Sincerely,
PayPal Security & Risk Operations
`;

const SAMPLE_TXT_CONTENT = `From: accounts-verify@apple-cloud-service.net
Subject: Security Alert: Apple ID Locked
Date: 23 Oct 2026

Your Apple ID was locked due to multiple failed authentication attempts.
Verify your identity immediately at http://apple-verification.xyz/restore to unlock your account.
`;

const SAMPLE_PDF_B64 =
  'JVBERi0xLjcKJcK1wrYKJSBXcml0dGVuIGJ5IE11UERGIDEuMjguNQoKMSAwIG9iago8PC9UeXBlL0NhdGFsb2cvUGFnZXMgMiAwIFIvSW5mbzw8L1Byb2R1Y2VyKE11UERGIDEuMjguNSk+Pj4+CmVuZG9iagoKMiAwIG9iago8PC9UeXBlL1BhZ2VzL0NvdW50IDEvS2lkc1s0IDAgUl0+PgplbmRvYmoKCjMgMCBvYmoKPDwvRm9udDw8L2hlbHYgNSAwIFI+Pj4+CmVuZG9iagoKNCAwIG9iago8PC9UeXBlL1BhZ2UvTWVkaWFCb3hbMCAwIDU5NSA4NDJdL1JvdGF0ZSAwL1Jlc291cmNlcyAzIDAgUi9QYXJlbnQgMiAwIFIvQ29udGVudHNbNiAwIFJdPj4KZW5kb2JqCgo1IDAgb2JqCjw8L1R5cGUvRm9udC9TdWJ0eXBlL1R5cGUxL0Jhc2VGb250L0hlbHZldGljYS9FbmNvZGluZy9XaW5BbnNpRW5jb2Rpbmc+PgplbmRvYmoKCjYgMCBvYmoKPDwvTGVuZ3RoIDI0My9GaWx0ZXIvRmxhdGVEZWNvZGU+PgpzdHJlYW0KeNpdkDtLRDEQhfv8itSCOsm8bmCxEG3shHSLxWVvgoUWNv5+z0RBWIa8ZpJzvkn6So89lUyIkpWyO+X+me7fx8d3LiX3mc8nMa827eC9krOpsSsyzcVbPUxMnVyEnKx4i9kuyGNGpbrU4Rvy+8Nbf0mUb4velSK5P6XzSaFl1falKuEg/KttzXgpkV57kgybfzd0qfYbcP7vtKGO+zVYGIGTDZAQFDi6QJVBimzwGxjhY7Y8zMLDgkNXdSwvsMRb9Bg6G0jECcSzTi7cuNaB1XiLFUNZ67z+E/iKbcFhByL0Wyhid4HrWD089/SafgCIMVzjCmVuZHN0cmVhbQplbmRvYmoKCnhyZWYKMCA3CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDA0MiAwMDAwMCBuIAowMDAwMDAwMTIwIDAwMDAwIG4gCjAwMDAwMDAxNzIgMDAwMDAgbiAKMDAwMDAwMDIxMyAwMDAwMCBuIAowMDAwMDAwMzIwIDAwMDAwIG4gCjAwMDAwMDA0MDkgMDAwMDAgbiAKCnRyYWlsZXIKPDwvU2l6ZSA3L1Jvb3QgMSAwIFIvSURbPEMyQUJDMzg0QzI5RkMyOTdDMzgxQzNBOUMyODcxMkMyPjxGRDA0NDhDNTRFNjBDMDE3N0NDMjVBRjE2OTFEODAzMz5dPj4Kc3RhcnR4cmVmCjcyMQolJUVPRgo=';

export const EmailUploadPanel: React.FC<EmailUploadPanelProps> = ({
  request,
  onChange,
  onAnalyze,
  isLoading,
  analysisError,
  onClearAll,
}) => {
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedEmailResponse | null>(null);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [formValidation, setFormValidation] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleProcessFile = async (file: File) => {
    setUploadError(null);
    setFormValidation(null);

    // 1. Client-side extension validation (.eml, .txt, .pdf)
    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (ext !== '.eml' && ext !== '.txt' && ext !== '.pdf') {
      setUploadError(
        `Unsupported file type '${ext || 'unknown'}'. Please upload an email file (.eml, .txt, or .pdf).`
      );
      return;
    }

    // 2. Client-side size validation (2 MB)
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setUploadError(
        `File size (${formatFileSize(file.size)}) exceeds the maximum allowed limit of 2 MB.`
      );
      return;
    }

    if (file.size === 0) {
      setUploadError('Selected file is empty (0 bytes).');
      return;
    }

    setSelectedFile(file);
    setIsParsing(true);

    try {
      const parsed = await parseEmailFile(file);
      setParsedData(parsed);

      // Populate detection request form with extracted fields
      onChange('sender', parsed.sender || '');
      onChange('subject', parsed.subject || '');
      onChange('body', parsed.body || '');
      onChange('url', parsed.primary_url || '');
    } catch (err: unknown) {
      setParsedData(null);
      setUploadError(
        err instanceof Error ? err.message : 'Failed to parse email file.'
      );
    } finally {
      setIsParsing(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleProcessFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      handleProcessFile(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setParsedData(null);
    setUploadError(null);
    setFormValidation(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClearAll();
  };

  const handleLoadSampleFile = (type: 'eml' | 'txt' | 'pdf') => {
    if (type === 'pdf') {
      const binaryString = atob(SAMPLE_PDF_B64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const file = new File([blob], 'sample_security_notice.pdf', { type: 'application/pdf' });
      handleProcessFile(file);
      return;
    }

    const isEml = type === 'eml';
    const content = isEml ? SAMPLE_EML_CONTENT : SAMPLE_TXT_CONTENT;
    const filename = isEml ? 'sample_phishing_alert.eml' : 'sample_security_notice.txt';
    const mime = isEml ? 'message/rfc822' : 'text/plain';
    const blob = new Blob([content], { type: mime });
    const file = new File([blob], filename, { type: mime });
    handleProcessFile(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormValidation(null);

    // Validate that at least body, subject, or URL is present
    if (!request.sender && !request.url && !request.subject && !request.body) {
      setFormValidation('Please provide email body, URL, or subject to analyze.');
      return;
    }

    onAnalyze();
  };

  return (
    <div className="space-y-4">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".eml,.txt,.pdf,application/pdf,message/rfc822,text/plain"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* State 1: Drop Zone (When no file is loaded or currently uploading) */}
      {!parsedData && (
        <div className="space-y-3">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`relative rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
              isDragOver
                ? 'border-cipher-terracotta bg-cipher-terracotta/10 shadow-lg shadow-cipher-terracotta/10 scale-[1.01]'
                : 'border-cipher-border hover:border-cipher-terracotta/70 bg-cipher-elevated/40'
            }`}
          >
            {isParsing ? (
              <div className="py-6 space-y-3">
                <div className="w-10 h-10 mx-auto rounded-full border-2 border-cipher-terracotta border-t-transparent animate-spin" />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-cipher-text font-sans">
                    Extracting: {selectedFile?.name || 'Email Artifacts...'}
                  </h4>
                  <p className="text-xs text-cipher-muted font-mono">
                    Parsing document text layers, headers, and extracting destination URLs...
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-4 space-y-3">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-cipher-elevated border border-cipher-border flex items-center justify-center text-cipher-terracotta shadow-md">
                  <UploadCloud className="w-6 h-6" />
                </div>

                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-cipher-text font-sans">
                    Drop your email file here
                  </h4>
                  <p className="text-xs text-cipher-muted font-sans">
                    Upload an exported email or PDF document to automatically extract sender, subject, body, and destination links.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isParsing || isLoading}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cipher-elevated hover:bg-[#201F1C] border border-cipher-border text-xs font-mono font-semibold text-cipher-text transition-all hover:border-cipher-terracotta/60 shadow-sm"
                  >
                    <FileText className="w-3.5 h-3.5 text-cipher-terracotta" />
                    <span>Browse Files</span>
                  </button>
                </div>

                <div className="pt-2 flex flex-wrap items-center justify-center gap-2 text-[11px] font-mono text-cipher-muted">
                  <span className="px-2 py-0.5 rounded-md bg-cipher-surface border border-cipher-border text-cipher-text">
                    .eml
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-cipher-surface border border-cipher-border text-cipher-text">
                    .txt
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-cipher-surface border border-cipher-border text-cipher-text">
                    .pdf
                  </span>
                  <span>&bull;</span>
                  <span>Max size: 2 MB</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Sample File Loaders */}
          <div className="p-3.5 rounded-xl bg-cipher-elevated/70 border border-cipher-border space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-mono font-medium text-cipher-muted">
              <Sparkles className="w-3.5 h-3.5 text-cipher-terracotta" />
              <span>Or try a sample email file:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleLoadSampleFile('eml')}
                disabled={isParsing || isLoading}
                className="px-2.5 py-1.5 rounded-lg bg-cipher-surface hover:bg-[#201F1C] border border-cipher-border text-[11px] font-mono text-cipher-text transition-all flex items-center gap-1.5 hover:border-cipher-terracotta/50"
              >
                <span className="w-2 h-2 rounded-full bg-cipher-danger" />
                <span>Sample Phishing (.eml)</span>
              </button>
              <button
                type="button"
                onClick={() => handleLoadSampleFile('txt')}
                disabled={isParsing || isLoading}
                className="px-2.5 py-1.5 rounded-lg bg-cipher-surface hover:bg-[#201F1C] border border-cipher-border text-[11px] font-mono text-cipher-text transition-all flex items-center gap-1.5 hover:border-cipher-amber/50"
              >
                <span className="w-2 h-2 rounded-full bg-cipher-amber" />
                <span>Sample Notice (.txt)</span>
              </button>
              <button
                type="button"
                onClick={() => handleLoadSampleFile('pdf')}
                disabled={isParsing || isLoading}
                className="px-2.5 py-1.5 rounded-lg bg-cipher-surface hover:bg-[#201F1C] border border-cipher-border text-[11px] font-mono text-cipher-text transition-all flex items-center gap-1.5 hover:border-cipher-sage/50"
              >
                <span className="w-2 h-2 rounded-full bg-cipher-sage" />
                <span>Sample Document (.pdf)</span>
              </button>
            </div>
          </div>

          {/* Supported Formats Info */}
          <div className="flex items-start gap-2 p-3 rounded-xl bg-cipher-elevated/40 border border-cipher-border text-[11px] text-cipher-muted font-sans leading-relaxed">
            <Info className="w-4 h-4 text-cipher-sage flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-cipher-text font-mono">Format Notes: </span>
              Standard <code className="text-cipher-sage">.eml</code>, <code className="text-cipher-sage">.txt</code>, and text-based <code className="text-cipher-sage">.pdf</code> email documents are parsed in-memory. If a PDF is scanned or image-only, OCR is required. Executable actions and embedded macros are never run.
            </div>
          </div>
        </div>
      )}

      {/* Upload/Parsing Error Alert */}
      {uploadError && (
        <div
          className={`p-3.5 rounded-xl text-xs font-mono flex items-start gap-2.5 ${
            uploadError.toLowerCase().includes('ocr') || uploadError.toLowerCase().includes('scanned')
              ? 'bg-cipher-amber/10 border border-cipher-amber/40 text-cipher-amber'
              : 'bg-cipher-danger/10 border border-cipher-danger/30 text-cipher-danger'
          }`}
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold block">
              {uploadError.toLowerCase().includes('ocr') || uploadError.toLowerCase().includes('scanned')
                ? 'OCR Required for Scanned PDF'
                : 'Upload Error'}
            </span>
            <span className="leading-relaxed block mt-0.5">{uploadError}</span>
            {(uploadError.toLowerCase().includes('ocr') || uploadError.toLowerCase().includes('scanned')) && (
              <span className="text-[11px] text-cipher-muted block mt-1.5 font-sans">
                Tip: PhishGuard extracts selectable text layers from PDF email documents. For scanned physical papers, convert using an OCR tool or copy the text manually into the <strong>Enter Manually</strong> tab.
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setUploadError(null)}
            className="text-cipher-muted hover:text-cipher-text"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* State 2: Extracted Data Review & Edit Form */}
      {parsedData && (
        <div className="space-y-4">
          {/* File Metadata Banner */}
          <div className="p-3.5 rounded-xl bg-cipher-elevated border border-cipher-border flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 rounded-lg bg-cipher-sage/10 text-cipher-sage border border-cipher-sage/30 flex-shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-cipher-text truncate max-w-[200px] sm:max-w-[280px]">
                    {parsedData.filename}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cipher-surface border border-cipher-border text-cipher-muted uppercase">
                    {parsedData.file_type}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-cipher-muted block mt-0.5">
                  Size: {formatFileSize(parsedData.file_size_bytes)} &bull; Extracted {parsedData.extracted_urls.length} link(s)
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRemoveFile}
              disabled={isLoading}
              className="px-2.5 py-1.5 rounded-lg text-xs font-mono text-cipher-muted hover:text-cipher-danger bg-cipher-surface hover:bg-cipher-danger/10 border border-cipher-border hover:border-cipher-danger/30 transition-all flex items-center gap-1.5 flex-shrink-0"
              title="Remove file and select another"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Change File</span>
            </button>
          </div>

          {/* Missing Fields Notice */}
          {parsedData.missing_fields.length > 0 && (
            <div className="p-3 rounded-xl bg-cipher-amber/10 border border-cipher-amber/30 text-cipher-amber text-xs font-mono flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Missing Field Notice: </span>
                <span>
                  The file did not specify a{' '}
                  <span className="underline font-bold">
                    {parsedData.missing_fields.join(', ')}
                  </span>
                  . You can review or manually complete these fields below.
                </span>
              </div>
            </div>
          )}

          {/* Warnings List (if any) */}
          {parsedData.warnings.length > 0 && parsedData.missing_fields.length === 0 && (
            <div className="p-2.5 rounded-xl bg-cipher-elevated border border-cipher-border text-[11px] font-mono text-cipher-muted space-y-1">
              {parsedData.warnings.map((w, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <span className="text-cipher-sage">&bull;</span>
                  <span>{w}</span>
                </div>
              ))}
            </div>
          )}

          {/* Review / Edit Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Sender */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-cipher-muted font-medium flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-cipher-terracotta" />
                    <span>Sender Header:</span>
                  </span>
                  {parsedData.missing_fields.includes('sender') && (
                    <span className="text-[10px] text-cipher-amber font-mono">Not found in file</span>
                  )}
                </label>
                <input
                  type="text"
                  value={request.sender || ''}
                  onChange={(e) => onChange('sender', e.target.value)}
                  placeholder="e.g. security@paypal.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-cipher-elevated border border-cipher-border focus:border-cipher-terracotta focus:outline-none focus:ring-1 focus:ring-cipher-terracotta text-xs font-mono text-cipher-text placeholder:text-cipher-muted/60 transition-colors"
                />
              </div>

              {/* Destination URL */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-cipher-muted font-medium flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <LinkIcon className="w-3.5 h-3.5 text-cipher-sage" />
                    <span>Destination Link (URL):</span>
                  </span>
                  <span className="text-[10px] text-cipher-muted font-normal">
                    {parsedData.extracted_urls.length > 0
                      ? `${parsedData.extracted_urls.length} detected`
                      : 'Optional'}
                  </span>
                </label>
                <input
                  type="text"
                  value={request.url || ''}
                  onChange={(e) => onChange('url', e.target.value)}
                  placeholder="e.g. http://paypal-security.xyz/login"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-cipher-elevated border border-cipher-border focus:border-cipher-sage focus:outline-none focus:ring-1 focus:ring-cipher-sage text-xs font-mono text-cipher-text placeholder:text-cipher-muted/60 transition-colors"
                />
              </div>
            </div>

            {/* Multiple Extracted URLs Selector */}
            {parsedData.extracted_urls.length > 1 && (
              <div className="p-2.5 rounded-xl bg-cipher-elevated border border-cipher-border space-y-1.5">
                <span className="text-[10px] font-mono uppercase text-cipher-muted block font-semibold">
                  Detected Links (Click to select for structural analysis):
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {parsedData.extracted_urls.map((link, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => onChange('url', link)}
                      className={`px-2 py-0.5 rounded text-[11px] font-mono border transition-all text-left truncate max-w-full ${
                        request.url === link
                          ? 'bg-cipher-sage/20 border-cipher-sage text-cipher-sage font-bold'
                          : 'bg-cipher-surface border-cipher-border text-cipher-muted hover:text-cipher-text'
                      }`}
                      title={link}
                    >
                      {link}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Subject */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-cipher-muted font-medium flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-cipher-terracotta" />
                  <span>Subject Line:</span>
                </span>
                {parsedData.missing_fields.includes('subject') && (
                  <span className="text-[10px] text-cipher-amber font-mono">Not found in file</span>
                )}
              </label>
              <input
                type="text"
                value={request.subject || ''}
                onChange={(e) => onChange('subject', e.target.value)}
                placeholder="e.g. URGENT: Your account has been suspended"
                className="w-full px-3.5 py-2.5 rounded-xl bg-cipher-elevated border border-cipher-border focus:border-cipher-terracotta focus:outline-none focus:ring-1 focus:ring-cipher-terracotta text-xs font-mono text-cipher-text placeholder:text-cipher-muted/60 transition-colors"
              />
            </div>

            {/* Email Body */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono text-cipher-muted font-medium flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-cipher-sage" />
                  <span>Email Body Content:</span>
                </label>
                <span className="text-[10px] font-mono text-cipher-muted">
                  {request.body?.length || 0} chars
                </span>
              </div>
              <textarea
                rows={5}
                value={request.body || ''}
                onChange={(e) => onChange('body', e.target.value)}
                placeholder="Extracted message body content..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-cipher-elevated border border-cipher-border focus:border-cipher-sage focus:outline-none focus:ring-1 focus:ring-cipher-sage text-xs font-sans text-cipher-text placeholder:text-cipher-muted/60 leading-relaxed resize-y transition-colors"
              />
            </div>

            {/* Validation warning */}
            {formValidation && (
              <div className="p-3 rounded-xl bg-cipher-amber/10 border border-cipher-amber/30 text-cipher-amber text-xs font-mono">
                {formValidation}
              </div>
            )}

            {/* Analysis error */}
            {analysisError && (
              <div className="p-3 rounded-xl bg-cipher-danger/10 border border-cipher-danger/30 text-cipher-danger text-xs font-mono">
                {analysisError}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleRemoveFile}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-mono text-cipher-muted hover:text-cipher-text bg-cipher-elevated hover:bg-[#201F1C] border border-cipher-border transition-all disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Remove & Re-upload</span>
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cipher-terracotta hover:bg-[#C85331] text-cipher-text font-bold text-xs font-mono transition-all shadow-md shadow-cipher-terracotta/20 active:scale-95 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-cipher-text border-t-transparent animate-spin" />
                    <span>Evaluating Pipeline...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Analyze Email</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
