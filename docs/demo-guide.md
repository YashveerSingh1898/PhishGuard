# PhishGuard — Academic Demonstration Guide

This guide is designed for the student presenter demonstrating PhishGuard during academic evaluations or capstone reviews for **Models of Computation (MOC)**.

---

## 1. Presentation Structure (10-Minute Talk Track)

| Time | Segment | Focus Area |
|---|---|---|
| **0:00 - 1:30** | Motivation & Problem | Why standard phishing filters fail; introduction of dual-layer defense. |
| **1:30 - 4:00** | Automata Theory (MOC) | Thompson's Construction, Subset Construction, and DFA Minimization. |
| **4:00 - 6:00** | NLP & Statistical Layer | Tokenization, TF-IDF weights, Naive Bayes threat probability. |
| **6:00 - 8:00** | Live Demonstration | URL test cases: Legitimate, Suspicious, and Phishing scenarios. |
| **8:00 - 10:00** | Codebase & Q&A | Answering questions on state transitions, algorithm complexity, and fusion weights. |

---

## 2. Key Theoretical Concepts to Highlight

### Q1: "Why use Automata Theory instead of just using Python's `re` module?"
> *"Python's built-in regular expression engine uses backtracking for complex patterns, which can experience catastrophic backtracking $\mathcal{O}(2^n)$ in pathological cases. In contrast, PhishGuard converts regex patterns to an NFA and then compiles them into an optimal Minimized DFA. A DFA evaluates strings in strict $\mathcal{O}(L)$ deterministic time where $L$ is URL length, without backtracking."*

### Q2: "What happens during the three automata transformation stages?"
> 1. **Thompson's Construction:** Turns regex sub-expressions into modular NFA blocks connected by $\epsilon$-transitions.
> 2. **Subset Construction:** Eliminates non-determinism by grouping reachable state sets under character transitions into single DFA states.
> 3. **DFA Minimization:** Merges non-distinguishable states using equivalence partitioning to guarantee the smallest possible state space.

### Q3: "Why is the Risk Fusion weighted 60% Structural and 40% NLP?"
> *"Structural URL anomalies (like IP addresses in URLs, excessive subdomains mimicking banks, or deceptive TLDs) are strong deterministic indicators of deception. However, legitimate emails might occasionally include shortened links, and phishing emails might include legitimate links with deceptive text. The 60/40 ratio prioritizes deterministic link structure while giving significant weight to semantic intent."*

---

## 3. Demonstration Test Scenarios

### Scenario A: Legitimate Portal
- **Input URL:** `https://portal.university.edu/student/grades`
- **Input Text:** *"Your semester grade report is now ready for viewing on the student self-service portal."*
- **Expected Result:**
  - Structural Score: $\approx 0.05$
  - NLP Score: $\approx 0.10$
  - Final Score: $< 0.35 \rightarrow$ **Legitimate (Green)**

### Scenario B: Suspicious Notification
- **Input URL:** `http://university-portal-verify.net/login`
- **Input Text:** *"Important notification regarding your course enrollment status."*
- **Expected Result:**
  - Structural Score: $\approx 0.55$ (new/anomalous domain, keyword in subdomain)
  - NLP Score: $\approx 0.25$ (mild urgency)
  - Final Score: $\approx 0.43 \rightarrow$ **Suspicious (Yellow/Amber)**

### Scenario C: High-Risk Phishing Lure
- **Input URL:** `http://192.168.1.55/update-banking-security-alert.xyz/auth`
- **Input Text:** *"URGENT: Your account has been suspended due to suspicious activity. Verify your identity within 24 hours to prevent immediate closure."*
- **Expected Result:**
  - Structural Score: $\approx 0.95$ (direct IP, stacked keywords, high-risk TLD)
  - NLP Score: $\approx 0.90$ (high urgency tokens, threat of closure)
  - Final Score: $\approx 0.93 \rightarrow$ **Phishing (Red)**

---

## 4. Pre-Demo Checklist

- [ ] Ensure backend is running on `http://127.0.0.1:8000` (`uvicorn app.main:app --reload`).
- [ ] Confirm frontend is accessible at `http://localhost:5173` (`npm run dev`).
- [ ] Check `http://127.0.0.1:8000/api/health` returns `{"status": "ok"}`.
- [ ] Have sample inputs copied to a notepad for rapid demonstration paste.
