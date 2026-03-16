# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FigDart is a Figma plugin that generates Flutter/Dart code from Figma design tokens. It extracts text styles and color variables from a Figma file and outputs ready-to-use Dart code with plain `TextStyle` constructors (designed for bundled variable fonts) and Material 3 ColorScheme mappings.

## Build Commands

- **Build:** `npm run build` (runs `tsc -p tsconfig.json`)
- **Watch:** `npm run watch` (continuous rebuild on file changes)

There are no tests or linting scripts configured. ESLint is installed as a devDependency but has no npm script.

## Architecture

All TypeScript source files in `src/` compile into a single `src/main.js` bundle (via `tsconfig.json` `outFile`). The plugin runs in Figma's sandbox environment using the `@figma/plugin-typings` API.

**Key files:**

- `manifest.json` — Figma plugin manifest. Declares UI, capabilities (`inspect`), editor types (`figma`, `dev`), and `dynamic-page` document access. This is not a standard npm manifest.
- `src/main.ts` — Entry point. Opens the plugin UI and routes messages (`generate-textstyles`, `generate-colors`) to generator functions.
- `src/dartCodeGenerator.ts` — Core code generation. `generateTextStyles()` reads local text styles and produces a Dart class (`AppTextStyles`) with `const TextStyle` constructors, `fontFamily` references (for bundled variable fonts), and a `TextTheme` mapping. Includes OpenType feature extraction. `generateColors()` reads color variables, resolves aliases (up to 10 levels deep), and produces `AppMaterialTheme` constants plus per-mode `ColorScheme` instances.
- `src/utils.ts` — Pure helper functions: font weight/style inference from Figma style strings, name formatting (camelCase conversion for style/color/variable names), hex conversion, ColorScheme property mapping, and OpenType feature-to-Flutter `FontFeature` mapping (with default-on feature filtering).
- `src/ui.html` — Single-file plugin UI with inline JS. Two buttons trigger generation; results display in a `<pre>` block with copy-to-clipboard.

**Data flow:** UI button click → `postMessage` to plugin sandbox → `main.ts` handler calls generator → generator reads Figma API → returns Dart code string → `postMessage` back to UI → displayed in code block.

## Important Conventions

- Generated Dart code uses `const TextStyle(fontFamily: '...')` constructors designed for bundled variable fonts (not the `google_fonts` package).
- Text styles use Dart 3 dot notation for enums (e.g., `.w400`, `.normal`, `.none`).
- Line height is converted to Flutter's `height` multiplier with up to 4 decimal places of precision, and correctly handles both PIXELS and PERCENT units from Figma.
- Letter spacing values are rounded to 4 decimal places to strip IEEE 754 float artifacts from the Figma API.
- Non-default OpenType features from Figma are mapped to Flutter `FontFeature` constructors; default-on features (LIGA, KERN, CALT, etc.) are omitted unless explicitly disabled.
- Color variable names are prefixed with the Figma mode name (e.g., `lightSchemesPrimary`, `darkSchemesOnPrimary`).
- ColorScheme generation auto-maps Figma variable names to Material 3 `ColorScheme` properties by matching the last path segment.
- The `colorSchemePropertyOrder` array in `utils.ts` defines the canonical order of all supported ColorScheme properties.
