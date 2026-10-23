"""Unit tests for the PhishGuard secure email parser module."""

import pytest
from app.email_parser import (
    parse_email_file,
    parse_eml,
    parse_txt,
    extract_urls,
    HTMLTextExtractor,
)


def test_extract_urls():
    text = (
        "Visit our site at https://secure-login.paypal-update.net/auth and "
        "http://192.168.1.1/admin. Also see www.phishing-test.com/login! And ignore hello@domain.com."
    )
    urls = extract_urls(text)
    assert "https://secure-login.paypal-update.net/auth" in urls
    assert "http://192.168.1.1/admin" in urls
    assert "http://www.phishing-test.com/login" in urls


def test_html_extractor_strips_scripts_and_extracts_links():
    html_doc = """
    <html>
      <head>
        <script>alert('malicious')</script>
        <style>body { color: red; }</style>
      </head>
      <body>
        <h1>Urgent Notice</h1>
        <p>Dear customer, please click <a href="http://banking-portal.xyz/login">here</a> to verify.</p>
        <p>Alternatively browse to <a href="javascript:void(0)">invalid</a>.</p>
      </body>
    </html>
    """
    extractor = HTMLTextExtractor()
    extractor.feed(html_doc)
    text = extractor.get_text()

    assert "alert" not in text
    assert "Urgent Notice" in text
    assert "Dear customer, please click here to verify." in text
    assert "http://banking-portal.xyz/login" in extractor.extracted_urls
    assert "javascript:void(0)" not in extractor.extracted_urls


def test_eml_plain_text():
    eml_content = b"""From: billing@paypal.com
To: user@example.com
Subject: Invoice Notification
Date: Mon, 20 Oct 2026 12:00:00 +0000
Content-Type: text/plain; charset="utf-8"

Your invoice is ready at https://paypal.com/invoice/1234.
Please review promptly.
"""
    result = parse_eml(eml_content, "invoice.eml")
    assert result.file_type == "eml"
    assert result.sender == "billing@paypal.com"
    assert result.subject == "Invoice Notification"
    assert "https://paypal.com/invoice/1234" in result.extracted_urls
    assert result.primary_url == "https://paypal.com/invoice/1234"
    assert "invoice is ready" in result.body
    assert "sender" not in result.missing_fields
    assert "subject" not in result.missing_fields


def test_eml_multipart_with_html_and_attachment():
    from email.message import EmailMessage

    msg = EmailMessage()
    msg["From"] = "IT Support <support@corporate-portal.com>"
    msg["To"] = "employee@corporate-portal.com"
    msg["Subject"] = "System Maintenance Notice"
    msg.set_content("Please note system downtime this weekend. Details: https://portal.corp/notice")
    msg.add_alternative(
        "<html><body><p>System downtime notice. <a href=\"https://portal.corp/html-details\">Click for details</a></p></body></html>",
        subtype="html",
    )
    # Add attachment which must NOT be treated as body text
    msg.add_attachment(b"%PDF-1.4 binary content that should not be parsed", maintype="application", subtype="pdf", filename="schedule.pdf")

    result = parse_eml(msg.as_bytes(), "maintenance.eml")
    assert result.sender == "IT Support <support@corporate-portal.com>"
    assert result.subject == "System Maintenance Notice"
    # Plain text is preferred
    assert "Please note system downtime" in result.body
    assert "binary content" not in result.body
    # URLs from both plain text and HTML should be extracted
    assert "https://portal.corp/notice" in result.extracted_urls
    assert "https://portal.corp/html-details" in result.extracted_urls


def test_eml_encoded_headers():
    eml_content = b"""From: =?utf-8?B?U2VjdXJpdHkgVGVhbQ==?= <security@service.net>
Subject: =?utf-8?B?QWNjb3VudCBBbGVydDogU3VzcGljaW91cyBMb2dpbg==?=
Content-Type: text/plain; charset="utf-8"

Please verify at https://service.net/verify.
"""
    result = parse_eml(eml_content, "alert.eml")
    assert "Security Team <security@service.net>" in result.sender
    assert result.subject == "Account Alert: Suspicious Login"
    assert "https://service.net/verify" in result.extracted_urls


def test_txt_structured_headers():
    txt_content = b"""From: alerts@chase-bank-notice.com
Subject: Suspicious Transaction Detected
Date: 23 Oct 2026

We detected an unauthorized transaction on your card.
Log in immediately to confirm: http://192.168.1.100/chase/auth
"""
    result = parse_txt(txt_content, "chase_alert.txt")
    assert result.file_type == "txt"
    assert result.sender == "alerts@chase-bank-notice.com"
    assert result.subject == "Suspicious Transaction Detected"
    assert "http://192.168.1.100/chase/auth" in result.extracted_urls
    assert "unauthorized transaction" in result.body


def test_txt_unstructured_plain_text():
    raw_text = b"""Hello team,
Just wanted to share the link to our project documentation: https://docs.internal.net/wiki
Thanks!
"""
    result = parse_txt(raw_text, "raw_note.txt")
    assert result.sender == ""
    assert result.subject == ""
    assert "sender" in result.missing_fields
    assert "subject" in result.missing_fields
    assert "https://docs.internal.net/wiki" in result.extracted_urls
    assert "Hello team" in result.body


def test_parse_email_file_validation():
    # Empty file
    with pytest.raises(ValueError, match="empty"):
        parse_email_file(b"", "test.eml")

    # Unsupported format
    with pytest.raises(ValueError, match="Unsupported file format"):
        parse_email_file(b"some content", "test.exe")

    # Oversized file
    huge_content = b"x" * (3 * 1024 * 1024)
    with pytest.raises(ValueError, match="exceeds"):
        parse_email_file(huge_content, "large.eml")


def test_pdf_normal_text_extraction():
    import pymupdf
    doc = pymupdf.open()
    page = doc.new_page()
    page.insert_text(
        (50, 72),
        "From: billing@secure-cloud-portal.com\n"
        "Subject: Monthly Cloud Statement & Invoice\n"
        "Date: 23 Oct 2026\n\n"
        "Your monthly invoice is available. Review statement at http://192.168.1.55/billing/auth now."
    )
    pdf_bytes = doc.tobytes()
    doc.close()

    result = parse_email_file(pdf_bytes, "statement.pdf")
    assert result.file_type == "pdf"
    assert result.sender == "billing@secure-cloud-portal.com"
    assert result.subject == "Monthly Cloud Statement & Invoice"
    assert "http://192.168.1.55/billing/auth" in result.extracted_urls
    assert result.primary_url == "http://192.168.1.55/billing/auth"
    assert "monthly invoice is available" in result.body
    assert "sender" not in result.missing_fields
    assert "subject" not in result.missing_fields


def test_pdf_scanned_or_image_only_raises_ocr_message():
    import pymupdf
    doc = pymupdf.open()
    page = doc.new_page()
    # Draw shapes/graphics only; no text layer
    page.draw_rect(pymupdf.Rect(50, 50, 300, 300), color=(0.2, 0.2, 0.2), fill=(0.9, 0.9, 0.9))
    pdf_bytes = doc.tobytes()
    doc.close()

    with pytest.raises(ValueError) as exc_info:
        parse_email_file(pdf_bytes, "scanned_receipt.pdf")

    err_text = str(exc_info.value).lower()
    assert "ocr" in err_text
    assert "scanned" in err_text or "image-only" in err_text


def test_pdf_password_protected_encrypted():
    import pymupdf
    import os
    doc = pymupdf.open()
    page = doc.new_page()
    page.insert_text((50, 72), "Confidential email content")
    tmp_path = "tmp_protected_test.pdf"
    doc.save(tmp_path, encryption=pymupdf.PDF_ENCRYPT_AES_256, user_pw="secret123")
    doc.close()

    with open(tmp_path, "rb") as f:
        pdf_bytes = f.read()
    if os.path.exists(tmp_path):
        os.remove(tmp_path)

    with pytest.raises(ValueError) as exc_info:
        parse_email_file(pdf_bytes, "confidential.pdf")

    assert "password-protected" in str(exc_info.value).lower()


def test_pdf_malformed_file():
    corrupted_bytes = b"%PDF-1.4\ncorrupted bytes that do not form a valid pdf cross-reference table"
    with pytest.raises(ValueError) as exc_info:
        parse_email_file(corrupted_bytes, "broken.pdf")

    assert "malformed" in str(exc_info.value).lower()

