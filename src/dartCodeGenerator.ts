async function generateTextStyles(): Promise<string> {
    try {
        const textStyles = await figma.getLocalTextStylesAsync();
        if (textStyles.length === 0) {
            return "No defined textstyles";
        }
        let dartCode = "import 'package:flutter/material.dart';\nimport 'package:google_fonts/google_fonts.dart';\n\n";

        dartCode += "// ignore: avoid_classes_with_only_static_members\nabstract class AppTextStyles {\n";
        textStyles.forEach((style, index) => {
            const formattedStyleName = formatStyleName(style.name, index);
            const {
                fontSize,
                fontStyle,
                fontWeight,
                textDecoration,
                letterSpacing,
                fontFamily,
                lineHeightUnit,
                lineHeightValue,
                fontFeatures
            } = extractTextStyleProperties(style);

            dartCode += generateTextStyleDartCode(
                formattedStyleName,
                { fontSize, fontStyle, fontWeight, textDecoration, letterSpacing, fontFamily, lineHeightUnit, lineHeightValue, fontFeatures },
            );
        });

        dartCode += "}\n\n";

        // Generate TextTheme mapping
        const themeSlots = [
            'displayLarge', 'displayMedium', 'displaySmall',
            'headlineLarge', 'headlineMedium', 'headlineSmall',
            'titleLarge', 'titleMedium', 'titleSmall',
            'bodyLarge', 'bodyMedium', 'bodySmall',
            'labelLarge', 'labelMedium', 'labelSmall',
        ];

        const styleNames = textStyles.map((style, index) => formatStyleName(style.name, index));

        // Match each theme slot to a generated style by checking if the style name ends with the slot name (case-insensitive)
        const mappings: { slot: string; styleName: string }[] = [];
        for (const slot of themeSlots) {
            const match = styleNames.find(name => name.toLowerCase().endsWith(slot.toLowerCase()));
            if (match) {
                mappings.push({ slot, styleName: match });
            }
        }

        if (mappings.length > 0) {
            dartCode += "const textTheme = TextTheme(\n";
            mappings.forEach(({ slot, styleName }) => {
                dartCode += `  ${slot}: AppTextStyles.${styleName},\n`;
            });
            dartCode += ");\n";
        }

        return dartCode;
    } catch (error) {
        console.error('An error occurred:', error);
        return '';
    }
}


async function resolveColorValue(value: any, modeId: string, depth: number = 0): Promise<RGBA | null> {
    if (depth > 10 || !value) return null;

    if (value.type === 'VARIABLE_ALIAS') {
        const refVar = await figma.variables.getVariableByIdAsync(value.id);
        if (!refVar) return null;
        const refValue = refVar.valuesByMode[modeId];
        if (refValue) {
            return resolveColorValue(refValue, modeId, depth + 1);
        }
        // Fallback: try the first available mode
        const firstModeId = Object.keys(refVar.valuesByMode)[0];
        if (firstModeId) {
            return resolveColorValue(refVar.valuesByMode[firstModeId], modeId, depth + 1);
        }
        return null;
    }

    if (typeof value.r === 'number' && typeof value.g === 'number' && typeof value.b === 'number') {
        return { r: value.r, g: value.g, b: value.b, a: value.a ?? 1 };
    }

    return null;
}

async function generateColors(): Promise<string> {
    try {
        const variables = await figma.variables.getLocalVariablesAsync('COLOR');
        const collections = await figma.variables.getLocalVariableCollectionsAsync();

        if (variables.length === 0) {
            return "No defined color variables";
        }

        let dartCode = "import 'package:flutter/material.dart';\n\n";
        dartCode += "final class AppMaterialTheme {\n";
        dartCode += "  const AppMaterialTheme._();\n\n";

        // Track colors for ColorScheme mapping: modeName → (colorSchemeProperty → classVarName)
        const modeColorMappings = new Map<string, Map<string, string>>();

        for (const collection of collections) {
            const collectionVars = variables.filter(v => v.variableCollectionId === collection.id);

            for (const mode of collection.modes) {
                const modeLower = mode.name.toLowerCase();
                if (!modeColorMappings.has(modeLower)) {
                    modeColorMappings.set(modeLower, new Map());
                }

                for (const variable of collectionVars) {
                    const rawValue = variable.valuesByMode[mode.modeId];
                    const color = await resolveColorValue(rawValue, mode.modeId);
                    if (!color) continue;

                    const hexColor = `${toHex(color.a)}${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`;
                    const varName = formatColorVariableName(mode.name, variable.name);

                    dartCode += `  /// ${variable.name} = Color(0x${hexColor})\n`;
                    dartCode += `  static const Color ${varName} = Color(0x${hexColor});\n\n`;

                    const schemeProp = variableNameToColorSchemeProperty(variable.name);
                    if (colorSchemePropertyOrder.indexOf(schemeProp) >= 0) {
                        modeColorMappings.get(modeLower)!.set(schemeProp, varName);
                    }
                }
            }
        }

        dartCode += "}\n\n";

        // Generate ColorScheme for each mode
        for (const [modeName, colorMap] of modeColorMappings) {
            if (colorMap.size === 0) continue;

            const brightness = modeName === 'dark' ? 'Brightness.dark' : 'Brightness.light';
            dartCode += `const ColorScheme ${modeName}ColorScheme = ColorScheme(\n`;
            dartCode += `  brightness: ${brightness},\n`;

            for (const prop of colorSchemePropertyOrder) {
                const varName = colorMap.get(prop);
                if (varName) {
                    dartCode += `  ${prop}: AppMaterialTheme.${varName},\n`;
                }
            }

            dartCode += ");\n\n";
        }

        return dartCode;
    } catch (error) {
        console.error('An error occurred:', error);
        return '';
    }
}


function generateTextStyleDartCode(
    styleName: string,
    { fontSize, fontStyle, fontWeight, textDecoration, letterSpacing, fontFamily, lineHeightUnit, lineHeightValue, fontFeatures }: any,
): string {
    let code = `  static const TextStyle ${styleName} = TextStyle(\n`;
    code += `    fontFamily: '${fontFamily}',\n`;
    code += `    fontSize: ${fontSize},\n`;
    code += `    fontWeight: .w${fontWeight},\n`;

    if (lineHeightValue !== 'null') {
        const height = lineHeightUnit === 'PERCENT'
            ? lineHeightValue / 100
            : lineHeightValue / fontSize;
        code += `    height: ${parseFloat(height.toFixed(4))},\n`;
    }

    if (letterSpacing != null && letterSpacing !== 'null' && letterSpacing !== 0) {
        code += `    letterSpacing: ${parseFloat(letterSpacing.toFixed(4))},\n`;
    }
    code += `    fontStyle: .${fontStyle.split('.')[1]},\n`;
    code += `    decoration: .${textDecoration.split('.')[1]},\n`;

    if (fontFeatures && fontFeatures.length > 0) {
        code += `    fontFeatures: [${fontFeatures.join(', ')}],\n`;
    }

    code += `  );\n\n`;

    return code;
}

function generateColorStyleDartCode(styleName: string, r: number, g: number, b: number, opacity: number = 1): string {
    // Convert color channels and opacity to hex format
    const a = padStart(Math.floor(opacity * 255).toString(16), 2, '0');
    const rHex = padStart(Math.floor(r * 255).toString(16), 2, '0');
    const gHex = padStart(Math.floor(g * 255).toString(16), 2, '0');
    const bHex = padStart(Math.floor(b * 255).toString(16), 2, '0');

    // Generate Dart code
    let code = `  static const Color ${styleName} = Color(0x${a}${rHex}${gHex}${bHex});\n\n`;

    return code;
}


