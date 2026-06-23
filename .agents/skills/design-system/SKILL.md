---
name: design-system-wearenovelark
description: Creates implementation-ready design-system guidance with tokens, component behavior, and accessibility standards. Use when creating or updating UI rules, component specifications, or design-system documentation.
---

<!-- TYPEUI_SH_MANAGED_START -->

# WeAreNovelArk

## Mission
Deliver implementation-ready design-system guidance for WeAreNovelArk that can be applied consistently across content site interfaces.

## Brand
- Product/brand: WeAreNovelArk
- URL: https://goodluckark.com/
- Audience: readers and knowledge seekers
- Product surface: content site

## Style Foundations
- Visual style: structured, accessible, implementation-first
- Main font style: `font.family.primary=Segoe UI`, `font.family.stack=Segoe UI, Tahoma, Geneva, Verdana, sans-serif`, `font.size.base=15.2px`, `font.weight.base=600`, `font.lineHeight.base=24.32px`
- Typography scale: `font.size.xs=12.8px`, `font.size.sm=13.6px`, `font.size.md=14.4px`, `font.size.lg=15.2px`, `font.size.xl=16px`, `font.size.2xl=17.6px`, `font.size.3xl=20.8px`, `font.size.4xl=25.6px`
- Color palette: `color.text.primary=#1a1a2e`, `color.text.secondary=#6b6b8a`, `color.text.tertiary=#ffffff`, `color.text.inverse=#0000ee`, `color.surface.base=#000000`, `color.surface.muted=#c0396b`, `color.surface.raised=#f7f4fb`
- Spacing scale: `space.1=6px`, `space.2=10px`, `space.3=12px`, `space.4=70px`
- Radius/shadow/motion tokens: `radius.xs=3px` | `motion.duration.instant=300ms`

## Accessibility
- Target: WCAG 2.2 AA
- Keyboard-first interactions required.
- Focus-visible rules required.
- Contrast constraints required.

## Writing Tone
concise, confident, implementation-focused

## Rules: Do
- Use semantic tokens, not raw hex values in component guidance.
- Every component must define required states: default, hover, focus-visible, active, disabled, loading, error.
- Responsive behavior and edge-case handling should be specified for every component family.
- Accessibility acceptance criteria must be testable in implementation.

## Rules: Don't
- Do not allow low-contrast text or hidden focus indicators.
- Do not introduce one-off spacing or typography exceptions.
- Do not use ambiguous labels or non-descriptive actions.

## Guideline Authoring Workflow
1. Restate design intent in one sentence.
2. Define foundations and tokens.
3. Define component anatomy, variants, and interactions.
4. Add accessibility acceptance criteria.
5. Add anti-patterns and migration notes.
6. End with QA checklist.

## Required Output Structure
- Context and goals
- Design tokens and foundations
- Component-level rules (anatomy, variants, states, responsive behavior)
- Accessibility requirements and testable acceptance criteria
- Content and tone standards with examples
- Anti-patterns and prohibited implementations
- QA checklist

## Component Rule Expectations
- Include keyboard, pointer, and touch behavior.
- Include spacing and typography token requirements.
- Include long-content, overflow, and empty-state handling.

## Quality Gates
- Every non-negotiable rule must use "must".
- Every recommendation should use "should".
- Every accessibility rule must be testable in implementation.
- Prefer system consistency over local visual exceptions.

<!-- TYPEUI_SH_MANAGED_END -->
