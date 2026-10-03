# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project context

DuHoc24 — a sample "study-abroad application portal" used as the reference repo for a 6-week programming course. The current state is **Week 1: static UI only**. All data is hardcoded in `lib/mock-data.ts`; there is no API, database, or auth yet. The README's week-by-week roadmap (Gemini chatbot → Supabase → document extraction → Make.com automation → Supabase Auth/RLS) defines what later steps add — don't build ahead of the requested week. UI copy, comments, and README are in Vietnamese; keep new user-facing text in Vietnamese.

## Commands

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # also performs type checking
npm run lint    # eslint (flat config, next core-web-vitals + typescript)
```

No test framework is configured. No env vars are needed to run the current build (`.env.example` lists the future Supabase / site URL vars).

## Stack notes

- **Next.js 16.3 (App Router) + React 19.2** — per AGENTS.md, check `node_modules/next/dist/docs/` before using Next APIs. Layouts use the global typed helpers (e.g. `LayoutProps<"/">`) rather than hand-written prop types.
- **Tailwind CSS v4**, configured entirely in `app/globals.css` (`@theme inline` + CSS variables); there is no `tailwind.config`. Light theme only.
- **shadcn/ui, style `base-nova`, built on Base UI (`@base-ui/react`), not Radix.** Primitives live in `components/ui/`. Add new ones with the shadcn CLI so they match the Base UI variant; the `@tailark-oss` registry is also configured in `components.json`.
- Path alias `@/*` → repo root. `cn()` in `lib/utils.ts`.
- Remote images are allowed only from `images.unsplash.com` (`next.config.ts`).
- Font: Cabin (latin + vietnamese subsets) wired to `--font-sans` in `app/layout.tsx`.

## Architecture

Three areas, each with its own composition:

- `/` (`app/page.tsx`) — landing page assembled from `components/landing/*` plus shared `site-header` / `site-footer`. The quote form and chat widget are client components with local state only.
- `/portal` — student portal composed from `components/portal/*`, reading `currentStudent` / `schools` from mock data.
- `/admin/*` — `app/admin/layout.tsx` provides the sidebar shell (`components/admin/sidebar.tsx`, desktop sidebar + mobile nav); `/admin` redirects to `/admin/requests`. Each admin page is a server component rendering a table from mock data with `AdminPageHeader`.

`lib/mock-data.ts` is the de facto data model: its types (`School`, `AdmissionRequest`, `StudentProfile`, `Conversation`, …) map to the future Supabase tables (`schools`, `requests`, `student_profiles`, `conversations`/`messages`). Status enums use Vietnamese snake_case codes (`DocStatus`: `chua_nop | dang_xu_ly | hop_le | can_nop_lai`; `RequestStatus`: `cho_duyet | da_duyet | tu_choi`), and `components/status-badge.tsx` maps them to labels and color tones. When replacing mock data with real data, keep these types as the contract so pages and badges keep working.

Pages are server components by default; `"use client"` is limited to interactive pieces (quote form, chat widget, site header, admin sidebar, and some `ui/` primitives).

## Quy tắc Git

- Luôn hỏi xác nhận trước khi push lên GitHub.
- Không bao giờ commit file `.env` hoặc bất kỳ file nào chứa API key (`.gitignore` chỉ chặn `.env`, `.env.local`, `.env.*.local`; các file như `.env.production` không bị chặn nên phải kiểm tra trước khi commit; riêng `.env.example` được commit và chỉ chứa giá trị rỗng).
