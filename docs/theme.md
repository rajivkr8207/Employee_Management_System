# Frontend Theme

The application uses Tailwind CSS for utility styling and CSS custom properties in `frontend/src/app/index.css` for shared theme colors and dimensions. Theme switching adds or removes the `dark` class on the document root; keep both modes readable and consistent.

## Brand and surfaces

| Token | Light | Dark | Intended use |
|---|---|---|---|
| `--primary` | `#4f46e5` | `#818cf8` | Primary actions, links, focus accents |
| `--primary-hover` | `#4338ca` | `#a5b4fc` | Hovered primary actions |
| `--primary-soft` | `#eef2ff` | `#252750` | Selected and highlighted surfaces |
| `--background` | `#f8fafc` | `#0b1120` | App/page background |
| `--surface` | `#ffffff` | `#111827` | Cards, panels, and form controls |
| `--surface-secondary` | `#f1f5f9` | `#1e293b` | Muted panels and secondary surfaces |
| `--surface-elevated` | `#ffffff` | `#1a2438` | Dialogs and elevated content |

## Text and borders

| Token | Light | Dark | Intended use |
|---|---|---|---|
| `--text-primary` | `#0f172a` | `#f1f5f9` | Main content and headings |
| `--text-secondary` | `#64748b` | `#94a3b8` | Supporting text |
| `--text-muted` | `#94a3b8` | `#64748b` | Low-emphasis labels |
| `--border` | `#e2e8f0` | `#334155` | Default separators and outlines |
| `--border-strong` | `#cbd5e1` | `#475569` | Emphasized borders |

## Semantic status colors

| Token family | Light | Dark | Intended use |
|---|---|---|---|
| Success: `--success`, `--success-soft` | `#16a34a`, `#dcfce7` | `#4ade80`, translucent green | Completed and approved states |
| Warning: `--warning`, `--warning-soft` | `#d97706`, `#fef3c7` | `#fbbf24`, translucent amber | Pending or attention-needed states |
| Danger: `--danger`, `--danger-soft` | `#dc2626`, `#fee2e2` | `#f87171`, translucent red | Rejected, destructive, or error states |
| Info: `--info`, `--info-soft` | `#0284c7`, `#e0f2fe` | `#38bdf8`, translucent blue | Informational states |

Use the matching soft token for tinted badges or backgrounds, and maintain sufficient text contrast in both modes. Status meaning must not rely on color alone; include clear text or an icon.

## Role navigation and layout

- The sidebar uses a deep indigo surface (`--sidebar-bg`) with dedicated text, hover, active, border, and logo tokens.
- Keep role dashboards distinct for admin, store admin, manager, and employee. Role-specific accents must not override semantic status colors or reduce contrast.
- Shared dimensions are `--sidebar-width: 260px` and `--topbar-height: 64px`.
- Shared radii are `--radius-xs`, `--radius-sm`, `--radius-control`, `--radius-card`, `--radius-xl`, and `--radius-full`; use them instead of introducing arbitrary global values.
- Shared elevation levels are `--shadow-xs`, `--shadow-sm`, `--shadow-md`, `--shadow-lg`, and `--shadow-xl`.

## Theme implementation

- Use `var(--token-name)` when a design token applies; use Tailwind utilities for structure, spacing, sizing, and responsive behavior.
- Keep the `.dark` overrides in sync with light-mode tokens when adding a new global color.
- Respect the existing `prefers-reduced-motion` rules and visible keyboard focus styles.
