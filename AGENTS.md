# Repository Guidelines

## Project Structure & Module Organization
- `src/` holds the React + TypeScript frontend, including UI components in `src/components/` and shared types in `src/types/`.
- `src-tauri/` is the Rust backend for the Tauri app. Core commands live in `src-tauri/src/` and configuration in `src-tauri/tauri.conf.json`.
- `src-tauri/scripts/` contains launcher scripts for Claude/Codex/Gemini.
- Static assets are in `src/assets/` and `public/`.
- Build outputs land in `dist/` (web) and `src-tauri/target/release/bundle/` (native).

## Build, Test, and Development Commands
- `npm run tauri dev`: Run the full desktop app in development mode.
- `npm run dev`: Start the Vite dev server only (UI preview on port 1420).
- `npm run build`: Build frontend assets with TypeScript checks.
- `npm run tauri:build`: Build the signed-ish DMG via `scripts/tauri-build-dmg.sh`.
- `npm run tauri:build:raw`: Run `tauri build` without the DMG wrapper.
- `npm run fmt`: Format TS/TSX/CSS with Prettier.
- `npm run tauri:fmt`: Format Rust code with `cargo fmt`.
- `npm run pretauri:build`: Auto-update version (YY.M.D) before building.

## Coding Style & Naming Conventions
- TypeScript/React uses Prettier defaults (2-space indentation) and strict TS settings.
- Rust formatting follows `cargo fmt` defaults.
- Components are PascalCase (e.g., `SchedulePanel.tsx`), hooks/helpers use camelCase.
- Prefer explicit prop types and reuse shared types from `src/types/`.

## Testing Guidelines
- No automated tests are configured. Use manual checks:
  - Schedule execution flow, iTerm integration, rate-limit retry, and settings persistence.
- If you add tests, document them here and include the command to run them.

## Commit & Pull Request Guidelines
- Commit messages follow Conventional Commit style (e.g., `feat: ...`, `fix: ...`, `docs: ...`).
- PRs should include a clear summary, linked issues if applicable, and screenshots/gifs for UI changes.
- Note any macOS/iTerm-specific setup or permissions required to reproduce.

## Security & Configuration Notes
- The app requires macOS with iTerm and Accessibility permissions enabled.
- Keep CLI tool paths/options in sync with UI settings and update docs when defaults change.
