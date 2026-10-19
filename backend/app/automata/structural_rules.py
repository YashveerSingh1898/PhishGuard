"""Structural Regex Rules and Automata Execution for PhishGuard.

Defines the formal structural regex rules for phishing detection, compiles each
rule using the MOC automata pipeline (Regex -> NFA -> DFA -> Minimized DFA),
and simulates string consumption to generate deterministic execution traces.
"""

import re
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any, Tuple
from urllib.parse import urlparse

from app.automata.service import convert_regex_pipeline
from app.automata.regex_parser import parse_regex
from app.automata.nfa import ThompsonBuilder
from app.automata.dfa import nfa_to_dfa
from app.automata.minimizer import minimize_dfa, MinimizedDFA


# List of high-abuse top-level domains
SUSPICIOUS_TLDS = {
    "xyz", "top", "work", "click", "fit", "live", "ru", "buzz", "country",
    "tk", "ml", "ga", "cf", "gq", "rest", "cam", "loan", "surf"
}

# Credential & authentication keywords
SENSITIVE_KEYWORDS = [
    "login", "verify", "security", "update", "banking", "auth",
    "signin", "verification", "account", "credential", "password", "confirm"
]

# Brand names commonly targeted by phishing
TARGETED_BRANDS = [
    "paypal", "google", "apple", "microsoft", "chase",
    "amazon", "netflix", "bankofamerica", "wellsfargo", "citi", "yahoo", "facebook"
]


@dataclass
class StructuralRule:
    """Definition of a formal structural phishing indicator rule."""
    id: str
    name: str
    regex_pattern: str
    description: str
    target_field: str
    weight: float


# Registry of the 6 core structural detection rules
STRUCTURAL_RULES: List[StructuralRule] = [
    StructuralRule(
        id="RULE_IP_HOST",
        name="Direct IPv4 Host Octets",
        regex_pattern="(0|1|2|3|4|5|6|7|8|9)+",
        description=(
            "Identifies numeric IP address octets used directly in URL hosts to bypass "
            "domain registration history and TLS certificate reputation controls."
        ),
        target_field="url.hostname",
        weight=35.0,
    ),
    StructuralRule(
        id="RULE_SUSPICIOUS_TLD",
        name="High-Abuse Top-Level Domain (TLD)",
        regex_pattern="(xyz|top|work|click|fit|live|ru)",
        description=(
            "Matches high-abuse disposable top-level domains commonly registered for "
            "short-lived phishing campaigns due to low acquisition costs."
        ),
        target_field="url.tld",
        weight=20.0,
    ),
    StructuralRule(
        id="RULE_CREDENTIAL_KEYWORD",
        name="Credential Harvesting Path Keyword",
        regex_pattern="(login|verify|security|update|banking|auth)",
        description=(
            "Detects sensitive credential or authentication target keywords located "
            "in URL paths or query strings, typical of credential-harvesting landing pages."
        ),
        target_field="url.path",
        weight=25.0,
    ),
    StructuralRule(
        id="RULE_BRAND_SQUATTING",
        name="Deceptive Brand Squatting Prefix",
        regex_pattern="(paypal|google|apple|microsoft|chase)-(login|verify|security|update)",
        description=(
            "Detects hyphenated brand-squatted host prefixes combining enterprise brands "
            "with urgency tokens to mislead recipients."
        ),
        target_field="url.hostname",
        weight=25.0,
    ),
    StructuralRule(
        id="RULE_INSECURE_HTTP",
        name="Insecure HTTP Transport Protocol",
        regex_pattern="http",
        description=(
            "Detects unencrypted HTTP cleartext transport on URLs that solicit authentication "
            "or security verification, where HTTPS is strictly required."
        ),
        target_field="url.scheme",
        weight=15.0,
    ),
    StructuralRule(
        id="RULE_SENDER_MISMATCH",
        name="Sender Brand Spoofing Mismatch",
        regex_pattern="(paypal|google|apple|microsoft|chase)",
        description=(
            "Detects recognized brand identities in the sender address when the email links "
            "to external, non-affiliated domain infrastructure."
        ),
        target_field="sender_vs_url",
        weight=30.0,
    ),
]


@dataclass
class RuleEvaluationResult:
    """Detailed evaluation result for a single structural rule, including automata trace."""
    rule_id: str
    rule_name: str
    regex_pattern: str
    description: str
    target_field: str
    weight: float
    candidate_input: str
    matched: bool
    score_contribution: float
    automata: Dict[str, Any]
    candidate_trace: Dict[str, Any]
    url_trace: Dict[str, Any]
    explanation: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "rule_id": self.rule_id,
            "rule_name": self.rule_name,
            "regex_pattern": self.regex_pattern,
            "description": self.description,
            "target_field": self.target_field,
            "weight": self.weight,
            "candidate_input": self.candidate_input,
            "matched": self.matched,
            "score_contribution": round(self.score_contribution, 2),
            "automata": self.automata,
            "candidate_trace": self.candidate_trace,
            "url_trace": self.url_trace,
            "explanation": self.explanation,
        }


class StructuralRuleEvaluator:
    """Compiles structural regexes into automata and evaluates URLs with execution traces."""

    def __init__(self):
        # Cache for compiled automata to avoid redundant parsing across requests
        self._automata_cache: Dict[str, Dict[str, Any]] = {}
        self._min_dfa_cache: Dict[str, MinimizedDFA] = {}
        self._precompile_rules()

    def _precompile_rules(self) -> None:
        """Pre-compiles all registered structural rules through the MOC pipeline."""
        for rule in STRUCTURAL_RULES:
            if rule.regex_pattern not in self._automata_cache:
                # Compile through existing MOC pipeline
                ast = parse_regex(rule.regex_pattern)
                nfa = ThompsonBuilder().build(ast)
                dfa = nfa_to_dfa(nfa)
                min_dfa = minimize_dfa(dfa)

                self._min_dfa_cache[rule.id] = min_dfa
                self._automata_cache[rule.id] = {
                    "success": True,
                    "regex": rule.regex_pattern,
                    "alphabet": sorted(list(nfa.alphabet)),
                    "nfa": nfa.to_dict(),
                    "dfa": dfa.to_dict(),
                    "minimized_dfa": min_dfa.to_dict(),
                }

    @staticmethod
    def extract_url_from_email(url: str, body: str) -> Tuple[str, str]:
        """Extracts the evaluated URL from the submitted email and cleans whitespace.
        
        Returns (original_url, extracted_url).
        """
        orig_url = (url or "").strip()
        if orig_url:
            return orig_url, orig_url

        # Search for link in email body if URL field was empty
        if body:
            match = re.search(r"https?://[^\s<>\"']+", body)
            if match:
                extracted = match.group(0).strip().rstrip(".,;!?:")
                return orig_url, extracted

        return "", ""

    @staticmethod
    def _is_ip_address(host: str) -> bool:
        """Checks if host is an IPv4 string."""
        if not host:
            return False
        clean = host.split(":")[0].strip()
        parts = clean.split(".")
        if len(parts) == 4:
            try:
                return all(0 <= int(p) <= 255 for p in parts)
            except ValueError:
                return False
        return False

    @staticmethod
    def _extract_domain_and_tld(host: str) -> Tuple[str, str]:
        """Extracts (registered_domain, tld) from hostname."""
        if not host:
            return "", ""
        clean = host.split(":")[0].lower().strip()
        parts = clean.split(".")
        if len(parts) >= 2:
            return parts[-2], parts[-1]
        return clean, ""

    @staticmethod
    def _extract_sender_domain(sender: str) -> str:
        """Extracts sender domain from email header."""
        if not sender or "@" not in sender:
            return ""
        match = re.search(r"@([A-Za-z0-9.\-_]+)", sender)
        if match:
            return match.group(1).lower().strip().rstrip(">")
        return ""

    def evaluate(self, url: str = "", sender: str = "", body: str = "") -> Tuple[float, List[RuleEvaluationResult], str]:
        """Evaluates all structural rules against the submitted URL and sender.
        
        Returns:
            total_structural_score (0.0 to 100.0)
            evaluations (list of RuleEvaluationResult for each rule)
            summary (text summary)
        """
        orig_url, extracted_url = self.extract_url_from_email(url, body)
        sender_clean = (sender or "").strip()

        evaluations: List[RuleEvaluationResult] = []

        if not extracted_url:
            # No URL available to evaluate
            for rule in STRUCTURAL_RULES:
                min_dfa = self._min_dfa_cache[rule.id]
                automata_data = self._automata_cache[rule.id]
                trace = min_dfa.simulate("")
                evaluations.append(RuleEvaluationResult(
                    rule_id=rule.id,
                    rule_name=rule.name,
                    regex_pattern=rule.regex_pattern,
                    description=rule.description,
                    target_field=rule.target_field,
                    weight=rule.weight,
                    candidate_input="",
                    matched=False,
                    score_contribution=0.0,
                    automata=automata_data,
                    candidate_trace=trace,
                    url_trace=trace,
                    explanation="No URL provided for evaluation.",
                ))
            return 0.0, evaluations, "No URL provided for structural evaluation."

        # Parse the extracted URL
        parsed = urlparse(extracted_url if "://" in extracted_url else f"http://{extracted_url}")
        host = (parsed.hostname or "").lower()
        path = parsed.path.lower()
        query = parsed.query.lower()
        scheme = parsed.scheme.lower()
        full_path = f"{path}?{query}" if query else path

        # Evaluate each rule in order
        for rule in STRUCTURAL_RULES:
            min_dfa = self._min_dfa_cache[rule.id]
            automata_data = self._automata_cache[rule.id]

            candidate_input = ""
            matched = False
            explanation = ""

            # 1. Direct IPv4 Host
            if rule.id == "RULE_IP_HOST":
                if self._is_ip_address(host):
                    # Candidate is the first octet of the IP host to demonstrate digit recognition
                    first_octet = host.split(".")[0]
                    candidate_input = first_octet
                    sim = min_dfa.simulate(first_octet)
                    if sim["is_accepted"]:
                        matched = True
                        explanation = f"URL host '{host}' is a raw IP address (octet '{first_octet}' recognized by DFA)."
                else:
                    candidate_input = host.split(".")[0] if "." in host else host
                    explanation = f"Host '{host}' is a domain name, not a raw IP address."

            # 2. Suspicious TLD
            elif rule.id == "RULE_SUSPICIOUS_TLD":
                _, tld = self._extract_domain_and_tld(host)
                candidate_input = tld
                sim = min_dfa.simulate(tld)
                if sim["is_accepted"]:
                    matched = True
                    explanation = f"Domain uses high-abuse top-level domain '.{tld}', recognized by DFA."
                else:
                    explanation = f"Domain TLD '.{tld or 'none'}' is not in the high-abuse TLD set."

            # 3. Credential Harvesting Keyword
            elif rule.id == "RULE_CREDENTIAL_KEYWORD":
                # Find matching keyword in path or full URL
                found_kw = next((kw for kw in SENSITIVE_KEYWORDS if kw in full_path or kw in host), "")
                candidate_input = found_kw
                if found_kw:
                    sim = min_dfa.simulate(found_kw)
                    if sim["is_accepted"]:
                        matched = True
                        explanation = f"Sensitive credential keyword '{found_kw}' found in URL path/host and recognized by DFA."
                    else:
                        explanation = f"Keyword candidate '{found_kw}' not accepted by DFA."
                else:
                    candidate_input = ""
                    explanation = "No sensitive credential harvesting keywords detected in URL path or host."

            # 4. Brand Squatting
            elif rule.id == "RULE_BRAND_SQUATTING":
                # Look for brand-keyword combination in hostname, e.g. paypal-login, google-security
                matched_prefix = ""
                for brand in TARGETED_BRANDS:
                    for action in ["login", "verify", "security", "update"]:
                        token = f"{brand}-{action}"
                        if token in host:
                            matched_prefix = token
                            break
                    if matched_prefix:
                        break

                candidate_input = matched_prefix
                if matched_prefix:
                    sim = min_dfa.simulate(matched_prefix)
                    if sim["is_accepted"]:
                        matched = True
                        explanation = f"Host exhibits deceptive brand squatting '{matched_prefix}' recognized by DFA."
                    else:
                        explanation = f"Token '{matched_prefix}' not accepted by DFA."
                else:
                    explanation = "No brand-squatting prefixes detected in hostname."

            # 5. Insecure HTTP
            elif rule.id == "RULE_INSECURE_HTTP":
                candidate_input = scheme
                sim = min_dfa.simulate(scheme)
                # Only flag as risk if it's HTTP and there are sensitive keywords or IP host
                has_sensitive_context = any(kw in full_path or kw in host for kw in SENSITIVE_KEYWORDS) or self._is_ip_address(host)
                if sim["is_accepted"] and has_sensitive_context:
                    matched = True
                    explanation = "URL serves authentication or sensitive workflows over unencrypted HTTP cleartext."
                elif sim["is_accepted"]:
                    explanation = "URL uses HTTP, but no sensitive credential keywords are present."
                else:
                    explanation = f"URL protocol '{scheme}' is secure HTTPS or non-HTTP."

            # 6. Sender Brand Mismatch
            elif rule.id == "RULE_SENDER_MISMATCH":
                sender_domain = self._extract_sender_domain(sender_clean)
                sender_brand = next((b for b in TARGETED_BRANDS if b in sender_domain), "")
                candidate_input = sender_brand
                if sender_brand:
                    sim = min_dfa.simulate(sender_brand)
                    url_org, _ = self._extract_domain_and_tld(host)
                    is_mismatch = (sender_brand != url_org) or self._is_ip_address(host)
                    if sim["is_accepted"] and is_mismatch:
                        matched = True
                        explanation = (
                            f"Sender claims brand '{sender_brand}' (@{sender_domain}), but link targets "
                            f"unrelated host '{host}'."
                        )
                    else:
                        explanation = f"Sender brand '{sender_brand}' matches URL domain or no mismatch."
                else:
                    explanation = "Sender domain does not invoke a targeted enterprise brand."

            # Run execution traces on Minimized DFA:
            # 1. Candidate token simulation trace
            candidate_trace = min_dfa.simulate(candidate_input)
            # 2. Extracted URL simulation trace (shows step-by-step DFA behavior on the submitted URL)
            url_trace = min_dfa.simulate(extracted_url)

            score_contrib = rule.weight if matched else 0.0

            evaluations.append(RuleEvaluationResult(
                rule_id=rule.id,
                rule_name=rule.name,
                regex_pattern=rule.regex_pattern,
                description=rule.description,
                target_field=rule.target_field,
                weight=rule.weight,
                candidate_input=candidate_input,
                matched=matched,
                score_contribution=score_contrib,
                automata=automata_data,
                candidate_trace=candidate_trace,
                url_trace=url_trace,
                explanation=explanation,
            ))

        # Compute total structural score bounded between 0.0 and 100.0
        total_raw = sum(e.score_contribution for e in evaluations)
        total_score = min(100.0, max(0.0, total_raw))

        matched_count = sum(1 for e in evaluations if e.matched)
        if matched_count == 0:
            summary = "No anomalous structural patterns detected. URL structure conforms to standard web naming."
        else:
            summary = f"Detected {matched_count} matching structural indicator(s) contributing to a score of {round(total_score, 1)}/100."

        return total_score, evaluations, summary
