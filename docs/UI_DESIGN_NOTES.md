# TRACE//GOA — "Goa Beach-Shack Command Center" UI Design Notes

> Reference Study & Translation of [Hacker House Goa 2026](https://hhgoa.com) into a Graph-Native Agentic Fraud Investigation System.

---

## 1. Visual Language & Core Philosophy

Hacker House Goa 2026 combines:
- **Sun-drenched Goa Poster Art**: Flat saturated color fields, heavy ink outlines (2–3px), hard offset drop shadows (`6px 6px 0px var(--ink)`).
- **High-contrast Editorial Typography**: Tall, condensed high-contrast serif display headlines (`Instrument Serif` / `Playfair Display`), uppercase tight leading, paired with chunky wordmark (`Rubik Mono One`) and monospaced microcopy (`JetBrains Mono`).
- **Tactile Beach/Shack Metaphors**: Hanging wooden boards on bamboo poles, message-in-a-bottle, cork notice boards with pinned notes and tape, surfboards as filter tags, rubber stamps with ink-splat impact.
- **Low Noise, Pure Signal**: While whimsical and artistic, the layout maintains strict tabular legibility, dense telemetry, and transparent auditability for serious financial fraud analysts.

---

## 2. Color Palette & Design Tokens

| Token | Hex | Role / Semantic Meaning |
|---|---|---|
| `--goa-green-900` | `#044E2A` | Deep ocean floor background, dark contrast zones |
| `--goa-green-700` | `#066A38` | Primary lush Goa green background (hero, headers) |
| `--goa-green-500` | `#1E9B52` | Palm fronds, secondary panels, verified badges |
| `--goa-green-200` | `#A9DDB9` | Soft mint highlights, muted pill fills |
| `--sun-yellow` | `#FFE100` | High-voltage sunshine, CTAs, "uncertain" verdicts |
| `--hot-pink` | `#FF0A78` | Stickers, alerts, "confirmed fraud" verdict badges |
| `--terracotta` | `#D9532B` | Mangalore-tile roofs, policy rules, regulatory SARs |
| `--sand` | `#F3D9A4` | Warm beach canvas, notice board cork texture |
| `--paper` | `#FFFFFF` | Pinned paper sheets, high-contrast modal backdrops |
| `--ink` | `#0B2A1A` | 2–3px chunky outlines, hard offset drop shadows |

### Semantic Verdict Mapping
- **Confirmed Fraud**: Hot Pink (`#FF0A78`) + Ink outline
- **Uncertain / Needs Evidence**: Sun Yellow (`#FFE100`) + Ink outline
- **Legitimate / Cleared**: Goa Green (`#1E9B52`) + Mint highlight (`#A9DDB9`)
- **Policy Gate / SAR / Regulatory**: Terracotta (`#D9532B`)

---

## 3. Typography Hierarchy

1. **Display Serif (Headlines & Big Stats)**:
   - Primary: `Instrument Serif`, cursive/serif fallback.
   - Style: Uppercase, tracking tight, optional subtle `scaleY(1.12)` for retro-poster proportion, drop shadow in ink.
2. **Chunky Wordmark**:
   - Primary: `Rubik Mono One` or `Bowlby One`, bright Sun Yellow with 3px ink stroke.
3. **Monospaced Telemetry (IDs, Hashes, Latency, Tool Calls, Timestamps)**:
   - Primary: `JetBrains Mono`, uppercase, letter-spacing `0.05em`.
4. **Body & Dense Evidence**:
   - Primary: `Inter`, system-ui fallback at 14–16px with crisp line-height for analyst legibility.

---

## 4. Product Feature to Goa Poster Metaphor Mapping

| TRACE//GOA Feature | Goa Aesthetic Metaphor & Implementation |
|---|---|
| **Landing Hero** | Lush green canvas (`#066A38`), giant yellow serif `TRACE // GOA`, draggable hot-pink Devanagari **"जाँच"** (investigation) sticker, live backend status pills. |
| **Risk & Confidence Score** | **The Sun**: A golden sun rising above the Arabian Sea. Sun elevation = Confidence level (0.0 to 1.0); Sun halo color = Fraud Risk (Green → Yellow → Pink). |
| **Uncertainty & Stopping Rule** | **Tide Gauge**: High-water mark indicating "ENOUGH TO ACT" threshold. Missing evidence pieces float as sealed bottles in the tide. |
| **Pipeline Stages** | **4 Hanging Boards on Bamboo Pole** (Day 01–04 style): `01 TRIGGER`, `02 INVESTIGATE`, `03 ASSESS`, `04 ACT`. Boards swing on hover and show active state. |
| **Case Directory (HHG-001…020)** | **Beach-Shack Village**: 20 shacks with shutters colored by verdict (Pink=Fraud, Yellow=Uncertain, Green=Legit). Surfboard filter chips (`ALL`, `FRAUD`, `UNCERTAIN`, `LEGIT`). |
| **Investigation Roadmap** | **The Timeline at a Glance**: Vertical bamboo-line roadmap with milestone dots, latency chips, tool call signatures, and agent reasoning. |
| **Evidence Board** | **Notice Board "PINNED UP"**: Corkboard with slightly rotated paper notes taped or pinned; color-coded by source (TigerGraph, Policy, Case Memory, Customer Validation). |
| **Graph Visualization** | **Topological Beach Map**: Thick ink-outlined entity nodes (Cards, Devices, Customers, Addresses), pink alert aura for fraud rings, ripple waves for 1-hop / 2-hop traversal. |
| **Additional Evidence Request** | **Message in a Bottle**: When the agent requests verification, a bottle bobs into the sea and returns with customer validation, triggering the Before/After flip animation. |
| **Next-Best Action & Approvals** | **Rubber Stamp Station**: Post-investigation actions stamped down with heavy visual thud (`APPROVE`, `REJECT`, `ESCALATE`) respecting RBAC roles (Analyst vs Risk Lead). |
| **Case Memory** | **Inside HHG: Past Editions**: Horizontal strip of polaroid cards representing historical precedents from 5,565 closed cases with similarity scores. |
| **Decision Ledger** | **Bamboo & Rope Chain**: SHA-256 blocks linked together; interactive **Verify Chain** button sweeps green pulses across verified blocks, with tamper injection toggle. |
| **Explainability** | **FAQ Accordion with '+' Toggles**: Clear expandable answers to key investigative questions ("Why was card blocked?", "What evidence contradicted fraud?"). |
| **Tech Stack & Integrity** | **Partner Marquee**: Looping banner featuring TigerGraph, GSQL, MCP, GraphRAG, Gemini 2.5 Flash, FastAPI, and React. |

---

## 5. Motion, Performance & Accessibility

- **Prefers-Reduced-Motion**: All swaying, wave oscillations, and parallax disabled automatically if user prefers reduced motion.
- **Hardware-Accelerated**: Transforms (`translate3d`, `rotate`, `scale`) and opacity only — zero layout thrashing.
- **Contrast Ratios**: Verified ≥ 4.5:1 text contrast throughout.
- **Keyboard Navigation**: Global hotkeys `J/K` (next/previous case), `E` (toggle evidence board), `G` (graph view), `L` (ledger), `D` (demo mode), `Escape` (return to village).
