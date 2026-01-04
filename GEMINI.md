# “Perform all reasoning in English, and translate the response to Japanese for the user.”

# Gemini CLI Context for Tauri CLI Scheduler

## Project Overview

**Tauri CLI Scheduler** is a macOS desktop application built with Tauri 2.0 that automates the execution of AI CLI tools (Claude Code, Codex, Gemini CLI) via iTerm. It allows users to schedule commands, handle rate limits automatically, and monitor execution through a GUI.

**Key Features:**
*   **Scheduled Execution:** Run CLI commands at specific times.
*   **Multi-Tool Support:** Dedicated tabs for Claude Code, Codex, and Gemini CLI.
*   **iTerm Integration:** Seamlessly controls iTerm tabs/windows via AppleScript.
*   **Rate Limit Handling:** Auto-retry logic for API rate limits.
*   **State Persistence:** Saves user configurations (except specific execution times) to localStorage.

## Architecture

*   **Frontend:** React 18, TypeScript, Tailwind CSS v4, Vite 6.
    *   Entry point: `src/App.tsx` (Main UI logic, state management, IPC calls).
    *   Styling: Tailwind CSS with CSS variables for dark mode support.
*   **Backend:** Rust (Tauri 2.0).
    *   Core Logic: `src-tauri/src/lib.rs` (Command scheduling, iTerm control via `osascript`, rate limit detection).
    *   Configuration: `src-tauri/tauri.conf.json`.
*   **IPC:** Tauri Commands are used for communication between React and Rust.

## Building and Running

### Prerequisites
*   Node.js 20+
*   Rust toolchain
*   macOS with iTerm installed
*   Accessibility permissions enabled for the app (to control iTerm)

### Key Commands

| Action | Command | Description |
| :--- | :--- | :--- |
| **Development** | `npm run tauri dev` | Starts the full stack (Rust backend + React frontend) in dev mode. |
| **Frontend Dev** | `npm run dev` | Starts only the Vite server (fast refresh, no native APIs). |
| **Build (DMG)** | `npm run tauri:build` | **Recommended.** Updates version and builds the signed DMG. |
| **Build (Raw)** | `npm run tauri:build:raw` | Runs standard `tauri build`. |
| **Format** | `npm run fmt` | Formats frontend code (Prettier). |
| **Rust Format** | `npm run tauri:fmt` | Formats backend code (`cargo fmt`). |

**Build Artifacts:**
*   DMG: `src-tauri/target/release/bundle/dmg/Tauri CLI Scheduler_<version>_aarch64.dmg`
*   App: `src-tauri/target/release/bundle/macos/Tauri CLI Scheduler.app`

## Development Conventions

*   **Style:**
    *   **Frontend:** React Functional Components with Hooks. Strict TypeScript. Atomic UI components in `src/components/ui/`.
    *   **Backend:** Idiomatic Rust.
    *   **Styling:** Utility-first CSS with Tailwind. Semantic color tokens (e.g., `primary`, `surface`, `text`) defined in CSS variables.
*   **Version Control:**
    *   Version format: `YY.M.D` (e.g., `26.1.4`).
    *   Automatically updated via `update-version.js` during build.
*   **Testing:**
    *   Currently relies on manual testing (scheduling, iTerm interaction, rate limits).
    *   No automated test suite configured yet.

## Key Files

*   `src/App.tsx`: Main application controller.
*   `src/components/SettingsPanel.tsx`: Left column UI (Configuration).
*   `src/components/ExecutionPanel.tsx`: Right column UI (Status & Control).
*   `src-tauri/src/lib.rs`: Rust backend logic implementation.
*   `scripts/tauri-build-dmg.sh`: Custom build script for DMG creation.
*   `CLAUDE.md`: Detailed developer documentation and AI context.
