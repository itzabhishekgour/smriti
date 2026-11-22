# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- **CLI Personal Access Tokens (PAT)**:
  - Secure token authentication (`smriti_pat_` prefix with SHA-256 database hashing) replacing username and password in the CLI.
  - Dedicated **Developer** settings tab to generate, manage, and revoke tokens with customizable expiry periods (30 days, 90 days, or never).
  - One-time token reveal dialog with copy functionality.
- **NPM Package Release**:
  - Published the official CLI package `smriti-cli` to the NPM registry for global installation (`npm install -g smriti-cli`).
- **SEO and Discovery**:
  - Complete SEO overhaul across title, meta descriptions, canonical URLs, OpenGraph, and Twitter Cards.
  - Google Search Console verification via meta tags and verification file.
  - Schema.org structured data including `WebSite` for Google Site Names and `SoftwareApplication`.
  - Added `sitemap.xml`, `robots.txt`, and multi-resolution favicons (SVG, 48px, 96px, 192px).
- **Global Notes System**: A brand new top-level knowledge base for storing secure documentation, guides, and project meta-notes.
  - Rich-text editor powered by TipTap for seamless formatting.
  - Silent, debounced auto-save mechanism for a distraction-free writing experience.
  - Client-side instant search for titles and content filtering.
  - "New Document" modal with auto-focus for quick note creation.
- **Projects Grid View**: Introduced a dedicated `/projects` page for a better grid overview of all projects.
- **Dynamic Stats**: Dashboard now displays the real-time total count of Global Notes instead of "Added This Week".

### Changed
- **Proxy and Tunnel Compatibility**:
  - Configured `forward-headers-strategy: framework` in Spring Boot to ensure OAuth redirect URLs preserve `https://` behind Cloudflare Tunnel and reverse proxies.
- **Docker Optimization**:
  - Streamlined `Dockerfile` to copy pre-compiled JARs, reducing container build times to seconds and preventing memory exhaustion during image creation.
- **Documentation**:
  - Refactored `README.md` to prioritize production Quick Start via Web App and global CLI usage.
- **UI/UX Premium Overhaul**:
  - Global sidebar is now collapsible, entering an icon-only state to maximize screen real-estate.
  - Main container widths expanded to `max-w-6xl` for `ProjectDetailPage` and `SettingsPage` to better utilize wide desktop monitors.
  - Active and hover states in the collapsed sidebar refined to perfect squares for a polished look.
  - Mobile responsiveness significantly improved across list headers (`SecurityFindingsList`, `RenderIntegrationCard`, `AuditLogList`) using flex-col stacking to prevent UI squishing.
- **Navigation Flow**:
  - "Back to Project" buttons standardized and accurately routed across detail pages.
- **Secret Card Enhancements**: Improved spacing and layout within secret cards for better readability.

### Fixed
- Fixed a scope issue in `SettingsPage` where the token reveal modal was inadvertently placed inside helper components.
- Fixed an issue where sticky headers were failing due to `overflow-x-hidden` on parent layout containers.
- Fixed a split-second UI glitch on mobile devices when creating a new global note by utilizing direct query cache updates (`qc.setQueryData`) instead of full refetches.
- Disabled create buttons during pending mutations to prevent accidental double-creation of notes and secrets.
