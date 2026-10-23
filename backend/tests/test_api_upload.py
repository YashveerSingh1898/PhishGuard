"""Tests for Email Upload, Parsing, and Detection Integration."""

import io
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_api_upload_valid_eml():
    """POST /api/detection/parse-email extracts fields from an .eml file."""
    eml_data = (
        b"From: paypal-alert@paypal-update.net\r\n"
        b"Subject: Security Warning\r\n"
        b"Content-Type: text/plain; charset=utf-8\r\n\r\n"
        b"Your account is suspended. Verify at http://192.168.1.55/update-auth\r\n"
    )
    files = {"file": ("alert.eml", io.BytesIO(eml_data), "message/rfc822")}
    response = client.post("/api/detection/parse-email", files=files)
    assert response.status_code == 200
    data = response.json()

    assert data["success"] is True
    assert data["file_type"] == "eml"
    assert data["sender"] == "paypal-alert@paypal-update.net"
    assert data["subject"] == "Security Warning"
    assert "http://192.168.1.55/update-auth" in data["extracted_urls"]
    assert data["primary_url"] == "http://192.168.1.55/update-auth"
    assert "sender" not in data["missing_fields"]
    assert "subject" not in data["missing_fields"]


def test_api_upload_alias_endpoints():
    """Verify alias endpoints /api/detection/upload and /api/parse-email work identically."""
    txt_data = b"From: support@example.com\nSubject: Test\n\nBody with https://example.com"
    files = {"file": ("test.txt", io.BytesIO(txt_data), "text/plain")}
    res1 = client.post("/api/detection/upload", files=files)
    assert res1.status_code == 200

    files2 = {"file": ("test.txt", io.BytesIO(txt_data), "text/plain")}
    res2 = client.post("/api/parse-email", files=files2)
    assert res2.status_code == 200


def test_api_upload_structured_txt():
    """POST /api/detection/parse-email correctly parses structured headers in .txt."""
    txt_data = (
        b"From: registrar@university.edu\n"
        b"Subject: Grade Report Ready\n"
        b"Date: 23 Oct 2026\n\n"
        b"Grades are available at https://portal.university.edu/grades.\n"
    )
    files = {"file": ("grades.txt", io.BytesIO(txt_data), "text/plain")}
    response = client.post("/api/detection/parse-email", files=files)
    assert response.status_code == 200
    data = response.json()

    assert data["sender"] == "registrar@university.edu"
    assert data["subject"] == "Grade Report Ready"
    assert "https://portal.university.edu/grades" in data["extracted_urls"]
    assert len(data["missing_fields"]) == 0


def test_api_upload_unstructured_txt():
    """POST /api/detection/parse-email treats text without headers as email body without inventing sender/subject."""
    raw_text = b"This is a message from someone without headers. Link: http://phish-site.xyz/login"
    files = {"file": ("raw.txt", io.BytesIO(raw_text), "text/plain")}
    response = client.post("/api/detection/parse-email", files=files)
    assert response.status_code == 200
    data = response.json()

    assert data["sender"] == ""
    assert data["subject"] == ""
    assert "sender" in data["missing_fields"]
    assert "subject" in data["missing_fields"]
    assert "http://phish-site.xyz/login" in data["extracted_urls"]
    assert "This is a message" in data["body"]


def test_api_upload_empty_file_rejected():
    """POST /api/detection/parse-email rejects empty files with HTTP 400."""
    files = {"file": ("empty.eml", io.BytesIO(b""), "message/rfc822")}
    response = client.post("/api/detection/parse-email", files=files)
    assert response.status_code == 400
    detail = response.json().get("detail", {})
    assert "empty" in detail.get("message", "").lower()


def test_api_upload_unsupported_file_rejected():
    """POST /api/detection/parse-email rejects unsupported extensions with HTTP 415."""
    files = {"file": ("payload.exe", io.BytesIO(b"binary payload"), "application/octet-stream")}
    response = client.post("/api/detection/parse-email", files=files)
    assert response.status_code == 415
    detail = response.json().get("detail", {})
    assert "unsupported" in detail.get("message", "").lower()


def test_api_upload_oversized_file_rejected():
    """POST /api/detection/parse-email rejects files larger than 2 MB with HTTP 413."""
    oversized = b"A" * (2 * 1024 * 1024 + 1024)
    files = {"file": ("huge.eml", io.BytesIO(oversized), "message/rfc822")}
    response = client.post("/api/detection/parse-email", files=files)
    assert response.status_code == 413
    detail = response.json().get("detail", {})
    assert "exceeds" in detail.get("message", "").lower()


def test_e2e_upload_then_analyze_pipeline():
    """Integration test: Upload .eml -> parse -> analyze with /api/detection/analyze."""
    eml_data = (
        b"From: Security Team <security@paypal-update.net>\r\n"
        b"Subject: URGENT: Your account has been suspended\r\n"
        b"Content-Type: text/plain; charset=utf-8\r\n\r\n"
        b"Your account has been suspended due to suspicious activity. "
        b"Verify identity at http://192.168.1.55/update-banking-security-alert.xyz/auth\r\n"
    )
    files = {"file": ("threat.eml", io.BytesIO(eml_data), "message/rfc822")}
    upload_res = client.post("/api/detection/parse-email", files=files)
    assert upload_res.status_code == 200
    parsed = upload_res.json()

    # Submit reviewed/extracted fields to detection endpoint
    analysis_payload = {
        "sender": parsed["sender"],
        "url": parsed["primary_url"],
        "subject": parsed["subject"],
        "body": parsed["body"],
    }
    analyze_res = client.post("/api/detection/analyze", json=analysis_payload)
    assert analyze_res.status_code == 200
    analysis = analyze_res.json()

    assert analysis["success"] is True
    assert analysis["final_score"] > 60.0
    assert analysis["verdict"] in ["Suspicious", "Phishing"]
    assert len(analysis["evaluated_rules"]) > 0
    assert "192.168.1.55" in analysis["input_summary"]["extracted_url"]


def test_regression_manual_email_analysis_unaffected():
    """Regression test ensuring existing manual analysis still functions identically."""
    payload = {
        "sender": "registrar@university.edu",
        "url": "https://portal.university.edu/student/grades",
        "subject": "Semester Grade Report Available",
        "body": "Your semester grade report is now ready at https://portal.university.edu/student/grades.",
    }
    response = client.post("/api/detection/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["verdict"] == "Legitimate"
    assert data["final_score"] < 40.0


def test_api_upload_valid_pdf():
    """POST /api/detection/parse-email extracts fields from a text-based PDF."""
    import pymupdf
    doc = pymupdf.open()
    page = doc.new_page()
    page.insert_text(
        (50, 72),
        "From: admin@apple-support-verify.com\n"
        "Subject: Critical Security Advisory\n\n"
        "Your Apple ID was accessed from an unknown location. "
        "Review activity at http://apple-verify-login.xyz/portal immediately."
    )
    pdf_bytes = doc.tobytes()
    doc.close()

    files = {"file": ("apple_advisory.pdf", io.BytesIO(pdf_bytes), "application/pdf")}
    response = client.post("/api/detection/parse-email", files=files)
    assert response.status_code == 200
    data = response.json()

    assert data["success"] is True
    assert data["file_type"] == "pdf"
    assert data["sender"] == "admin@apple-support-verify.com"
    assert data["subject"] == "Critical Security Advisory"
    assert "http://apple-verify-login.xyz/portal" in data["extracted_urls"]
    assert data["primary_url"] == "http://apple-verify-login.xyz/portal"


def test_api_upload_scanned_pdf_returns_ocr_error():
    """POST /api/detection/parse-email returns clear OCR notice for image-only/scanned PDFs."""
    import pymupdf
    doc = pymupdf.open()
    page = doc.new_page()
    page.draw_rect(pymupdf.Rect(40, 40, 200, 200), color=(0.1, 0.1, 0.1), fill=(0.8, 0.8, 0.8))
    pdf_bytes = doc.tobytes()
    doc.close()

    files = {"file": ("scanned_invoice.pdf", io.BytesIO(pdf_bytes), "application/pdf")}
    response = client.post("/api/detection/parse-email", files=files)
    assert response.status_code == 400
    detail = response.json().get("detail", {})
    assert detail.get("error") == "OCRRequiredError"
    assert "ocr" in detail.get("message", "").lower()


def test_api_upload_encrypted_pdf_returns_error():
    """POST /api/detection/parse-email returns clear error for password-protected PDFs."""
    import pymupdf
    import os
    doc = pymupdf.open()
    page = doc.new_page()
    page.insert_text((50, 72), "Confidential message")
    tmp = "tmp_enc_test.pdf"
    doc.save(tmp, encryption=pymupdf.PDF_ENCRYPT_AES_256, user_pw="pass123")
    doc.close()

    with open(tmp, "rb") as f:
        pdf_bytes = f.read()
    if os.path.exists(tmp):
        os.remove(tmp)

    files = {"file": ("locked.pdf", io.BytesIO(pdf_bytes), "application/pdf")}
    response = client.post("/api/detection/parse-email", files=files)
    assert response.status_code == 400
    detail = response.json().get("detail", {})
    assert detail.get("error") == "PDFEncryptedError"
    assert "password-protected" in detail.get("message", "").lower()


def test_e2e_pdf_upload_then_analyze_pipeline():
    """Integration test: Upload .pdf -> parse -> analyze with /api/detection/analyze."""
    import pymupdf
    doc = pymupdf.open()
    page = doc.new_page()
    page.insert_text(
        (50, 72),
        "From: Security Team <security@paypal-update.net>\n"
        "Subject: URGENT: Your account has been suspended\n\n"
        "Your account has been suspended due to suspicious activity. "
        "Verify identity at http://192.168.1.55/update-banking-security-alert.xyz/auth\n"
    )
    pdf_bytes = doc.tobytes()
    doc.close()

    files = {"file": ("threat.pdf", io.BytesIO(pdf_bytes), "application/pdf")}
    upload_res = client.post("/api/detection/parse-email", files=files)
    assert upload_res.status_code == 200
    parsed = upload_res.json()

    analysis_payload = {
        "sender": parsed["sender"],
        "url": parsed["primary_url"],
        "subject": parsed["subject"],
        "body": parsed["body"],
    }
    analyze_res = client.post("/api/detection/analyze", json=analysis_payload)
    assert analyze_res.status_code == 200
    analysis = analyze_res.json()

    assert analysis["success"] is True
    assert analysis["final_score"] > 60.0
    assert analysis["verdict"] in ["Suspicious", "Phishing"]
    assert len(analysis["evaluated_rules"]) > 0
    assert "192.168.1.55" in analysis["input_summary"]["extracted_url"]

