# Repository Guidelines

## Project Structure & Module Organization

This project is a React 19 + TypeScript flash-card app built with Vite and packaged with Tauri 2. Frontend code lives in `src/`: `App.tsx` coordinates the UI, `components/` contains reusable views such as `DeckView`, `QuizMode`, and `ImportExport`, `hooks/` holds stateful React logic, `types/` defines shared interfaces, and `utils/` contains helpers such as file I/O and spaced-repetition logic. Static public assets are in `public/`; app images and bundled assets are in `src/assets/`. Native desktop code and Tauri configuration live under `src-tauri/`.

## Build, Test, and Development Commands

- `npm run dev`: start the Vite development server with hot reload.
- `npm run build`: run TypeScript project checks, then create the production web build in `dist/`.
- `npm run lint`: run Oxlint using `.oxlintrc.json`.
- `npm run preview`: serve the built Vite output locally.
- `npm run tauri:dev`: run the desktop app in development mode.
- `npm run tauri:build`: build the distributable Tauri desktop package.

Use `dev.bat` or `build.bat` on Windows when you want the repository-provided wrapper scripts.

## Coding Style & Naming Conventions

Use TypeScript and React function components. Name components in PascalCase (`FlipCard.tsx`), hooks with the `use` prefix (`useAppData.tsx`), and utility files in concise camelCase (`fileIO.ts`, `srs.ts`). Keep shared data shapes in `src/types/index.ts`. Prefer small, focused components and keep persistence or import/export logic outside visual components when practical. Follow the existing two-space indentation style and run `npm run lint` before handoff.

## Testing Guidelines

No automated test framework is currently configured. For changes, at minimum run `npm run lint` and `npm run build`. When changing card review, import/export, or file-system behavior, also verify the relevant workflow manually in `npm run dev` or `npm run tauri:dev`. If tests are added later, colocate them near the source file or use a dedicated `src/__tests__/` directory.

## Commit & Pull Request Guidelines

This checkout has no Git history available, so no project-specific commit convention can be inferred. Use short, imperative commit messages such as `Add markdown import validation` or `Fix quiz review scheduling`. Pull requests should include a concise summary, verification commands run, linked issues if any, and screenshots or short recordings for UI changes.

## Security & Configuration Tips

Review `src-tauri/capabilities/default.json` before expanding filesystem, clipboard, or dialog permissions. Do not commit generated build output from `dist/`, `node_modules/`, or `src-tauri/target/`.
