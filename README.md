# Figma VALIAN Flutter

A Figma plugin that generates Flutter/Dart code from Figma design tokens. It extracts text styles and color variables from a Figma file and outputs ready-to-use Dart code with `const TextStyle` constructors (designed for bundled variable fonts) and Material 3 `ColorScheme` mappings.

## Features

### Generate TextStyles

Reads all local text styles from the Figma file and produces an `AppTextStyles` class with `const TextStyle` constructors:

```dart
static const TextStyle titleMedium = TextStyle(
    fontFamily: 'Archivo',
    fontSize: 16,
    fontWeight: .w500,
    height: 1.375,
    letterSpacing: 0.15,
    fontStyle: .normal,
    decoration: .none,
  );
```

- Uses `fontFamily` references for bundled variable fonts (not `google_fonts`)
- Line height precisely converted to Flutter's `height` multiplier (up to 4 decimal places)
- Handles both PIXELS and PERCENT line height units from Figma
- Letter spacing rounded to 4 decimal places to strip IEEE 754 float artifacts
- Non-default OpenType features mapped to Flutter `FontFeature` constructors
- Auto-generates a `TextTheme` mapping matching style names to Material 3 theme slots

### Generate Colors

Reads color variables (not paint styles) and produces an `AppMaterialTheme` class with per-mode `ColorScheme` instances:

- Resolves variable aliases recursively (up to 10 levels deep)
- Produces `static const Color` constants prefixed with the Figma mode name (e.g. `lightSchemesPrimary`, `darkSchemesOnPrimary`)
- Auto-maps variable names to Material 3 `ColorScheme` properties by matching the last path segment
- Generates a complete `ColorScheme` per mode

### Check Design

Inspects selected frames for design quality issues before developer handoff:

- Detects hardcoded (unbound) fill and stroke colors
- Detects text nodes not using a shared text style
- Results link directly to offending nodes in Figma for quick fixes

## Installation

This plugin is distributed as a development plugin.

1. Download `plugin.zip` from the [latest release](../../releases/latest)
2. Extract the zip into any folder
3. In Figma, go to **Plugins > Development > Import plugin from manifest...**
4. Select the `manifest.json` file from the extracted folder

## Recommended Flutter Setup

For best results, bundle variable font files and wrap your app with `DefaultTextHeightBehavior` to match Figma's leading distribution:

```yaml
# pubspec.yaml
fonts:
  - family: Archivo
    fonts:
      - asset: assets/fonts/Archivo-VariableFont_wdth,wght.ttf
      - asset: assets/fonts/Archivo-Italic-VariableFont_wdth,wght.ttf
        style: italic
```

```dart
DefaultTextHeightBehavior(
  textHeightBehavior: const TextHeightBehavior(
    leadingDistribution: TextLeadingDistribution.even,
    applyHeightToFirstAscent: false,
    applyHeightToLastDescent: false,
  ),
  child: MaterialApp(/* ... */),
)
```

## Development

```bash
npm install
npm run build    # compile to dist/
npm run watch    # rebuild on changes
```

The build outputs `dist/main.js` and copies `src/ui.html` to `dist/ui.html`. The root `manifest.json` references these paths for local development.

## Credits

Forked from [FigDart](https://github.com/Mastersam07/figdart) by Samuel Abada.
