# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- **Global Notes System**: A brand new top-level knowledge base for storing secure documentation, guides, and project meta-notes.
  - Rich-text editor powered by TipTap for seamless formatting.
  - Silent, debounced auto-save mechanism for a distraction-free writing experience.
  - Client-side instant search for titles and content filtering.
  - "New Document" modal with auto-focus for quick note creation.
- **Projects Grid View**: Introduced a dedicated `/projects` page for a better grid overview of all projects.
- **Dynamic Stats**: Dashboard now displays the real-time total count of Global Notes instead of "Added This Week".

### Changed
- **UI/UX Premium Overhaul**:
  - Global sidebar is now collapsible, entering an icon-only state to maximize screen real-estate (similar to Claude/Vercel).
  - Main container widths expanded to `max-w-6xl` for `ProjectDetailPage` and `SettingsPage` to better utilize wide desktop monitors.
  - Active and hover states in the collapsed sidebar refined to perfect squares for a polished look.
  - Mobile responsiveness significantly improved across list headers (`SecurityFindingsList`, `RenderIntegrationCard`, `AuditLogList`) using flex-col stacking to prevent UI squishing.
- **Navigation Flow**:
  - "Back to Project" buttons standardized and accurately routed across detail pages.
- **Secret Card Enhancements**: Improved spacing and layout within secret cards for better readability.

### Fixed
- Fixed an issue where sticky headers were failing due to `overflow-x-hidden` on parent layout containers.
- Fixed a split-second UI glitch on mobile devices when creating a new global note by utilizing direct query cache updates (`qc.setQueryData`) instead of full refetches.
- Disabled create buttons during pending mutations to prevent accidental double-creation of notes and secrets.
