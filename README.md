<div align="center">
  <img src="frontend/src/assets/smriti-logo.svg" alt="Smriti Logo" width="120" />
  <h1>Smriti</h1>
  <p><strong>Smriti remembers the context behind your secrets, not just the values.</strong></p>
  <p><em>by Tinexus</em></p>
  <p><a href="https://smriti.tinexus.in">https://smriti.tinexus.in</a></p>
</div>

---

## The Problem

Developers lose track of secrets. When you generate a new API key, database password, or webhook token, you usually dump it in a `.env` file, a password manager, or a private notes app. Months later, you find a cryptic key named `PROD_DB_PASS_V2` and have zero recollection of what it actually connects to, who generated it, when it expires, or why it was created. 

**Smriti** was built to solve this. Instead of treating secrets as just a key-value pair, Smriti attaches rich, searchable context to every secret. 

---

## What Makes Smriti Different

While enterprise secret managers (like HashiCorp Vault, Doppler, or Infisical) focus heavily on CI/CD pipelines, dynamic rotation, and infrastructure sync, Smriti focuses purely on the **developer experience of secret context and collaboration**. 

Key differentiators implemented and verified in this project:

- **AI-Powered Context Search:** Smriti uses semantic search over the natural-language origin story of a secret. You can search for *"that stripe key I made for the checkout bug"* and find it, even if the secret name is just `SK_TEST_XYZ`.
- **Ask Smriti (AI Chat):** A global `Ctrl+K` search interface where you can ask natural language questions (e.g. "what is my database password?"). Smriti uses secure metadata search combined with Google Gemini to give you conversational answers while keeping your decrypted secrets 100% private and out of the LLM's context window.
- **AI Auto-Parsing:** Write a messy free-text note like *"Here is the dev api key for aws us-east-1"* and Smriti's AI automatically extracts and categorizes the service name, environment, and tags.
- **Bulk AI Import:** Paste raw, unstructured text (like a chat log from a coworker or a raw JSON dump), and the AI will parse it into structured individual secrets ready to be saved.
- **Secure Magic Links (2FA):** Need to share a secret with a contractor or client who doesn't have a Smriti account? Generate a password-protected Magic Link. Smriti enforces an Email OTP challenge before the secret can be viewed, complete with brute-force lockouts.

*(Note: Smriti is an early-stage, single-team tool. It is not currently built for dynamic secret rotation, automated CI/CD integrations, or secret-scanning. It is a highly contextual, intelligent vault.)*

---

## Full Feature List

All features below have been manually verified end-to-end with real data.

### Core Secret Management
- **Full CRUD:** Create, read, update, and delete secrets grouped by Projects.
- **Rich Metadata:** Track origin notes, tags, environments, and expiry dates.
- **Version History:** Non-destructive historical timelines for every secret. Rollback to older versions with one click while archiving the current state.

### Knowledge Base (Global Notes)
- **Rich Text Editing:** Integrated TipTap editor for seamless documentation.
- **Debounced Auto-Save:** Write without interruption; changes save silently in the background.
- **Instant Search:** Real-time filtering to find knowledge and guides instantly.

### Authentication & Account Management
- **OAuth Integration:** Secure "Login with GitHub" flow allowing users to sign up and authenticate effortlessly.
- **Account Linking:** Existing users can link their GitHub accounts to their Tinexus profiles from the newly designed Settings page.
- **Session Management:** Robust JWT-based authentication with secure token handling and seamless redirect flows.

### Security
- **Encryption at Rest:** All secret values are encrypted in the database using AES-256-GCM.
- **Audit Logging:** Comprehensive tracking of all actions (Created, Viewed, Updated, Rolled Back). Owners see full project logs; users only see their own activity.

### Collaboration & Access Control
- **Role-Based Access (RBAC):** Granular project permissions (Owner, Editor, Viewer).
- **External Sharing:** Secure Magic Links protected by a password and a 6-digit Email OTP. Includes 15-minute brute-force lockouts and rate-limited resends.

### Terminal & Automation
- **CLI Tool:** A standalone Node.js CLI (`smriti`) to authenticate, list projects, and fetch secrets.
- **Env Injection:** Run commands with secrets dynamically injected into the environment (`smriti run my-project -- npm run dev`).
- **Export:** Easily pull secrets into standard `.env` formats (`smriti pull my-project > .env`).

### CI/CD & Secret Scanning
- **GitHub Actions Sync:** One-click integration to sync secrets directly to GitHub repository environments.
- **Render Sync:** Push your environment variables to Render services automatically.
- **Secret Scanning (Git-Leak Prevention):** Proactive pre-commit hook (CLI) and reactive scheduled scans (via GitHub API) to detect accidentally committed credentials in repositories.

### Theming
- **Dynamic UI:** Premium, glassmorphic UI with full Light/Dark/System theme support, persisted per-user.

---

## Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite, Tailwind CSS, TanStack Query, React Router |
| **Backend** | Java 21, Spring Boot 3.x, Spring Security, Hibernate |
| **Database** | PostgreSQL (Neon) |
| **AI / LLM** | Google Gemini (via LangChain4j) for parsing, embeddings, and semantic search |
| **CLI** | Node.js, Commander, Axios |
| **Auth** | JWT (JSON Web Tokens), Bcrypt (Password & OTP hashing) |

---

## Project Structure

```
smriti/
├── backend/       # Spring Boot API, Entities, Security, AI Integration
├── frontend/      # React SPA, Tailwind components, API Services
├── cli/           # Node.js command-line interface
├── LICENSE        # Proprietary license file
└── README.md      # You are here
```

---

## Quick Start

### 1. Web Application
Access the dashboard, manage projects, and generate access tokens:  
[https://smriti.tinexus.in](https://smriti.tinexus.in)

### 2. Smriti CLI
Install the official CLI globally via NPM:
```bash
npm install -g smriti-cli
```

Authenticate using a Personal Access Token (generate one from **Settings > Developer** on the web app):
```bash
smriti login
```

Pull secrets directly in `.env` format:
```bash
smriti pull <project-name>
```

Run your application with secrets injected directly into the environment:
```bash
smriti run <project-name> -- npm run dev
```

Install pre-commit secret leak prevention in your Git repository:
```bash
smriti install-hook <project-name>
```

---

## Security Note

This is an early-stage project. While industry-standard practices for encryption at rest (AES-256-GCM), hashing (Bcrypt), and access controls (RBAC, JWT) have been implemented and manually verified, the codebase has **not** undergone a professional, independent security audit. 

Please exercise appropriate caution before using Smriti to store mission-critical production secrets for large organizations.

---

## License

**Proprietary and Confidential.**  
Copyright (c) 2026 Tinexus. All Rights Reserved.

This software is NOT open-source. You may not copy, modify, distribute, or use this software without explicit prior written permission from the author. See the `LICENSE` file for full terms and conditions.

---

## Author

**Developed by Abhishek Gour**  
*Tinexus*
