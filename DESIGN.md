# DESIGN.md

## Design system for the shader component demo site

This document defines the design direction for the public demo pages and GitHub Pages site for the shader component repository.

The site is:

- **demo-first**
- **documentation-oriented**
- **developer-facing**
- **visually disciplined**
- **selected by designers**

The goal is to present shader components as a serious open-source library that still feels beautiful, polished, and intentional.

The guiding idea is:

> **Quiet documentation shell, expressive shader content.**

Or more concretely:

> **Vercel-like structure, friendlier editorial rhythm, and the demos provide the color.**

---

## 1. Product and audience framing

### What this site is
This is not a marketing landing page for a startup app.

This is a **documentation and demo site for an open-source shader component library**.

It should feel like:

- high-quality technical documentation
- a polished demo gallery
- a trustworthy component reference
- a place developers can explore and copy from
- a place designers can browse and decide “yes, these feel good”

### Primary audience
- **developers first**
- designers second
- technically curious product people third

### Primary job of the site
The site should communicate, in order:

1. **These shader components are beautiful**
2. **These components are real, practical, and reusable**
3. **You can play with them immediately**
4. **This is a serious library, not just shader art**

### Interaction goal
The first useful action is:

> **Play around with the shaders**

Not “sign up”, not “read a manifesto”, not “edit a prompt”.

---

## 2. Core design thesis

The demos are the hero.

The page chrome should be restrained enough that the shader output feels important. The design system should not compete with the visuals.

### Overall personality
The site should feel:

- clean
- calm
- precise
- airy
- approachable
- slightly editorial
- technically credible

It should **not** feel:

- loud
- candy-colored
- over-branded
- startup-gradient-heavy
- playful in a toy-like way
- glossy or overly “premium SaaS”

### One-sentence design brief
A documentation-first showcase for beautiful shader components, where the interface is mostly monochrome and the live demos carry the visual excitement.

---

## 3. High-level rules

### Rule 1 — monochrome shell
The general site chrome should be mostly monochrome.

Use color sparingly in:

- live shader canvases
- preview thumbnails
- selected demo states
- tiny accent moments tied directly to shader content

Do **not** use bright color as general page decoration.

### Rule 2 — content is the hero
The live shader demos and examples are the primary visual content.

Hero sections, cards, and galleries should frame the demos, not overshadow them.

### Rule 3 — documentation over marketing
Every section should feel useful.

Prefer:

- clear labels
- concise descriptions
- meaningful presets
- real controls
- code-adjacent structure

Avoid:

- big vague claims
- decorative copy blocks
- empty “platform vision” sections
- excessive storytelling

### Rule 4 — soft engineering
The system should feel structurally disciplined but not cold.

Use:

- restrained spacing
- careful typography
- subtle depth
- moderate radii
- quiet borders

Avoid:

- hard black-on-white harshness
- ultra-tight severe type everywhere
- overly square geometry
- heavy shadows

### Rule 5 — approachable, not bubbly
The geometry should feel calm and modern.

Prefer **6–12px radii** over pills and circles as the default.

Pills are allowed for:

- badges
- segmented controls
- tiny filter chips

But they are not the dominant language.

---

## 4. Visual direction

### The midpoint we are aiming for
This system should sit between:

- **Vercel**: restrained, engineered, high-trust, whitespace-driven
- **Figma**: friendlier, creative-tool-adjacent, softer and more approachable

But the correct midpoint is **not** a literal average.

Instead:

- **structure comes from the restrained side**
- **warmth comes from the approachable side**
- **color comes from the shader content itself**

### Visual summary
- white page
- warm near-black text
- subtle gray hierarchy
- shadow-as-border containers
- moderate radii
- airy spacing
- quiet navigation
- expressive demo surfaces

---

## 5. Color system

### Philosophy
The site shell is monochrome.

Color is reserved for shader content and small component accents directly tied to that content.

### Core colors
```css
--bg-page: #ffffff;
--bg-subtle: #fafafa;
--bg-elevated: #ffffff;

--fg-primary: #171717;
--fg-secondary: #5c5c5c;
--fg-tertiary: #808080;
--fg-muted: #a1a1a1;

--line-subtle: rgba(0, 0, 0, 0.08);
--line-strong: rgba(0, 0, 0, 0.14);

--focus-ring: #0a72ef;
--selection-ring: rgba(10, 114, 239, 0.16);
```

### Accent colors
These are not general brand colors. They are utility accents for demo states and small UI signals.

```css
--accent-violet: #7c3aed;
--accent-cyan: #0ea5e9;
--accent-lime: #84cc16;
--accent-coral: #f97316;
```

Use these in:

- active demo presets
- selected shader categories
- mini legends
- demo overlays
- chart/slider fills when relevant

Do not use them for:

- nav chrome
- body links everywhere
- decorative section backgrounds
- big generic gradients

### Link color
Keep links understated.

```css
--link: #171717;
--link-hover: #000000;
--link-decoration: rgba(0, 0, 0, 0.22);
```

Documentation links should feel editorial, not marketing-blue by default.

---

## 6. Typography

### Font strategy
Use:

- Geist Sans for the main system
- Geist Mono for technical labels, metadata, and code-adjacent UI

This gives us a strong technical baseline while keeping the system easy to ship and consistent across docs and demo pages.

### Font stack
```css
--font-sans: "Geist", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
--font-mono: "Geist Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
```

### Typography personality
Type should feel:

- crisp
- airy
- readable
- developer-friendly
- slightly compressed in display sizes
- relaxed in body copy

It should not feel:

- super severe
- overly geometric
- over-tracked
- too tiny or dense

### Type scale
```css
--text-hero: 64px;
--text-display: 48px;
--text-h1: 40px;
--text-h2: 28px;
--text-h3: 22px;
--text-body-lg: 18px;
--text-body: 16px;
--text-body-sm: 14px;
--text-mono-sm: 12px;
--text-micro: 11px;
```

### Weights
```css
--weight-regular: 400;
--weight-medium: 500;
--weight-semibold: 600;
```

### Tracking
Use restrained negative tracking only on larger headings.

- `hero: -1.4px`
- `display: -1.0px`
- `h1: -0.6px`
- `h2 and below: normal`

### Type roles
- **Hero title**: `64px`, `600`, line-height `1.0`, letter-spacing `-1.4px`, color `--fg-primary`
- **Section heading**: `40px`, `600`, line-height `1.08`, letter-spacing `-0.6px`
- **Card title**: `22px`, `600`, line-height `1.2`
- **Body**: `16px`, `400`, line-height `1.55`, color `--fg-secondary`
- **Body large**: `18px`, `400`, line-height `1.6`, color `--fg-secondary`
- **Technical label**: `12px`, `500`, uppercase, mono, letter-spacing `0.06em`, color `--fg-tertiary`

### Content style
Documentation copy should be:

- concise
- concrete
- a little dry
- visually calm

Avoid:

- hype language
- giant slogans
- hand-wavy claims

---

## 7. Radius system

Geometry should default to moderate softness, not pills.

### Radius scale
```css
--r-6: 6px;
--r-8: 8px;
--r-10: 10px;
--r-12: 12px;
--r-16: 16px;
--r-20: 20px;
--r-24: 24px;
--r-full: 9999px;
```

### Usage
- `6px`: tiny controls, tags, tiny inputs
- `8px`: small buttons, compact fields
- `10px`: standard inputs and utility controls
- `12px`: primary buttons, small cards
- `16px`: component cards, image frames
- `24px`: main playground shell / featured demo frame
- `full`: chips, badges, segmented controls only

### Geometry rules
Default shape language:

- rectangles with softened corners
- no hard pills everywhere
- no full circles unless the control is clearly icon-only

---

## 8. Depth, borders, and surfaces

### Philosophy
Use shadow-as-border as the system foundation.

Borders should feel subtle and structural, not loud.

### Base border
```css
box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.08);
```

### Standard card
```css
box-shadow:
  0 0 0 1px rgba(0, 0, 0, 0.08),
  0 2px 3px rgba(0, 0, 0, 0.03),
  inset 0 1px 0 #fafafa;
```

### Featured card / playground shell
```css
box-shadow:
  0 0 0 1px rgba(0, 0, 0, 0.08),
  0 6px 20px -12px rgba(0, 0, 0, 0.18),
  inset 0 1px 0 #fafafa;
```

### Hover
Hover should slightly deepen ambient shadow or darken the border line.

Do not use:

- dramatic lift
- giant blurs
- material-style elevation jumps

### Surfaces
- `page background`: pure white
- `panels/cards`: white
- `subtle strips / code backgrounds`: `#fafafa`

Avoid alternating lots of different tinted section backgrounds.

---

## 9. Accessibility and interaction

### Focus styling
Keep accessibility standard and calm.

### Rule
Use a clear, solid 2px focus ring.

```css
outline: 2px solid var(--focus-ring);
outline-offset: 2px;
```

Do not use dashed “editor-style” focus as the primary site-wide accessibility pattern.

### Hover
Hover states should be:

- subtle
- predictable
- consistent

Good hover signals:

- slightly stronger border shadow
- slightly darker text
- subtle surface tint change

Avoid:

- color explosions
- scale effects
- floaty motion

### Motion
Animation on the site shell should be minimal.

The demos themselves may animate.

Site UI motion should be limited to:

- `120–180ms` hover transitions
- opacity / background / shadow changes
- small reveal transitions

Avoid:

- exaggerated spring motion
- excessive panel shifts
- decorative parallax

---

## 10. Layout principles

### Content width
Use a main content width of `1280px`.

### Page padding
- **Desktop**: horizontal page padding `32px`
- **Tablet**: `24px`
- **Mobile**: `16px`

### Vertical rhythm
The site should feel airy and editorial.

Recommended section spacing:

- hero to next section: `64px`
- standard section padding: `72px`
- compact documentation sections: `48px`

### Grid
Use a simple 12-column mental model, but keep implementation flexible.

Recommended practical layouts:

- hero: 2-column
- docs overview: 1-column with side notes or 2-column
- examples gallery: 2-up or 3-up
- playground: main preview + sidebar controls

### Layout rule
The page should never feel crowded.

Whitespace is part of the credibility of the library.

---

## 11. Navigation

### Role
Navigation should feel like documentation nav, not startup nav.

### Structure
**Left:**

- repo/library name
- maybe a tiny “OSS shader components” label

**Center or inline:**

- Docs
- Components
- Playground
- Examples
- GitHub

**Right:**

- a single CTA such as Open Playground or View on GitHub

### Nav styling
- white background
- subtle bottom border via shadow-as-border
- `14px` or `15px` text
- medium weight
- sticky

### Nav tone
Quiet, compact, technical.

Avoid:

- oversized nav
- multiple CTAs
- sales-y language

---

## 12. Buttons

### Default button sizes
#### Primary
- height: `40px`
- padding: `0 16px`
- radius: `12px`
- background: `#171717`
- text: white

#### Secondary
- height: `40px`
- padding: `0 16px`
- radius: `12px`
- background: white
- border: shadow-as-border
- text: `#171717`

#### Tertiary
- height: `36px`
- padding: `0 12px`
- radius: `10px`
- background: transparent

#### Small utility
- height: `32px`
- padding: `0 10px`
- radius: `8px`

### Button rules
Buttons should feel:

- compact
- crisp
- usable
- not bubbly

Avoid:

- full-pill buttons as the default
- circle buttons for primary actions
- excessive icon+label ornamentation

### Exceptions
Use pills for:

- tiny filter chips
- segmented controls
- shader tags
- status badges

---

## 13. Inputs and controls

This site is not centered on text input. Controls are mostly for exploring demos.

### Default controls
- sliders
- toggles
- segmented buttons
- dropdowns
- numeric fields
- preset chips

### Control styling
- monochrome shell
- accent on active state only
- `10–12px` radii
- compact spacing
- strong labels
- predictable alignment

### Sliders
Use restrained visual styling:

- thin track
- filled range can use muted accent
- thumb should be minimal and precise

### Segmented controls
This is one place where pill geometry is welcome.

Use for:

- static / animate
- shader variants
- preview mode switches
- grid / single / compare views

---

## 14. Card system

### Standard documentation card
Use for:

- component summaries
- example descriptions
- shader metadata
- installation patterns

Style:

- white
- `16px` radius
- shadow-border
- concise content
- mono label optional

### Demo card
Use for:

- shader preview tiles
- preset samples
- examples grid

Style:

- larger visual preview
- `16px` radius
- tighter metadata
- hover slightly strengthens border/shadow

### Featured playground frame
Use for:

- hero playground
- primary live component showcase

Style:

- `24px` radius
- stronger ambient depth
- quiet shell
- expressive inner content

---

## 15. Hero section

### Hero purpose
The hero should immediately say:

- these shader components are beautiful, real, and explorable

### Hero content
**Left side:**

- title
- one-sentence description
- one short supporting paragraph
- primary action
- secondary action
- tiny technical metadata line

**Right side:**

- live shader playground frame

### Suggested hero copy structure
**Title**

Beautiful shader components for modern UI and motion surfaces

**Body**

A focused open-source library of polished, reusable shader demos and components. Built for developers, selected by designers.

**Actions**

- Open Playground
- Browse Components

**Meta**

- WebGL-based
- Demo-first
- OSS-friendly

### Hero behavior
The shader playground is the visual centerpiece.

Do not place giant decorative background gradients behind the hero. If there is any gradient wash, keep it extremely soft and mostly invisible.

---

## 16. Playground section

This is the most important part of the site.

### Purpose
The playground should feel like a practical component demo, not an artwork viewer.

It should communicate:

- this is a real component
- you can play with it
- the API/control surface is understandable
- it belongs in a library

### Main layout
**Desktop:**

- large preview pane on the left
- compact control panel on the right

**Mobile:**

- stacked preview then controls

### Recommended sizing
- preview dominates
- controls are narrow and scannable
- no giant settings wall

### Playground shell
Style:

- white outer shell
- `24px` radius
- shadow-border
- padded top toolbar
- quiet structural dividers
- expressive preview content

### Top toolbar
Should include:

- shader name
- category label
- maybe view mode toggle
- reset or preset selector
- GitHub/source link if useful

Keep the toolbar compact and technical.

### Controls panel
Keep it narrow and dry.

Good sections:

- Presets
- Parameters
- Notes
- Performance / support

Not included:

- prompt editor
- chat
- heavy inspector UI

### Preview area
The preview should be allowed to feel rich and colorful.

Use:

- generous breathing room
- optional checker/subtle background when appropriate
- ability to go fullscreen or expand
- obvious interactivity if the shader reacts to pointer or animation state

---

## 17. Examples gallery

### Purpose
Show breadth without making the page feel busy.

### Good gallery content
- 2–3 strong presets per shader
- different modes / palettes
- stills plus maybe one animated featured example
- small concise captions

### Layout
**Desktop:**

- 2-up or 3-up grid

**Mobile:**

- single column

### Caption style
- mono label for shader name or preset type
- short plain-language note
- tiny technical metadata optional

---

## 18. Documentation tone and content model

### Tone
The site should read like:

- calm technical documentation
- a thoughtful library site
- a dry but tasteful demo reference

### Copy principles
Use:

- concise descriptions
- clear nouns
- short sentences
- practical framing

Avoid:

- big sweeping vision language
- excessive adjectives
- playful writing voice for its own sake
- “magical” product language

### Good content blocks
- what this shader is
- what it is useful for
- key parameters
- performance notes
- browser support
- implementation notes
- link to source/demo

---

## 19. GitHub Pages / OSS documentation considerations

This system must work well for:

- demo landing pages
- docs pages
- component reference pages
- example pages
- README-like content rendered on GitHub Pages

### Therefore
- keep the base styles robust and simple
- do not rely on overly bespoke layout tricks
- typography should hold up in markdown-heavy pages
- code blocks should look natural in the same system
- cards and examples should be portable across pages

### Code block styling
```css
background: #fafafa;
color: #171717;
border-radius: 12px;
box-shadow: 0 0 0 1px rgba(0,0,0,0.08);
font-family: var(--font-mono);
font-size: 13px;
line-height: 1.6;
```

### Table styling
Keep tables simple, light, and readable.

### Docs pages
Docs pages should feel more minimal than the demo gallery, but still part of the same system.

---

## 20. Component inventory

The site should include a consistent set of primitives:

### Foundations
- page container
- section wrapper
- stack / row primitives
- prose block
- mono label
- divider

### Navigation
- top nav
- tab/segmented control
- link list

### Actions
- primary button
- secondary button
- tertiary button
- icon button

### Cards
- docs card
- preview card
- featured demo frame
- stat / metadata card

### Controls
- slider
- toggle
- segmented switch
- select
- numeric input
- preset chip

### Content
- code block
- callout
- table
- example caption
- browser support row

---

## 21. Do / don’t

### Do
- keep the shell mostly monochrome
- let the shader demos provide the color
- use shadow-as-border
- use `6–12px` radii by default
- keep typography airy and readable
- make the demos the center of gravity
- make the site feel useful and technical
- keep the interaction model simple and immediate

### Don’t
- design this like a startup landing page
- use decorative gradients across the whole page
- make all buttons pills
- use heavy shadows
- use loud chromed UI around the demos
- add unnecessary product storytelling
- make docs pages visually disconnected from demo pages
- overcomplicate the controls

---

## 22. CSS token draft

```css
:root {
  --bg-page: #ffffff;
  --bg-subtle: #fafafa;
  --bg-elevated: #ffffff;

  --fg-primary: #171717;
  --fg-secondary: #5c5c5c;
  --fg-tertiary: #808080;
  --fg-muted: #a1a1a1;

  --line-subtle: rgba(0, 0, 0, 0.08);
  --line-strong: rgba(0, 0, 0, 0.14);

  --focus-ring: #0a72ef;
  --selection-ring: rgba(10, 114, 239, 0.16);

  --accent-violet: #7c3aed;
  --accent-cyan: #0ea5e9;
  --accent-lime: #84cc16;
  --accent-coral: #f97316;

  --font-sans: "Geist", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --font-mono: "Geist Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;

  --text-hero: 64px;
  --text-display: 48px;
  --text-h1: 40px;
  --text-h2: 28px;
  --text-h3: 22px;
  --text-body-lg: 18px;
  --text-body: 16px;
  --text-body-sm: 14px;
  --text-mono-sm: 12px;
  --text-micro: 11px;

  --weight-regular: 400;
  --weight-medium: 500;
  --weight-semibold: 600;

  --r-6: 6px;
  --r-8: 8px;
  --r-10: 10px;
  --r-12: 12px;
  --r-16: 16px;
  --r-20: 20px;
  --r-24: 24px;
  --r-full: 9999px;

  --shadow-border: 0 0 0 1px rgba(0, 0, 0, 0.08);
  --shadow-card:
    0 0 0 1px rgba(0, 0, 0, 0.08),
    0 2px 3px rgba(0, 0, 0, 0.03),
    inset 0 1px 0 #fafafa;
  --shadow-featured:
    0 0 0 1px rgba(0, 0, 0, 0.08),
    0 6px 20px -12px rgba(0, 0, 0, 0.18),
    inset 0 1px 0 #fafafa;

  --page-max-width: 1280px;
  --page-pad-desktop: 32px;
  --page-pad-tablet: 24px;
  --page-pad-mobile: 16px;

  --section-gap: 72px;
  --section-gap-compact: 48px;
}
```

---

## 23. Final summary

This design system should feel like:

- a serious open-source docs site
- with unusually beautiful demo content
- presented in a calm, monochrome shell
- with soft engineering discipline
- and just enough warmth to feel designer-approved

If there is ever a conflict between “showy site design” and “let the shader demo breathe”:

- choose the quieter shell.
