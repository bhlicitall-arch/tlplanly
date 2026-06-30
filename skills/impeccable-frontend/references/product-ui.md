# Product UI Register

Use this for TLPlanly screens, dashboards, admin panels, tables, forms, pricing management, audit flows, and operational modules.

## Test

A user fluent in estimating and public procurement tools should trust the screen immediately. Familiarity is good when it reduces cognitive load.

## Typography

- Product UI usually needs one strong sans family, not multiple display systems.
- Use a tight scale: labels 11-12px, body/table 13-14px, section titles 15-18px, page titles 24-30px.
- Avoid fluid heading sizes in dashboards.
- Keep labels short and consistent.

## Layout

- Use full-width work areas and constrained inner groups.
- Align form fields to a predictable grid.
- Use dividers between tool sections.
- Prefer inline expansion to modals when the user is still in the same task.
- Collapse grids responsibly on mobile; do not let buttons or labels overflow.

## Components

- Tables: sticky or clear headers when useful, tabular numbers, right-align numeric values when comparing.
- Forms: visible focus state, clear error/help text, no hidden required logic.
- Buttons: one primary per action cluster, outlines for secondary work.
- Navigation: active state must be unambiguous without relying only on color.
- Empty states: explain the next action, not just "empty".

## Motion

- 150-250ms transitions for state changes.
- No page-load choreography for app screens.
- Respect reduced motion.

## Product Bans

- Decorative motion.
- Inconsistent button/control shapes.
- Display fonts in labels, inputs, table cells, or dense panels.
- Full-saturation inactive states.
- Nested cards.
- Modal as the first answer for every small workflow.
