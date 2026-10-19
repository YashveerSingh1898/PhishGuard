# PhishGuard 🛡️

> **Dual-Layer Phishing Detection via Automata Theory & Natural Language Processing**  
> *Academic Model of Computation (MOC) Capstone Project*

---

> ⚠️ **Status: UNDER ACTIVE DEVELOPMENT (Phase 1: Project Scaffolding)**  
> Detection algorithms, automata transformation engines, and trained NLP models are currently scheduled for subsequent phases. The current repository contains the architectural blueprint, module interfaces, and foundational workspace configurations.

---

## 1. Project Overview & Motivation

Phishing attacks remain one of the most prolific threat vectors in cybersecurity, targeting both structural vulnerabilities in uniform resource identifiers (URIs) and psychological triggers in textual communication. Traditional defense systems often treat link analysis and content analysis as disconnected silos, relying either on static blocklists or heavy black-box machine learning models that lack interpretability.

**PhishGuard** bridges the gap between formal computer science theory and modern cybersecurity engineering. Built as an academic demonstration for **Models of Computation (MOC)**, PhishGuard applies **Automata Theory** (Thompson's Construction, Subset Construction, and DFA Minimization) to rigorously analyze URI structures and pattern syntax, while pairing it with **Natural Language Processing (NLP)** and statistical classification to inspect textual context.

By visualizing the transition from non-deterministic finite automata (NFA) to minimized deterministic finite automata (DFA), PhishGuard not only classifies threats but also serves as an educational tool showcasing how core theoretical computer science operates under real-world security constraints.

---

## 2. Problem Statement

Existing phishing detectors face key trade-offs:
1. **Heuristic & Blocklist brittleness:** Static domain blocklists fail against zero-day phishing links, brand spoofing permutations, homoglyphs, and dynamic URL path variations.
2. **Lack of formal interpretability:** Complex deep learning models frequently yield opaque confidence scores without explaining what structural pattern or linguistic cue triggered the alert.
3. **High computational overhead:** Large-scale scanning mechanisms struggle to deliver sub-millisecond evaluation at edge proxies or browser endpoints.

**PhishGuard's Solution:** Leverage formal language theory—specifically deterministic finite automata (DFA)—to parse and score structural URL risks with deterministic runtime guarantees ($O(n)$ where $n$ is string length), complemented by a targeted Naive Bayes NLP pipeline for semantic text evaluation.

---

## 3. Project Objectives

- **Formal Automata Pipeline:** Convert regex-defined phishing signatures into an NFA via Thompson's Construction, transform the NFA to a DFA using Subset Construction, and produce an optimal State-Minimal DFA.
- **Structural Scoring:** Calculate a quantified structural anomaly score based on automata state transitions and lexical link properties.
- **Linguistic Threat Detection:** Preprocess and vectorize suspicious message bodies or email content using standard tokenization, stopword filtering, TF-IDF feature weighting, and Multinomial Naive Bayes.
- **Dual-Layer Risk Fusion:** Synthesize structural and content scores through a weighted mathematical decision model to assign an explainable risk verdict.
- **Interactive Visualization:** Provide a clean, dark-mode academic interface for students and evaluators to trace state machines and inspect detection decisions step-by-step.

---

## 4. Proposed System Architecture

PhishGuard employs a client-server architecture separating high-performance formal language processing from reactive visualization.

```
                           +--------------------------+
                           |   Target URL & Message   |
                           +------------+-------------+
                                        |
                 +----------------------+----------------------+
                 |                                             |
                 v                                             v
     [ Structural Layer (MOC) ]                     [ NLP Content Layer ]
   - Regular Expressions                        - Text Preprocessing & Cleaning
   - Thompson's Construction (NFA)              - Tokenization & Stopword Removal
   - Subset Construction (DFA)                  - TF-IDF Feature Extraction
   - DFA Minimization                           - Naive Bayes Classifier
   - State Transition Traversal                                |
                 |                                             |
                 v                                             v
         Structural Score                              NLP Content Score
           (0.0 to 1.0)                                  (0.0 to 1.0)
                 |                                             |
                 +----------------------+----------------------+
                                        |
                                        v
                          [ Risk Fusion Engine ]
              Final Score = 0.6 * Structural + 0.4 * NLP
                                        |
                                        v
                            [ Final Threat Verdict ]
                     Legitimate | Suspicious | Phishing
```

---

## 5. Methodological Breakdown

### A. Structural Automata Layer (3 Conversion Stages)

1. **Stage 1: RegEx to NFA (Thompson's Construction)**
   - Phishing URI patterns (e.g., suspicious TLD sequences, obfuscated IP addresses, multi-subdomain brand mimicry, credential tokens) are codified as formal Regular Expressions.
   - Thompson's Algorithm inductively builds a Non-deterministic Finite Automaton with $\epsilon$-transitions, guaranteeing linear construction size proportional to the regular expression.

2. **Stage 2: NFA to DFA (Subset Construction / Powerset Algorithm)**
   - The $\epsilon$-NFA is converted into an equivalent Deterministic Finite Automaton (DFA) where each DFA state corresponds to a subset of NFA states reachable via character transitions and $\epsilon$-closures.
   - Eliminates ambiguity and back-tracking, ensuring predictable linear-time string acceptance testing.

3. **Stage 3: DFA Minimization (Equivalence Partitioning)**
   - Using state-partitioning (Myhill-Nerode / Hopcroft's equivalence classes), unreachable and equivalent states are merged to produce the unique minimal DFA.
   - Yields the fastest transition table footprint and minimal memory profile for real-time URL scanning.

### B. NLP Content Layer

The content layer inspects text payloads accompanying suspicious links (e.g., email snippets, SMS alerts, fake urgency prompts):
1. **Text Preprocessing:** Case normalization, HTML entity decoding, punctuation stripping, and URL masking.
2. **Tokenization & Stopword Removal:** Extracting lexical tokens and filtering non-informative structural words.
3. **TF-IDF Vectorization:** Computing Term Frequency-Inverse Document Frequency matrices to highlight high-value threat indicators (e.g., "account suspended", "verify password", "immediate action required").
4. **Multinomial Naive Bayes:** Statistical classification estimating the posterior probability that a message belongs to a phishing corpus versus legitimate communication.

### C. Risk Fusion Model & Verdict Thresholds

The structural score $S_{\text{struct}} \in [0.0, 1.0]$ and the NLP score $S_{\text{nlp}} \in [0.0, 1.0]$ are aggregated using the defined linear decision function:

$$\text{Final Risk Score} = 0.6 \times S_{\text{struct}} + 0.4 \times S_{\text{nlp}}$$

**Decision Boundaries:**
- **`Legitimate`** ($0.00 \le \text{Score} < 0.35$): Normal structural attributes and benign linguistic indicators.
- **`Suspicious`** ($0.35 \le \text{Score} < 0.70$): Presence of anomalous lexical attributes or mild urgency signals; manual review advised.
- **`Phishing`** ($0.70 \le \text{Score} \le 1.00$): Severe automata match triggers and high-confidence deception intent.

---

## 6. Planned Features

- [ ] **Interactive Automata Visualizer:** Render generated NFA, intermediate DFA, and Minimized DFA state diagrams directly in the browser using SVG / React Flow.
- [ ] **Step-by-Step String Simulator:** Watch an input URL trigger transitions across states with visual highlight pulses on matched tokens.
- [ ] **Feature Weight Inspector:** Breakdown of exact regular expression flags matched and top TF-IDF words influencing the prediction.
- [ ] **Configurable Fusion Sliders:** Allow instructors and students to adjust weights ($w_1, w_2$) dynamically to test edge-case behavior.
- [ ] **REST API with OpenAPI Specs:** Clean endpoints for programmatic submission and state transition export.

---

## 7. Development Setup (macOS)

### Prerequisites

Ensure the following tools are installed on your macOS system:
- **Python:** 3.10 or higher (`python3 --version`)
- **Node.js:** v18.0 or higher (`node --version`)
- **Package Manager:** `npm` (`npm --version`)

---

### Step 1: Clone & Navigate

```bash
cd /Users/yash/Desktop/Phishguard
```

### Step 2: Backend Setup

1. Create and activate a Python virtual environment:
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate
   ```
2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Copy environment configuration:
   ```bash
   cp ../.env.example .env
   ```

### Step 3: Frontend Setup

1. In a separate terminal tab, navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install Node dependencies:
   ```bash
   npm install
   ```

---

## 8. Running the Application

### Running Backend (FastAPI + Uvicorn)

From the `backend/` directory with the virtual environment active:

```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
- API Base: `http://127.0.0.1:8000`
- Interactive API Docs (Swagger): `http://127.0.0.1:8000/docs`
- Health check: `http://127.0.0.1:8000/api/health`

### Running Frontend (Vite + React)

From the `frontend/` directory:

```bash
npm run dev
```
- Local UI: `http://localhost:5173`

---

## 9. Running Tests

To verify backend integrity and run test suites:

```bash
cd backend
source venv/bin/activate
pytest
```

---

## 10. Repository Directory Structure

```text
Phishguard/
├── README.md                   # Comprehensive academic & engineering guide
├── .gitignore                  # Git ignore rules (secrets, venv, caches, node_modules)
├── .env.example                # Template configuration values
├── docs/
│   ├── architecture.md         # Deep-dive system architecture specification
│   └── demo-guide.md           # Step-by-step academic presentation guide
├── backend/
│   ├── requirements.txt        # Python backend dependencies
│   ├── app/
│   │   ├── __init__.py         # App package identifier
│   │   ├── main.py             # FastAPI entry point & route registration
│   │   ├── api/
│   │   │   └── __init__.py     # API routing modules
│   │   ├── automata/
│   │   │   └── __init__.py     # MOC: Thompson, Subset & Minimization logic
│   │   ├── nlp/
│   │   │   └── __init__.py     # NLP: Tokenizer, TF-IDF, Naive Bayes
│   │   └── fusion/
│   │       └── __init__.py     # 0.6/0.4 Risk aggregation model
│   └── tests/
│       └── __init__.py         # Pytest verification suites
└── frontend/
    ├── package.json            # React, Vite & Tailwind configuration
    ├── index.html              # HTML5 application shell
    ├── tsconfig.json           # TypeScript configuration
    ├── vite.config.ts          # Vite build pipeline setup
    └── src/
        ├── main.tsx            # React application root DOM mount
        ├── App.tsx             # Main dashboard scaffold
        ├── index.css           # Styling system & dark cybersecurity theme
        ├── components/         # Reusable UI elements (cards, badges, nav)
        ├── pages/              # Primary route views (Scanner, Automata Trace)
        ├── automata/           # Graph rendering utilities & helpers
        ├── services/           # Backend API communication clients
        └── types/              # TypeScript interface & enum definitions
```

---

*PhishGuard — Bridging Theoretical Computer Science and Cyber Defense.*
