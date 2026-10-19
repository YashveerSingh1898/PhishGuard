"""Text Preprocessing and Normalization Module for PhishGuard NLP Layer."""

import re
from typing import List

# Standard English stopwords to filter non-discriminative terms
# Note: Urgency tokens ('urgent', 'immediately', 'now', 'action', 'alert', 'warning', 'critical')
# are deliberately excluded from stopwords because they convey strong phishing intent.
STOPWORDS = {
    "a", "about", "above", "after", "again", "against", "all", "am", "an", "and",
    "any", "are", "aren't", "as", "at", "be", "because", "been", "before", "being",
    "below", "between", "both", "but", "by", "can't", "cannot", "could", "couldn't",
    "did", "didn't", "do", "does", "doesn't", "doing", "don't", "down", "during",
    "each", "few", "for", "from", "further", "had", "hadn't", "has", "hasn't", "have",
    "haven't", "having", "he", "he'd", "he'll", "he's", "her", "here", "here's", "hers",
    "herself", "him", "himself", "his", "how", "how's", "i", "i'd", "i'll", "i'm", "i've",
    "if", "in", "into", "is", "isn't", "it", "it's", "its", "itself", "let's", "me", "more",
    "most", "mustn't", "my", "myself", "no", "nor", "not", "of", "off", "on", "once",
    "only", "or", "other", "ought", "our", "ours", "ourselves", "out", "over", "own",
    "same", "shan't", "she", "she'd", "she'll", "she's", "should", "shouldn't", "so",
    "some", "such", "than", "that", "that's", "the", "their", "theirs", "them", "themselves",
    "then", "there", "there's", "these", "they", "they'd", "they'll", "they're", "they've",
    "this", "those", "through", "to", "too", "under", "until", "up", "very", "was",
    "wasn't", "we", "we'd", "we'll", "we're", "we've", "were", "weren't", "what", "what's",
    "when", "when's", "where", "where's", "which", "while", "who", "who's", "whom", "why",
    "why's", "with", "won't", "would", "wouldn't", "you", "you'd", "you'll", "you're", "you've",
    "your", "yours", "yourself", "yourselves"
}

# Regex for replacing URLs and email addresses with generic tokens
URL_REGEX = re.compile(r"https?://\S+|www\.\S+", re.IGNORECASE)
EMAIL_REGEX = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b")
WORD_REGEX = re.compile(r"\b[a-zA-Z]{2,}\b")


def normalize_text(text: str) -> str:
    """Normalizes input text by lowercasing, masking URLs/emails, and removing non-word characters."""
    if not text:
        return ""
    # 1. Lowercase
    cleaned = text.lower()
    # 2. Mask URLs and emails
    cleaned = URL_REGEX.sub(" httpurl ", cleaned)
    cleaned = EMAIL_REGEX.sub(" emailaddr ", cleaned)
    # 3. Strip special punctuation and zero-width spaces
    cleaned = re.sub(r"[\u200b\u200c\u200d\ufeff]", "", cleaned)
    cleaned = re.sub(r"[^\w\s]", " ", cleaned)
    # 4. Collapse whitespace
    return " ".join(cleaned.split())


def tokenize(text: str) -> List[str]:
    """Extracts alphabetic word tokens of length >= 2."""
    if not text:
        return []
    return WORD_REGEX.findall(text)


def remove_stopwords(tokens: List[str]) -> List[str]:
    """Filters common stopwords while preserving urgent/psychological indicators."""
    return [t for t in tokens if t not in STOPWORDS]


def preprocess_text(text: str) -> str:
    """Full preprocessing pipeline: normalize -> tokenize -> stopword pruning -> joined string."""
    if not text or not text.strip():
        return ""
    normalized = normalize_text(text)
    tokens = tokenize(normalized)
    filtered = remove_stopwords(tokens)
    return " ".join(filtered)
