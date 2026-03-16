// Infers Dart fontWeight from Figma fontStyle string.
// Order matters: check more specific names (e.g. "ExtraBold") before
// substrings they contain (e.g. "Bold").
function inferFontWeightFromStyle(fontStyle: string): number {
    const s = fontStyle.toLowerCase();

    if (s.includes('thin') || s.includes('hairline')) return 100;
    if (s.includes('extralight') || s.includes('extra light') || s.includes('ultralight') || s.includes('ultra light')) return 200;
    if (s.includes('light')) return 300;
    if (s.includes('medium')) return 500;
    if (s.includes('semibold') || s.includes('semi bold') || s.includes('demibold') || s.includes('demi bold')) return 600;
    if (s.includes('extrabold') || s.includes('extra bold') || s.includes('ultrabold') || s.includes('ultra bold')) return 800;
    if (s.includes('black') || s.includes('heavy')) return 900;
    if (s.includes('bold')) return 700;

    return 400; // Regular / Normal / default
}

// Infers Dart fontStyle from Figma fontStyle
function inferFontStyleFromStyle(fontStyle: string): string {
    const s = fontStyle.toLowerCase();
    if (s.includes('italic')) return 'FontStyle.italic';
    if (s.includes('oblique')) return 'FontStyle.italic'; // Dart doesn't support 'oblique'
    return 'FontStyle.normal'; // Default style
}

// Maps Figma text decorations to Dart's TextDecoration enum
function mapTextDecorationToDart(decoration: string): string {
    const map: Record<string, string> = {
        'none': 'TextDecoration.none',
        'underline': 'TextDecoration.underline',
        'overline': 'TextDecoration.overline',
        'line-through': 'TextDecoration.lineThrough',
    };
    return map.hasOwnProperty(decoration.toLowerCase()) ? map[decoration.toLowerCase()] : 'TextDecoration.none';
}

function formatColorName(name: string, index: number): string {
    if (!name) return `color${index}`; // or any default name you prefer
    const words = name
        .replace(/[^a-zA-Z0-9 ]/g, ' ') // Remove all non-alphanumeric characters and replace with space
        .trim() // Remove leading and trailing spaces
        .split(/\s+/); // Split by one or more spaces
    return words.map((word, index) => index === 0 ? word.toLowerCase() : capitalizeFirstLetter(word)).join('');
}


function extractTextStyleProperties(style: any) {
    let letterSpacing = 0; // Default value
    const fontSize = style.fontSize;

    // Check if letterSpacing is in pixels or percent and convert accordingly
    if (style.letterSpacing) {
        if (style.letterSpacing.unit === 'PIXELS') {
            letterSpacing = style.letterSpacing.value; // Use pixel value directly
        } else if (style.letterSpacing.unit === 'PERCENT') {
            // Convert percentage to pixels based on the fontSize
            letterSpacing = (style.letterSpacing.value * fontSize) / 100;
        }
    }

    return {
        fontSize: style.fontSize,
        fontStyle: inferFontStyleFromStyle(style.fontName.style),
        fontWeight: inferFontWeightFromStyle(style.fontName.style),
        decoration: style.textDecoration,
        letterSpacing: letterSpacing || 0,
        fontFamily: style.fontName.family,
        lineHeightUnit: style.lineHeight?.unit ?? 'AUTO',
        lineHeightValue: style.lineHeight?.unit !== 'AUTO' ? style.lineHeight.value : 'null',
        textDecoration: mapTextDecorationToDart(style.textDecoration),
        fontFeatures: extractFontFeatures(style.openTypeFeatures),
    };
}

// Format style name
function formatStyleName(name: string, index: number): string {
    if (!name) return `textStyle${index}`;
    const words = name
        .replace(/[^a-zA-Z0-9 ]/g, ' ') // Remove all non-alphanumeric characters and replace with space
        .trim() // Remove leading and trailing spaces
        .split(/\s+/); // Split by one or more spaces
    return words.map((word, index) => index === 0 ? word.toLowerCase() : capitalizeFirstLetter(word)).join('');
}

function toHex(channel: number): string {
    return padStart(Math.floor(channel * 255).toString(16), 2, '0');
}

function padStart(str: string, maxLength: number, fillString: string = ' '): string {
    if (str.length >= maxLength) {
        return str;
    }
    return Array(maxLength - str.length + 1).join(fillString) + str;
}

function capitalizeFirstLetter(string: string) {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}

// Converts a Figma font family name to a GoogleFonts method call.
// e.g. "Archivo" → "GoogleFonts.archivo", "Open Sans" → "GoogleFonts.openSans"
function fontFamilyToGoogleFontsMethod(fontFamily: string): string {
    const words = fontFamily.trim().split(/\s+/);
    const methodName = words
        .map((w, i) => i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join('');
    return `GoogleFonts.${methodName}`;
}

// Converts mode name + variable name to a Dart variable name.
// e.g. ("Light", "Schemes/Primary") → "lightSchemesPrimary"
// e.g. ("Dark", "Schemes/On Primary") → "darkSchemesOnPrimary"
function formatColorVariableName(modeName: string, variableName: string): string {
    const modeWords = modeName.trim().split(/\s+/);
    const modePart = modeWords.map((w: string, i: number) =>
        i === 0 ? w.toLowerCase() : capitalizeFirstLetter(w)
    ).join('');
    const nameParts: string[] = [];
    variableName.split('/').forEach((part: string) => {
        part.trim().split(/\s+/).forEach((w: string) => nameParts.push(w));
    });
    const namePart = nameParts.map((w: string) => capitalizeFirstLetter(w)).join('');
    return modePart + namePart;
}

// Maps a Figma variable name (e.g. "Schemes/On Primary") to its Flutter
// ColorScheme property name (e.g. "onPrimary"). Returns the camelCase name
// for any variable; the caller checks whether it's a known ColorScheme property.
function variableNameToColorSchemeProperty(variableName: string): string {
    const lastSlash = variableName.lastIndexOf('/');
    const propertyPart = lastSlash >= 0 ? variableName.substring(lastSlash + 1) : variableName;
    const words = propertyPart.trim().split(/\s+/);
    const camelCase = words.map((w, i) =>
        i === 0 ? w.toLowerCase() : capitalizeFirstLetter(w)
    ).join('');

    const specialMappings: Record<string, string> = {
        'inverseOnSurface': 'onInverseSurface',
    };
    return specialMappings[camelCase] || camelCase;
}

// OpenType features enabled by default in HarfBuzz/Flutter — skip when true.
// Only emit code when these are explicitly *disabled* (non-default state).
const defaultOnFeatures = new Set([
    'LIGA', 'CLIG', 'CALT', 'KERN', 'RCLT', 'RLIG', 'CCMP', 'LOCL',
    'MARK', 'MKMK', 'RVRN',
]);

// Maps a Figma OpenType feature tag + enabled state to a Flutter FontFeature constructor string.
// Returns null when the feature is in its default state (no code needed).
function openTypeFeatureToDart(tag: string, enabled: boolean): string | null {
    const t = tag.toUpperCase();

    // Default-on features: only emit when explicitly disabled
    if (defaultOnFeatures.has(t)) {
        return enabled ? null : `FontFeature.disable('${tag.toLowerCase()}')`;
    }
    // Non-default features: only emit when explicitly enabled
    if (!enabled) return null;

    // Stylistic sets SS01–SS20
    const ssMatch = t.match(/^SS(\d{2})$/);
    if (ssMatch) return `FontFeature.stylisticSet(${parseInt(ssMatch[1])})`;

    // Character variants CV01–CV99
    const cvMatch = t.match(/^CV(\d{2,})$/);
    if (cvMatch) return `FontFeature.characterVariant(${parseInt(cvMatch[1])})`;

    // Named constructors for features that have them in Flutter
    const namedConstructors: Record<string, string> = {
        'AFRC': 'FontFeature.alternativeFractions()',
        'CASE': 'FontFeature.caseSensitiveForms()',
        'DNOM': 'FontFeature.denominator()',
        'HIST': 'FontFeature.historicalForms()',
        'HLIG': 'FontFeature.historicalLigatures()',
        'NALT': 'FontFeature.notationalForms(1)',
        'NUMR': 'FontFeature.numerators()',
        'ORDN': 'FontFeature.ordinalForms()',
        'RAND': 'FontFeature.randomize()',
        'SINF': 'FontFeature.scientificInferiors()',
        'ZERO': 'FontFeature.slashedZero()',
        'SALT': 'FontFeature.stylisticAlternates()',
        'SWSH': 'FontFeature.swash(1)',
        'AALT': 'FontFeature.alternative(1)',
    };
    if (namedConstructors[t]) return namedConstructors[t];

    // Everything else: generic enable
    return `FontFeature.enable('${tag.toLowerCase()}')`;
}

// Extracts non-default OpenType features from a Figma style and returns
// an array of Flutter FontFeature constructor strings.
function extractFontFeatures(openTypeFeatures: Record<string, boolean> | undefined): string[] {
    if (!openTypeFeatures) return [];
    const features: string[] = [];
    const keys = Object.keys(openTypeFeatures);
    for (let i = 0; i < keys.length; i++) {
        const tag = keys[i];
        const dart = openTypeFeatureToDart(tag, openTypeFeatures[tag]);
        if (dart) features.push(dart);
    }
    return features;
}

const colorSchemePropertyOrder = [
    'primary', 'onPrimary', 'primaryContainer', 'onPrimaryContainer',
    'primaryFixed', 'primaryFixedDim', 'onPrimaryFixed', 'onPrimaryFixedVariant',
    'secondary', 'onSecondary', 'secondaryContainer', 'onSecondaryContainer',
    'secondaryFixed', 'secondaryFixedDim', 'onSecondaryFixed', 'onSecondaryFixedVariant',
    'tertiary', 'onTertiary', 'tertiaryContainer', 'onTertiaryContainer',
    'tertiaryFixed', 'tertiaryFixedDim', 'onTertiaryFixed', 'onTertiaryFixedVariant',
    'error', 'onError', 'errorContainer', 'onErrorContainer',
    'surface', 'onSurface', 'surfaceDim', 'surfaceBright',
    'surfaceContainerLowest', 'surfaceContainerLow', 'surfaceContainer',
    'surfaceContainerHigh', 'surfaceContainerHighest',
    'onSurfaceVariant', 'outline', 'outlineVariant', 'shadow', 'scrim',
    'inverseSurface', 'onInverseSurface', 'inversePrimary', 'surfaceTint',
];