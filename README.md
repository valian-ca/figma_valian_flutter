<p align="center">
  <a href="https://www.figma.com/community-free-resource-license/"><img src="https://img.shields.io/badge/figma-community_license-brightgreen?style=flat-square&logo=figma"></a>
  <a href="https://github.com/mastersam07/figdart/graphs/commit-activity"><img src="https://img.shields.io/badge/Maintained%3F-Yes-success.svg?style=flat-square"></a>
  <a href="https://github.com/mastersam07/figdart/pulls"><img src="https://img.shields.io/badge/PRs-Welcome-brightgreen.svg?style=flat-square"></a>
  <a href="https://twitter.com/intent/tweet?text=Figdart%20is%20awesome.%20I%20use%20it%20to%20generate%20flutter%20styling%20properties%20from%20figma.%20https://github.com/mastersam07/figdart"><img src="https://img.shields.io/badge/Twitter-Tweet-success?style=flat-square&logo=x"></a>
</p>



<p align="center"><img src="./publish/icon.png" align="center" alt="FigDart logo" width="128" height="128"></p>
  
<h1 align="center">Figma Styles to Flutter</h1>

<div align="center">
<a href="https://www.figma.com/community/plugin/1282135889870206898/FigDart" align="center"><img src="publish/install_button.png" align="center" alt="Install Plugin"></a>
</div>

<br />

<img src="publish/demo.gif" align="center" alt="Figdart demo" />


## The Problem

When it comes to translating styles like textstyles and colors, there are a couple of problems that could arise. Some includes:

- Manually converting Figma text styles to Flutter code
- Greater risk of inconsistencies appearing in text styles between the design files and the coded application
- Manually converting styles often results in code duplication
- Manual conversion can lead to errors such as incorrect values, typos, or even omitted styles, which can be costly to debug and fix
- Every time a designer updates a text style in Figma, developers have to manually update the corresponding code, which is both time-consuming and error-prone

## Solution

By automating the conversion process, FigDart aims to eliminate these issues, making the design-to-code workflow more efficient, accurate, and consistent.

### Editor Mode
<img src="publish/editor_mode.gif" align="center" alt="How the plugin works in editor mode" />


### Dev Mode on View Only Access
<img src="publish/dev_mode.gif" align="center" alt="How the plugin works in dev mode" />

## Generated Output

### Text Styles

Generated text styles use plain `const TextStyle` constructors with `fontFamily` references, designed for use with **bundled variable fonts** for maximum fidelity with Figma designs:

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

- Line height is precisely converted to Flutter's `height` multiplier (up to 4 decimal places)
- Letter spacing handles both pixel and percentage units from Figma
- Non-default OpenType features are mapped to Flutter `FontFeature` constructors
- A `TextTheme` mapping is auto-generated matching style names to Material 3 theme slots

### Color Variables

Color variables are extracted with alias resolution (up to 10 levels deep) and mapped to Material 3 `ColorScheme` instances per Figma mode.

## Recommended Flutter Setup

For best results, bundle variable font files (download from Google Fonts) and wrap your app with `DefaultTextHeightBehavior` to match Figma's leading distribution:

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
