"""Secure email file parsing module for PhishGuard.

Supports RFC 822 / MIME (.eml) files and structured or raw text (.txt) files.
Extracts sender, subject, body, and embedded URLs safely without executing
scripts, loading remote resources, or inspecting/executing binary attachments.
"""

import os
import re
import html
from html.parser import HTMLParser
from typing import List, Dict, Optional, Tuple, Any
from dataclasses import dataclass, field
import email
from email import policy
from email.parser import BytesParser
import pymupdf

# Configurable maximum file size (default: 2 MB)
DEFAULT_MAX_UPLOAD_SIZE = 2 * 1024 * 1024
MAX_UPLOAD_SIZE = int(os.getenv("PHISHGUARD_MAX_UPLOAD_SIZE", DEFAULT_MAX_UPLOAD_SIZE))

# Allowed file extensions
ALLOWED_EXTENSIONS = {".eml", ".txt", ".pdf"}

# Regex pattern for extracting URLs from plain-text or HTML content
URL_REGEX = re.compile(
    r"(?:https?://|www\.)[^\s<>\"\'\)\(\]\[]+",
    re.IGNORECASE,
)


class HTMLTextExtractor(HTMLParser):
    """Safe HTML-to-text converter that ignores executable elements (<script>, <style>)
    and extracts plain text and hyperlink destinations (<a href="...">) without
    executing JavaScript or initiating network requests.
    """

    IGNORABLE_TAGS = {"script", "style", "head", "meta", "link", "noscript", "svg", "iframe"}
    BLOCK_TAGS = {"p", "div", "tr", "li", "h1", "h2", "h3", "h4", "h5", "h6", "article", "section", "blockquote"}

    def __init__(self) -> None:
        super().__init__()
        self._text_chunks: List[str] = []
        self._ignore_depth: int = 0
        self.extracted_urls: List[str] = []

    def handle_starttag(self, tag: str, attrs: List[Tuple[str, Optional[str]]]) -> None:
        tag_lower = tag.lower()
        if tag_lower in self.IGNORABLE_TAGS:
            self._ignore_depth += 1
            return

        if self._ignore_depth > 0:
            return

        if tag_lower == "a":
            for name, val in attrs:
                if name.lower() == "href" and val:
                    cleaned_val = val.strip()
                    if cleaned_val and not cleaned_val.lower().startswith(("javascript:", "data:", "mailto:")):
                        self.extracted_urls.append(cleaned_val)
        elif tag_lower in self.BLOCK_TAGS or tag_lower == "br":
            self._text_chunks.append("\n")

    def handle_endtag(self, tag: str) -> None:
        tag_lower = tag.lower()
        if tag_lower in self.IGNORABLE_TAGS:
            if self._ignore_depth > 0:
                self._ignore_depth -= 1
            return

        if self._ignore_depth == 0 and tag_lower in self.BLOCK_TAGS:
            self._text_chunks.append("\n")

    def handle_data(self, data: str) -> None:
        if self._ignore_depth == 0:
            self._text_chunks.append(data)

    def get_text(self) -> str:
        """Returns normalized, entity-decoded plain text."""
        raw_text = "".join(self._text_chunks)
        decoded = html.unescape(raw_text)
        # Normalize whitespace while preserving line breaks
        lines = [line.strip() for line in decoded.splitlines()]
        # Remove consecutive blank lines
        cleaned_lines: List[str] = []
        for line in lines:
            if line:
                cleaned_lines.append(line)
            elif cleaned_lines and cleaned_lines[-1] != "":
                cleaned_lines.append("")
        return "\n".join(cleaned_lines).strip()


def safe_decode_bytes(content: bytes) -> str:
    """Decodes raw bytes safely into string, attempting UTF-8 first,
    then common fallbacks, and finally replacing invalid characters.
    """
    for encoding in ("utf-8", "utf-8-sig", "latin-1", "cp1252", "iso-8859-1"):
        try:
            return content.decode(encoding)
        except (UnicodeDecodeError, LookupError):
            continue
    return content.decode("utf-8", errors="replace")


def sanitize_filename(filename: str) -> str:
    """Sanitizes untrusted filename to prevent path traversal or injection."""
    if not filename:
        return "unnamed_email"
    base = os.path.basename(filename).strip()
    # Replace any potentially harmful characters
    safe = re.sub(r"[^\w\.\-\_]", "_", base)
    return safe[:120] if safe else "unnamed_email"


def extract_urls(text: str) -> List[str]:
    """Finds all HTTP/HTTPS and www URLs in text, strips trailing punctuation,
    and returns an ordered, deduplicated list.
    """
    if not text:
        return []

    found = URL_REGEX.findall(text)
    cleaned: List[str] = []
    seen = set()

    for item in found:
        # Strip trailing punctuation commonly appended in sentences
        url = item.strip().rstrip(".,;!?:>)\"'")
        if not url:
            continue
        # Normalize www. prefix to http://www. if missing scheme for evaluation consistency
        normalized = url
        if normalized.lower().startswith("www."):
            normalized = f"http://{normalized}"

        if normalized.lower() not in seen:
            seen.add(normalized.lower())
            cleaned.append(normalized)

    return cleaned


@dataclass
class ParsedEmailResult:
    """Normalized email object representation returned by email parsers."""
    filename: str
    file_size_bytes: int
    file_type: str
    sender: str = ""
    subject: str = ""
    body: str = ""
    extracted_urls: List[str] = field(default_factory=list)
    primary_url: str = ""
    missing_fields: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
    headers: Dict[str, str] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "success": True,
            "filename": self.filename,
            "file_size_bytes": self.file_size_bytes,
            "file_type": self.file_type,
            "sender": self.sender,
            "subject": self.subject,
            "body": self.body,
            "extracted_urls": self.extracted_urls,
            "primary_url": self.primary_url,
            "missing_fields": self.missing_fields,
            "warnings": self.warnings,
            "headers": self.headers,
        }


def _clean_header_value(val: Any) -> str:
    """Converts a header object or string into a single-line string."""
    if val is None:
        return ""
    text = str(val).strip()
    # Normalize internal newlines from folded headers
    return " ".join(text.split())


def parse_eml(content: bytes, filename: str) -> ParsedEmailResult:
    """Parses an RFC 822 / MIME (.eml) message safely using Python's standard email module."""
    file_size = len(content)
    clean_name = sanitize_filename(filename)

    try:
        msg = BytesParser(policy=policy.default).parsebytes(content)
    except Exception as exc:
        raise ValueError(f"Unable to parse .eml file structure: {str(exc)}") from exc

    # Extract headers
    sender = _clean_header_value(msg.get("from", ""))
    subject = _clean_header_value(msg.get("subject", ""))
    headers: Dict[str, str] = {}

    for header_name in ("from", "to", "subject", "date", "reply-to", "message-id"):
        val = msg.get(header_name)
        if val is not None:
            headers[header_name.title()] = _clean_header_value(val)

    plain_parts: List[str] = []
    html_parts: List[str] = []
    html_href_urls: List[str] = []
    warnings: List[str] = []

    if msg.is_multipart():
        for part in msg.walk():
            # Never treat attachments as email body or execute/open them
            content_disposition = str(part.get_content_disposition() or "").lower()
            if content_disposition == "attachment":
                continue
            if part.get_filename():
                continue

            content_type = part.get_content_type()
            if content_type == "text/plain":
                try:
                    payload = part.get_content()
                    if isinstance(payload, str):
                        plain_parts.append(payload)
                    elif isinstance(payload, bytes):
                        plain_parts.append(safe_decode_bytes(payload))
                except Exception:
                    raw = part.get_payload(decode=True)
                    if raw:
                        plain_parts.append(safe_decode_bytes(raw))
            elif content_type == "text/html":
                try:
                    payload = part.get_content()
                    if isinstance(payload, str):
                        html_parts.append(payload)
                    elif isinstance(payload, bytes):
                        html_parts.append(safe_decode_bytes(payload))
                except Exception:
                    raw = part.get_payload(decode=True)
                    if raw:
                        html_parts.append(safe_decode_bytes(raw))
    else:
        content_type = msg.get_content_type()
        if content_type == "text/html":
            try:
                payload = msg.get_content()
                html_parts.append(payload if isinstance(payload, str) else safe_decode_bytes(payload))
            except Exception:
                raw = msg.get_payload(decode=True)
                if raw:
                    html_parts.append(safe_decode_bytes(raw))
        else:
            try:
                payload = msg.get_content()
                plain_parts.append(payload if isinstance(payload, str) else safe_decode_bytes(payload))
            except Exception:
                raw = msg.get_payload(decode=True)
                if raw:
                    plain_parts.append(safe_decode_bytes(raw))

    # Extract HTML URLs from any HTML parts present (even if plain text is preferred for body)
    for html_chunk in html_parts:
        try:
            extractor = HTMLTextExtractor()
            extractor.feed(html_chunk)
            html_href_urls.extend(extractor.extracted_urls)
        except Exception:
            pass

    # Resolve body: prefer plain text, fallback to converted HTML
    body = ""
    if plain_parts:
        body = "\n\n".join(p.strip() for p in plain_parts if p.strip()).strip()
    elif html_parts:
        combined_html = "\n\n".join(html_parts)
        try:
            extractor = HTMLTextExtractor()
            extractor.feed(combined_html)
            body = extractor.get_text()
            warnings.append("Plain-text body was absent; rendered readable text from HTML body.")
        except Exception:
            # Fallback simple tag stripping
            body = re.sub(r"<[^>]+>", " ", combined_html).strip()
            warnings.append("HTML conversion encountered an issue; stripped tags.")

    # Collect and deduplicate URLs from body and HTML href attributes
    all_urls = extract_urls(body)
    for u in html_href_urls:
        norm = u.strip().rstrip(".,;!?:>)\"'")
        if norm.lower().startswith("www."):
            norm = f"http://{norm}"
        if norm and norm.lower().startswith(("http://", "https://")) and norm not in all_urls:
            all_urls.append(norm)

    # Missing fields assessment
    missing_fields: List[str] = []
    if not sender:
        missing_fields.append("sender")
        warnings.append("Sender header (From:) is missing from this email.")
    if not subject:
        missing_fields.append("subject")
        warnings.append("Subject line is missing from this email.")
    if not body:
        missing_fields.append("body")
        warnings.append("Email body content is empty.")
    if not all_urls:
        missing_fields.append("url")
        warnings.append("No destination URLs or links detected.")

    primary_url = all_urls[0] if all_urls else ""

    return ParsedEmailResult(
        filename=clean_name,
        file_size_bytes=file_size,
        file_type="eml",
        sender=sender,
        subject=subject,
        body=body,
        extracted_urls=all_urls,
        primary_url=primary_url,
        missing_fields=missing_fields,
        warnings=warnings,
        headers=headers,
    )


def parse_txt(content: bytes, filename: str) -> ParsedEmailResult:
    """Parses a plain-text (.txt) email file safely.
    
    Supports structured headers (From:, Subject:, Date:, To:, Sender:, Body:)
    and unstructured plain-text messages. Never invents missing fields.
    """
    file_size = len(content)
    clean_name = sanitize_filename(filename)
    text = safe_decode_bytes(content)

    if not text.strip():
        raise ValueError("Uploaded .txt file is empty or contains only whitespace.")

def _extract_email_fields_from_text(
    text: str,
    filename: str,
    file_size: int,
    file_type: str,
    additional_urls: Optional[List[str]] = None,
) -> ParsedEmailResult:
    """Extracts email headers, sender, subject, body, and URLs from plain text."""
    clean_name = sanitize_filename(filename)
    if not text.strip():
        raise ValueError(f"Uploaded .{file_type} file contains no extractable text.")

    sender = ""
    subject = ""
    body = ""
    headers: Dict[str, str] = {}
    warnings: List[str] = []

    # Check for structured headers at the top (lines like "Key: Value" until blank line or end)
    lines = text.splitlines()
    header_lines: List[str] = []
    body_lines: List[str] = []
    in_headers = True

    header_name_pattern = re.compile(r"^(from|sender|subject|date|to|reply-to):\s*(.*)$", re.IGNORECASE)

    has_structured_header = False
    for i, line in enumerate(lines):
        if in_headers:
            if not line.strip():
                # Blank line marks end of header block
                if header_lines:
                    in_headers = False
                    body_lines = lines[i + 1:]
                    break
                else:
                    continue

            match = header_name_pattern.match(line)
            if match:
                has_structured_header = True
                header_lines.append(line)
            elif header_lines and (line.startswith(" ") or line.startswith("\t")):
                # Folded header line
                header_lines.append(line)
            else:
                if has_structured_header:
                    in_headers = False
                    body_lines = lines[i:]
                    break
                else:
                    in_headers = False
                    body_lines = lines
                    break
        else:
            body_lines = lines[i:]
            break

    if has_structured_header and header_lines:
        current_key = ""
        current_val = ""
        for hline in header_lines:
            match = header_name_pattern.match(hline)
            if match:
                if current_key:
                    headers[current_key] = current_val.strip()
                current_key = match.group(1).lower()
                current_val = match.group(2)
            elif current_key and (hline.startswith(" ") or hline.startswith("\t")):
                current_val += " " + hline.strip()

        if current_key:
            headers[current_key] = current_val.strip()

        sender = headers.get("from") or headers.get("sender") or ""
        subject = headers.get("subject") or ""

        body = "\n".join(body_lines).strip()
        if not body and "body" in headers:
            body = headers["body"]
    else:
        body = text.strip()

    # Extract and merge URLs
    all_urls = extract_urls(body)
    if additional_urls:
        for u in additional_urls:
            norm = u.strip().rstrip(".,;!?:>)\"'")
            if norm.lower().startswith("www."):
                norm = f"http://{norm}"
            if norm and norm.lower().startswith(("http://", "https://")) and norm not in all_urls:
                all_urls.append(norm)

    primary_url = all_urls[0] if all_urls else ""

    missing_fields: List[str] = []
    if not sender:
        missing_fields.append("sender")
        warnings.append(f"No sender header detected in .{file_type} file.")
    if not subject:
        missing_fields.append("subject")
        warnings.append(f"No subject header detected in .{file_type} file.")
    if not body:
        missing_fields.append("body")
        warnings.append("No message body detected.")
    if not all_urls:
        missing_fields.append("url")
        warnings.append("No destination URLs or links detected.")

    return ParsedEmailResult(
        filename=clean_name,
        file_size_bytes=file_size,
        file_type=file_type,
        sender=sender,
        subject=subject,
        body=body,
        extracted_urls=all_urls,
        primary_url=primary_url,
        missing_fields=missing_fields,
        warnings=warnings,
        headers={k.title(): v for k, v in headers.items()},
    )


def parse_txt(content: bytes, filename: str) -> ParsedEmailResult:
    """Parses a plain-text (.txt) email file safely.
    
    Supports structured headers (From:, Subject:, Date:, To:, Sender:, Body:)
    and unstructured plain-text messages. Never invents missing fields.
    """
    file_size = len(content)
    clean_name = sanitize_filename(filename)
    text = safe_decode_bytes(content)

    if not text.strip():
        raise ValueError("Uploaded .txt file is empty or contains only whitespace.")

    return _extract_email_fields_from_text(
        text=text,
        filename=clean_name,
        file_size=file_size,
        file_type="txt",
    )


def parse_pdf(content: bytes, filename: str) -> ParsedEmailResult:
    """Parses a PDF (.pdf) email or document safely using PyMuPDF.
    
    Extracts selectable text and link annotations without executing scripts,
    actions, or macros. Safely checks for encryption/passwords, and detects
    scanned or image-only documents where OCR would be required.
    """
    file_size = len(content)
    clean_name = sanitize_filename(filename)

    try:
        doc = pymupdf.open(stream=content, filetype="pdf")
    except Exception as exc:
        raise ValueError(f"Malformed or corrupted PDF file: {str(exc)}") from exc

    try:
        # Check password protection / encryption
        if doc.is_encrypted:
            # Check if openable with empty password
            if not doc.authenticate(""):
                raise ValueError(
                    "The uploaded PDF is password-protected or encrypted. "
                    "Please remove password protection before uploading."
                )

        if doc.page_count == 0:
            raise ValueError("Uploaded PDF has no pages.")

        page_texts: List[str] = []
        pdf_links: List[str] = []

        for page in doc:
            t = page.get_text()
            if t and t.strip():
                page_texts.append(t.strip())

            # Extract hyperlink annotations safely (without navigating/resolving remote content)
            try:
                links = page.get_links()
                for link in links:
                    uri = link.get("uri")
                    if uri and isinstance(uri, str):
                        clean_uri = uri.strip()
                        if clean_uri.lower().startswith(("http://", "https://", "www.")):
                            pdf_links.append(clean_uri)
            except Exception:
                pass

        full_text = "\n\n".join(page_texts).strip()

        # Check for scanned or image-only PDF
        if not full_text:
            raise ValueError(
                "Scanned or image-only PDF detected. No extractable text was found; "
                "Optical Character Recognition (OCR) is required to process this document."
            )

    finally:
        doc.close()

    return _extract_email_fields_from_text(
        text=full_text,
        filename=clean_name,
        file_size=file_size,
        file_type="pdf",
        additional_urls=pdf_links,
    )


def parse_email_file(content: bytes, filename: str) -> ParsedEmailResult:
    """Entry point for parsing an email file by validating size, extension,
    and routing to .eml, .pdf, or .txt parser.
    """
    if not content or len(content) == 0:
        raise ValueError("Uploaded email file is empty (0 bytes).")

    if len(content) > MAX_UPLOAD_SIZE:
        mb_size = round(len(content) / (1024 * 1024), 2)
        mb_limit = round(MAX_UPLOAD_SIZE / (1024 * 1024), 2)
        raise ValueError(
            f"File size exceeds the {mb_limit} MB limit (uploaded size: {mb_size} MB)."
        )

    clean_name = sanitize_filename(filename)
    _, ext = os.path.splitext(clean_name.lower())

    if ext not in ALLOWED_EXTENSIONS:
        raise ValueError(
            f"Unsupported file format '{ext or 'unknown'}'. Only .eml, .txt, and .pdf files are supported."
        )

    if ext == ".eml":
        result = parse_eml(content, clean_name)
    elif ext == ".pdf":
        result = parse_pdf(content, clean_name)
    else:
        result = parse_txt(content, clean_name)

    # Ensure that at least something was extracted
    if not result.sender and not result.subject and not result.body:
        raise ValueError(
            "Could not extract any email content or headers from the provided file."
        )

    return result

