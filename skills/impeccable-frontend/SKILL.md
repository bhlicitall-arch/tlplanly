---
name: impeccable-frontend
description: Frontend design and UX polish skill adapted from pbakaus/impeccable for TLPlanly/BHLicitAll. Use when improving app UI, dashboards, forms, tables, landing pages, visual hierarchy, spacing, typography, color, responsive behavior, accessibility, empty states, loading states, component consistency, anti-pattern detection, or when the user asks for a more professional frontend visual style like bhlicitall.com.br.
---

# Impeccable Frontend

Use this skill to make frontend work look deliberate, trustworthy, and production-ready. It is especially useful for TLPlanly screens, dashboards, forms, tables, sidebars, reports, pricing, onboarding, and product modules.

## Workflow

1. Identify the surface: app/product UI, landing/brand page, or mixed.
2. Read at least one local UI file before changing anything: CSS tokens, page markup, or a representative component.
3. If the user mentions BHLicitAll, TLPlanly, licitacoes, premium consulting, or "como nosso site", read `references/bhlicitall-visual.md`.
4. For product dashboards and tools, read `references/product-ui.md`.
5. For audit/polish requests, run a quick anti-pattern pass using `references/audit-checklist.md`.
6. Make scoped code changes. Preserve existing behavior and data flows.
7. Verify with syntax/build/tests available in the project. For visual changes, start or reuse a local server and report the URL.

## Core Rules

- Prefer dense, clear, work-focused UI for product surfaces. Do not turn operational tools into marketing pages.
- Use cards only when they frame a real item, modal, or tool. Avoid cards inside cards.
- Keep borders crisp and quiet. Use full borders, subtle dividers, and consistent radii instead of colored side stripes.
- Make the first read obvious: page title, active module, current action, primary result.
- Use one accent color intentionally for primary actions, selected state, and meaningful emphasis.
- Every interactive component needs default, hover, focus, disabled, and error states when applicable.
- Text must not overflow buttons, tables, chips, panels, or narrow mobile layouts.
- Use stable dimensions for toolbars, icon buttons, table controls, counters, and fixed-format panels.
- Avoid generic AI tells: purple-blue gradients, decorative orbs, endless identical card grids, gradient text, huge hero type inside dashboards, and pointless animation.

## TLPlanly Defaults

- Product register: TLPlanly is an engineering cost and audit tool. Design serves repeated work, not decoration.
- Default mood: premium, technical, calm, public-sector credible.
- Preferred visual direction: light professional surface with refined gold accents, strong legibility, restrained shadows, and precise table/form treatment.
- Use Inter for product UI and Poppins for brand/display accents when available.

## Task Routing

- **Audit**: inspect layout, contrast, typography, overflow, controls, responsive behavior, and obvious AI tells.
- **Polish**: improve spacing, borders, colors, type hierarchy, hover/focus states, and perceived quality.
- **Typeset**: adjust font family, weight, sizing, line height, labels, headings, and table density.
- **Layout**: improve grids, alignment, spacing rhythm, sidebar/topbar, and panel structure.
- **Colorize**: refine palette and token usage without repainting the whole app.
- **Harden**: handle empty states, long text, errors, loading, mobile, and table overflow.

## References

- `references/bhlicitall-visual.md`: brand-inspired tokens and visual rules for BHLicitAll/TLPlanly.
- `references/product-ui.md`: product UI rules adapted from Impeccable's product register.
- `references/audit-checklist.md`: practical pass before finishing frontend work.

## Source Note

This skill is adapted for this project from the public Impeccable design guidance repository by Paul Bakaus: https://github.com/pbakaus/impeccable. Keep future updates concise and project-specific.
