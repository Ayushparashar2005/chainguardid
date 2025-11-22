# ChainGuard ID: Educational Documentation

## 1. Project Overview
**ChainGuard ID** is a simulation of a "Zero Trust" network security system. It combines two powerful technologies: **Blockchain** (for data integrity) and **Heuristic Machine Learning** (for threat detection).

The goal of this application is to solve the "Mutable Log Problem." In traditional systems, hackers often delete or alter server access logs (`/var/log/auth.log`) to cover their tracks. By writing logs to a blockchain, we create an append-only, tamper-evident history that cannot be rewritten without breaking the cryptographic chain.

---

## 2. Core Concept: The Blockchain Ledger
Most people associate Blockchain with cryptocurrency (Bitcoin/Ethereum), but its core value is **Immutability**.

### How it works in this App:
1.  **The Block**: A container for data (Access Logs).
2.  **The Hash (SHA-256)**: A digital fingerprint. If you change a single letter in a log, the hash changes completely.
3.  **The Link (Previous Hash)**: Each block contains the hash of the *previous* block.
    *   Block 2 contains Block 1's hash.
    *   Block 3 contains Block 2's hash.
4.  **The Result**: If a hacker tries to delete a log in Block 1, the hash of Block 1 changes. Consequently, the "Previous Hash" stored in Block 2 no longer matches. The chain is broken, and the system detects the tampering immediately.

### Code Reference (`App.tsx`):
We use the `crypto.subtle.digest('SHA-256', ...)` API to generate these hashes natively in the browser.

---

## 3. Core Concept: Heuristic ML Sentinel
We replaced the generic "AI" with a **Heuristic Detection Engine**. This is a form of deterministic Machine Learning that relies on statistical rules rather than a "black box" neural network.

### The Logic (`services/mlService.ts`):
The system scans the blockchain history and looks for specific mathematical patterns:

1.  **Velocity Attacks (DoS/Flooding)**
    *   *Concept:* A human cannot log in 50 times in 1 minute. A bot can.
    *   *The Logic:* If `requests_per_minute > THRESHOLD`, flag as HIGH_VELOCITY.

2.  **Brute Force Detection**
    *   *Concept:* An attacker guessing passwords will generate many "Access Denied" events.
    *   *The Logic:* If `consecutive_failures > 3` within `time_window`, flag as BRUTE_FORCE.

3.  **Impossible Travel / Suspicious User**
    *   *Concept:* A user ID cannot validly access the system from IP A (New York) and IP B (London) simultaneously.
    *   *The Logic:* If `unique_ips_for_user > 2` within `time_window`, flag as SUSPICIOUS_USER.

---

## 4. Prerequisites & Knowledge Required

To build or deeply understand a system like ChainGuard ID, you need knowledge in the following areas:

### A. Computer Science Fundamentals
*   **Hashing Algorithms:** Understanding what SHA-256 is and why it is irreversible.
*   **Linked Lists:** A blockchain is essentially a singly linked list where the pointers are hashes.
*   **Big O Notation:** Understanding why analyzing the entire chain becomes slower as the chain grows (Linear Time O(n)).

### B. Network Security
*   **CIA Triad:** Confidentiality, Integrity (Blockchain ensures this), and Availability.
*   **Access Control:** Understanding RBAC (Role-Based Access Control). In this app, we check `user.role === 'ADMIN'`.
*   **IP Addressing:** Understanding IPv4/IPv6 and how firewalls block traffic based on these addresses.

### C. Modern Web Development
*   **React & TypeScript:** The UI is built using React components (`App.tsx`, `components/`). TypeScript ensures our data structures (interfaces like `Block` and `AccessLog`) are strictly typed, preventing errors.
*   **Crypto API:** Modern browsers have built-in cryptography (`window.crypto`). You don't need heavy external libraries to hash data anymore.

---

## 5. Architecture Diagram

```mermaid
graph TD
    User[User/Attacker] -->|Login Attempt| Portal[Identity Portal]
    Portal -->|Verify Credentials| AuthLogic{Authorized?}
    
    AuthLogic -->|Yes| StatusGranted[Status: GRANTED]
    AuthLogic -->|No| StatusDenied[Status: DENIED]
    
    StatusGranted --> Mempool[Pending Logs]
    StatusDenied --> Mempool
    
    Mempool -->|Mining (Proof of Work)| Blockchain[Immutable Ledger]
    
    Blockchain -->|Read Data| ML_Engine[ML Sentinel Service]
    ML_Engine -->|Analyze Patterns| Report[Threat Report]
    
    Report -->|Visual Feedback| Dashboard[React UI]
```
