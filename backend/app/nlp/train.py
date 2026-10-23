"""Reproducible NLP Training & Evaluation Pipeline for PhishGuard.

Trains a TF-IDF Vectorizer and Multinomial Naive Bayes Classifier on labeled email data,
evaluates on a held-out test split, and serializes the model artifacts for low-latency inference.
"""

import os
import sys
import csv
import argparse
import json
from datetime import datetime, timezone
from typing import Dict, Any, Tuple, List, Optional
import numpy as np
import joblib

from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.metrics import (
    accuracy_score,
    precision_recall_fscore_support,
    confusion_matrix,
    classification_report,
)

# Ensure backend directory is in sys.path when executed directly as a script
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.nlp.preprocessor import preprocess_text

DEFAULT_DATASET_PATH = os.path.join(
    os.path.dirname(__file__), "data", "seed_dataset.csv"
)
DEFAULT_OUTPUT_MODEL_PATH = os.path.join(
    os.path.dirname(__file__), "data", "phishguard_nlp.joblib"
)


def validate_dataset(filepath: str) -> Tuple[List[str], List[str]]:
    """Validates the CSV schema and class distribution of the training dataset.

    Args:
        filepath: Path to the CSV dataset file.

    Returns:
        Tuple of (raw_texts, labels).

    Raises:
        FileNotFoundError: If the dataset file does not exist.
        ValueError: If schema, column names, or label values are invalid.
    """
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"Dataset file not found at: {filepath}")

    raw_texts: List[str] = []
    labels: List[str] = []
    valid_classes = {"Legitimate", "Phishing"}

    with open(filepath, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        if not reader.fieldnames or "text" not in reader.fieldnames or "label" not in reader.fieldnames:
            raise ValueError(
                f"Invalid dataset schema. Expected headers 'text,label', got: {reader.fieldnames}"
            )

        for line_num, row in enumerate(reader, start=2):
            text = (row.get("text") or "").strip()
            label = (row.get("label") or "").strip()

            if not text:
                continue

            if label not in valid_classes:
                raise ValueError(
                    f"Invalid label '{label}' at line {line_num}. Allowed classes: {valid_classes}"
                )

            raw_texts.append(text)
            labels.append(label)

    if len(raw_texts) < 10:
        raise ValueError(
            f"Dataset contains only {len(raw_texts)} valid samples. Minimum required is 10."
        )

    class_counts = {cls: labels.count(cls) for cls in valid_classes}
    for cls, count in class_counts.items():
        if count < 2:
            raise ValueError(
                f"Class '{cls}' has only {count} sample(s). Need at least 2 for stratified train/test split."
            )

    return raw_texts, labels


def train_and_evaluate(
    dataset_path: str = DEFAULT_DATASET_PATH,
    output_path: str = DEFAULT_OUTPUT_MODEL_PATH,
    test_size: float = 0.25,
    random_state: int = 42,
    alpha: float = 1.0,
) -> Dict[str, Any]:
    """Runs train/test split, fits TF-IDF strictly on train split, trains Naive Bayes,
    evaluates on held-out test split, and serializes model bundle.

    Args:
        dataset_path: Path to the labeled CSV dataset.
        output_path: Destination path for serialized joblib bundle.
        test_size: Fraction of samples reserved for test evaluation.
        random_state: Seed for reproducibility.
        alpha: Laplace smoothing parameter for MultinomialNB.

    Returns:
        Dictionary containing trained artifacts, metrics, and metadata.
    """
    # 1. Load and validate dataset
    texts, labels = validate_dataset(dataset_path)
    total_samples = len(texts)

    # 2. Split into train and test splits BEFORE fitting vectorizer (prevents data leakage)
    X_train_raw, X_test_raw, y_train, y_test = train_test_split(
        texts,
        labels,
        test_size=test_size,
        stratify=labels,
        random_state=random_state,
    )

    # 3. Clean and normalize texts using PhishGuard preprocessor
    X_train_clean = [preprocess_text(doc) for doc in X_train_raw]
    X_test_clean = [preprocess_text(doc) for doc in X_test_raw]

    # 4. Fit TF-IDF vectorizer strictly on training data
    vectorizer = TfidfVectorizer(
        ngram_range=(1, 2),
        min_df=1,
        sublinear_tf=True,
        norm="l2",
    )
    X_train_vec = vectorizer.fit_transform(X_train_clean)
    X_test_vec = vectorizer.transform(X_test_clean)

    # 5. Train Multinomial Naive Bayes classifier
    model = MultinomialNB(alpha=alpha)
    model.fit(X_train_vec, y_train)

    classes = list(model.classes_)
    phishing_index = classes.index("Phishing") if "Phishing" in classes else 0

    # 6. Evaluate strictly on held-out test split
    y_pred = model.predict(X_test_vec)
    y_proba = model.predict_proba(X_test_vec)

    acc = float(accuracy_score(y_test, y_pred))
    p_micro, r_micro, f1_micro, _ = precision_recall_fscore_support(
        y_test, y_pred, average="weighted", zero_division=0
    )
    p_cls, r_cls, f1_cls, support_cls = precision_recall_fscore_support(
        y_test, y_pred, labels=classes, zero_division=0
    )

    cm = confusion_matrix(y_test, y_pred, labels=classes)
    report_dict = classification_report(
        y_test, y_pred, labels=classes, output_dict=True, zero_division=0
    )

    per_class_metrics = {}
    for i, cls in enumerate(classes):
        per_class_metrics[cls] = {
            "precision": round(float(p_cls[i]), 4),
            "recall": round(float(r_cls[i]), 4),
            "f1": round(float(f1_cls[i]), 4),
            "support": int(support_cls[i]),
        }

    metrics = {
        "total_dataset_samples": total_samples,
        "train_samples": len(X_train_raw),
        "test_samples": len(X_test_raw),
        "accuracy": round(acc, 4),
        "weighted_precision": round(float(p_micro), 4),
        "weighted_recall": round(float(r_micro), 4),
        "weighted_f1": round(float(f1_micro), 4),
        "classes": classes,
        "per_class": per_class_metrics,
        "confusion_matrix": cm.tolist(),
        "classification_report": report_dict,
    }

    metadata = {
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "dataset_path": os.path.abspath(dataset_path),
        "model_type": "MultinomialNB",
        "vectorizer_type": "TfidfVectorizer",
        "ngram_range": [1, 2],
        "vocabulary_size": len(vectorizer.vocabulary_),
        "alpha": alpha,
        "test_size": test_size,
        "random_state": random_state,
    }

    # 7. Serialize artifacts into a single bundle
    bundle = {
        "vectorizer": vectorizer,
        "model": model,
        "classes": classes,
        "phishing_index": phishing_index,
        "metrics": metrics,
        "metadata": metadata,
    }

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    joblib.dump(bundle, output_path, compress=3)

    return {
        "bundle": bundle,
        "metrics": metrics,
        "metadata": metadata,
        "output_path": os.path.abspath(output_path),
    }


def main():
    parser = argparse.ArgumentParser(
        description="Train and evaluate PhishGuard TF-IDF + Naive Bayes NLP model."
    )
    parser.add_argument(
        "--dataset",
        type=str,
        default=DEFAULT_DATASET_PATH,
        help="Path to training CSV (default: seed_dataset.csv)",
    )
    parser.add_argument(
        "--output",
        type=str,
        default=DEFAULT_OUTPUT_MODEL_PATH,
        help="Path to output serialized joblib file",
    )
    parser.add_argument(
        "--test-size",
        type=float,
        default=0.25,
        help="Held-out test fraction (default: 0.25)",
    )
    parser.add_argument(
        "--random-state",
        type=int,
        default=42,
        help="Random state seed (default: 42)",
    )
    args = parser.parse_args()

    print("=" * 60)
    print(" PhishGuard NLP Pipeline Training & Evaluation")
    print("=" * 60)
    print(f"Dataset path: {args.dataset}")
    print(f"Output model: {args.output}")

    result = train_and_evaluate(
        dataset_path=args.dataset,
        output_path=args.output,
        test_size=args.test_size,
        random_state=args.random_state,
    )

    metrics = result["metrics"]
    meta = result["metadata"]

    print("\n--- Training Summary ---")
    print(f"Total Samples:    {metrics['total_dataset_samples']}")
    print(f"Train Split:      {metrics['train_samples']}")
    print(f"Test Split:       {metrics['test_samples']}")
    print(f"Vocabulary Size:  {meta['vocabulary_size']} n-grams")

    print("\n--- Held-Out Test Evaluation ---")
    print(f"Accuracy:         {metrics['accuracy']:.2%}")
    print(f"Weighted F1:      {metrics['weighted_f1']:.4f}")
    print(f"Weighted Recall:  {metrics['weighted_recall']:.4f}")
    print(f"Weighted Prec.:   {metrics['weighted_precision']:.4f}")

    print("\nPer-Class Metrics:")
    for cls, cm_data in metrics["per_class"].items():
        print(
            f"  {cls:<12} -> Precision: {cm_data['precision']:.4f} | Recall: {cm_data['recall']:.4f} | F1: {cm_data['f1']:.4f} | Support: {cm_data['support']}"
        )

    print("\nConfusion Matrix (Classes: " + ", ".join(metrics["classes"]) + "):")
    cm = metrics["confusion_matrix"]
    for row in cm:
        print(f"  {row}")

    print(f"\nModel artifact successfully serialized to:\n  {result['output_path']}")
    print("=" * 60)


if __name__ == "__main__":
    main()
