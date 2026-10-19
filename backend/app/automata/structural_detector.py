"""Structural Detection Layer for PhishGuard.

Evaluates uniform resource identifiers (URLs) and sender headers using formal automata
and structural heuristics:
1. Obfuscated / direct IP addresses in URL hosts
2. Suspicious / high-abuse top-level domains (gTLDs)
3. Targeted credential & banking keywords in path or subdomain positions
4. Subdomain stacking and brand squatting (e.g., brand-security.xyz)
5. Sender address vs destination URL host mismatch
6. Insecure HTTP transport for sensitive actions
"""

import re
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional
from urllib.parse import urlparse

from app.automata.service import convert_regex_pipeline
from app.automata.regex_parser import parse_regex
from app.automata.nfa import ThompsonBuilder
from app.automata.dfa import nfa_to_dfa
from app.automata.minimizer import minimize_dfa

# High-risk disposable / abused TLDs
SUSPICIOUS_TLDS = {
    "xyz", "top", "work", "click", "fit", "live", "ru", "buzz", "country",
    "tk", "ml", "ga", "cf", "gq", "rest", "cam", "loan", "surf"
}

# Credential & authentication keywords
SENSITIVE_KEYWORDS = [
    "login", "signin", "verify", "verification", "security", "update",
    "banking", "account", "auth", "credential", "password", "confirm"
]

# Brand names commonly targeted by phishing
TARGETED_BRANDS = [
    "paypal", "google", "apple", "microsoft", "amazon", "netflix",
    "chase", "bankofamerica", "wellsfargo", "citi", "yahoo", "facebook"
]

# Pre-compiled regex pattern for credential keywords suitable for MOC Automata Engine
CREDENTIAL_REGEX_PATTERN = "(login|verify|security|update|banking|auth)"
TLD_REGEX_PATTERN = "(xyz|top|work|click|fit|live|ru)"


@dataclass
class MatchedIndicator:
    """Represents a single structural heuristic match."""
    pattern_name: str
    field_examined: str
    matched_indicator: str
    explanation: str
    weight: float
    regex_pattern: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "pattern_name": self.pattern_name,
            "field_examined": self.field_examined,
            "matched_indicator": self.matched_indicator,
            "explanation": self.explanation,
            "weight": self.weight,
            "regex_pattern": self.regex_pattern,
        }


@dataclass
class StructuralAnalysisResult:
    """Complete result of structural URL and sender analysis."""
    score: float  # 0.0 to 100.0
    matched_indicators: List[MatchedIndicator] = field(default_factory=list)
    summary: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "score": round(self.score, 2),
            "matched_indicators": [ind.to_dict() for ind in self.matched_indicators],
            "summary": self.summary,
        }


class StructuralDetector:
    """Deterministic structural heuristic evaluator using automata and lexical rules."""

    def __init__(self):
        # Build minimal DFA for sensitive keyword detection via Automata Engine
        try:
            ast = parse_regex(CREDENTIAL_REGEX_PATTERN)
            nfa = ThompsonBuilder().build(ast)
            dfa = nfa_to_dfa(nfa)
            self._keyword_min_dfa = minimize_dfa(dfa)
        except Exception:
            self._keyword_min_dfa = None

    @staticmethod
    def _is_ip_address(host: str) -> bool:
        """Determines if the hostname is a direct IPv4 address."""
        if not host:
            return False
        # Remove port if present
        host_clean = host.split(":")[0].strip()
        parts = host_clean.split(".")
        if len(parts) == 4:
            try:
                return all(0 <= int(p) <= 255 for p in parts)
            except ValueError:
                return False
        return False

    @staticmethod
    def _extract_domain_and_tld(host: str) -> tuple[str, str]:
        """Extracts the registered domain and TLD from a hostname."""
        if not host:
            return "", ""
        host_clean = host.split(":")[0].lower().strip()
        parts = host_clean.split(".")
        if len(parts) >= 2:
            return parts[-2], parts[-1]
        return host_clean, ""

    @staticmethod
    def _extract_sender_domain(sender: str) -> str:
        """Extracts the domain portion of an email address."""
        if not sender or "@" not in sender:
            return ""
        # Handle formats like "PayPal Support <security@paypal.com>"
        match = re.search(r"@([A-Za-z0-9.\-_]+)", sender)
        if match:
            return match.group(1).lower().strip().rstrip(">")
        return ""

    def analyze(self, url: str = "", sender: str = "") -> StructuralAnalysisResult:
        """Executes structural evaluation on the supplied URL and sender string."""
        url_clean = (url or "").strip()
        sender_clean = (sender or "").strip()
        indicators: List[MatchedIndicator] = []

        if not url_clean:
            return StructuralAnalysisResult(
                score=0.0,
                matched_indicators=[],
                summary="No URL provided for structural evaluation."
            )

        # Parse URL
        parsed = urlparse(url_clean if "://" in url_clean else f"http://{url_clean}")
        host = (parsed.hostname or "").lower()
        path = parsed.path.lower()
        query = parsed.query.lower()
        scheme = parsed.scheme.lower()
        full_path = f"{path}?{query}" if query else path

        # 1. Obfuscated / Direct IP Address Host in URL
        if self._is_ip_address(host):
            indicators.append(MatchedIndicator(
                pattern_name="IP_HOST_ADDRESS",
                field_examined="url.hostname",
                matched_indicator=host,
                explanation=(
                    f"URL host '{host}' is a raw IP address rather than a verified domain name. "
                    "Phishing campaigns frequently use direct IP hosting to evade domain reputation filters."
                ),
                weight=35.0,
                regex_pattern="(0|1|2|3|4|5|6|7|8|9)+"
            ))

        # 2. Suspicious / Abused TLD
        _, tld = self._extract_domain_and_tld(host)
        if tld in SUSPICIOUS_TLDS:
            indicators.append(MatchedIndicator(
                pattern_name="SUSPICIOUS_TLD",
                field_examined="url.tld",
                matched_indicator=f".{tld}",
                explanation=(
                    f"Domain utilizes the '.{tld}' top-level domain. This TLD exhibits high statistical "
                    "abuse rates due to low-cost or disposable registration policies."
                ),
                weight=20.0,
                regex_pattern=TLD_REGEX_PATTERN
            ))

        # 3. Targeted Credential & Banking Keywords
        found_keywords = [kw for kw in SENSITIVE_KEYWORDS if kw in full_path or kw in host]
        if found_keywords:
            indicators.append(MatchedIndicator(
                pattern_name="TARGETED_CREDENTIAL_KEYWORD",
                field_examined="url.path_and_host",
                matched_indicator=", ".join(found_keywords[:3]),
                explanation=(
                    f"URL contains sensitive credential keywords ({', '.join(found_keywords[:3])}) "
                    "frequently associated with credential harvesting and fraudulent login pages."
                ),
                weight=25.0,
                regex_pattern=CREDENTIAL_REGEX_PATTERN
            ))

        # 4. Deceptive Subdomain Stacking & Brand Squatting
        # e.g., paypal-update, paypal.com.fraud-domain.xyz, apple-security
        subdomains = host.split(".")
        has_stacked_subdomains = len(subdomains) >= 4 and not self._is_ip_address(host)
        
        brand_squatted = []
        for brand in TARGETED_BRANDS:
            # Check if brand appears in hostname but is NOT the legitimate second-level domain
            if brand in host:
                reg_domain, _ = self._extract_domain_and_tld(host)
                if reg_domain != brand:
                    brand_squatted.append(brand)

        if brand_squatted or has_stacked_subdomains:
            matched_squats = brand_squatted if brand_squatted else ["excessive-subdomain-depth"]
            indicators.append(MatchedIndicator(
                pattern_name="SUBDOMAIN_STACKING_OR_BRAND_SQUAT",
                field_examined="url.hostname",
                matched_indicator=", ".join(matched_squats),
                explanation=(
                    f"Hostname exhibits brand squatting or excessive subdomain nesting ({', '.join(matched_squats)}). "
                    "Deceptive prefixes trick users into believing the host is owned by a recognized brand."
                ),
                weight=25.0,
                regex_pattern="(paypal|google|apple|microsoft|chase)-(login|security|verify)"
            ))

        # 5. Sender Address vs Destination URL Domain Mismatch
        if sender_clean:
            sender_domain = self._extract_sender_domain(sender_clean)
            if sender_domain and host:
                # Compare primary organization tokens
                sender_org, _ = self._extract_domain_and_tld(sender_domain)
                url_org, _ = self._extract_domain_and_tld(host)

                # Check if sender claims a known brand but URL points to a different host
                is_brand_sender = any(b in sender_domain for b in TARGETED_BRANDS)
                if is_brand_sender and sender_org != url_org and not self._is_ip_address(host):
                    indicators.append(MatchedIndicator(
                        pattern_name="SENDER_DOMAIN_MISMATCH",
                        field_examined="sender_vs_url",
                        matched_indicator=f"Sender: @{sender_domain} vs URL: {host}",
                        explanation=(
                            f"Sender claims organization domain '{sender_domain}', but destination URL "
                            f"points to an unrelated host '{host}'."
                        ),
                        weight=30.0,
                    ))

        # 6. Insecure HTTP Transport for Sensitive Actions
        if scheme == "http" and found_keywords and not self._is_ip_address(host):
            indicators.append(MatchedIndicator(
                pattern_name="INSECURE_HTTP_CREDENTIAL_ENDPOINT",
                field_examined="url.scheme",
                matched_indicator="http:// (cleartext)",
                explanation=(
                    "URL serves authentication or account workflows over unencrypted HTTP cleartext. "
                    "Legitimate institutions mandate TLS/HTTPS encryption."
                ),
                weight=15.0,
            ))

        # Aggregate Score (Bounded between 0.0 and 100.0)
        raw_score = sum(ind.weight for ind in indicators)
        final_score = min(100.0, max(0.0, raw_score))

        # Generate concise summary
        if not indicators:
            summary = "No anomalous structural patterns detected. URL structure conforms to standard web naming."
        else:
            summary = f"Detected {len(indicators)} structural indicator(s) contributing to a structural risk score of {round(final_score, 1)}/100."

        return StructuralAnalysisResult(
            score=final_score,
            matched_indicators=indicators,
            summary=summary,
        )
