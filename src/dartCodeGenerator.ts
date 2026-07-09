async function generateTextStyles(): Promise<string> {
    try {
        const textStyles = await figma.getLocalTextStylesAsync();
        if (textStyles.length === 0) {
            return "No defined textstyles";
        }
        let dartCode = "import 'package:flutter/material.dart';\n\n";

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

                    dartCode += `  static const Color ${varName} = Color(0x${hexColor});\n`;

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

            const brightness = modeName === 'dark' ? '.dark' : '.light';
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


// Derives a platform-neutral kebab-case token from a variable name.
// "Green/11" -> "green-11", "Sage/2" -> "sage-2", "Colors/Amber/3" -> "colors-amber-3",
// "On Primary" -> "on-primary". Each platform builder maps it to its own form
// (Flutter AppColors.green11, web bg-green-11 / var(--green-11)).
function tokenFromVariableName(name: string): string {
    return name
        .replace(/([a-z0-9])([A-Z])/g, '$1-$2') // split camelCase boundaries
        .replace(/[^a-zA-Z0-9]+/g, '-')         // separators (/, space, _) -> hyphen
        .toLowerCase()
        .replace(/^-+|-+$/g, '')                // trim leading/trailing hyphens
        .replace(/-+/g, '-');                   // collapse repeats
}

// Sends a progress line to the UI so long runs show a live status.
function reportManifestProgress(message: string): void {
    figma.ui.postMessage({ type: 'manifest-progress', message });
}

// Walks every page and returns the distinct set of variable-alias ids bound on
// any node. This is the exact set of ids a consumer REST dump of this file can
// reference. The walk is ITERATIVE and yields to the event loop every few
// thousand nodes so Figma stays responsive on huge files (100k+ nodes).
async function collectAllBoundVariableIds(): Promise<string[]> {
    await figma.loadAllPagesAsync();
    const set = new Set<string>();
    const stack: SceneNode[] = [];
    for (const page of figma.root.children) {
        for (const child of page.children) stack.push(child);
    }
    let scanned = 0;
    while (stack.length > 0) {
        const node = stack.pop()!;
        scanned++;
        for (const id of extractBoundVarIds(node)) set.add(id);
        if ('children' in node) {
            const children = (node as ChildrenMixin).children;
            for (let i = 0; i < children.length; i++) stack.push(children[i] as SceneNode);
        }
        if (scanned % 4000 === 0) {
            reportManifestProgress(`Scanning nodes… ${scanned} (${set.size} variables found)`);
            await new Promise<void>(resolve => setTimeout(resolve, 0)); // yield: keep Figma responsive
        }
    }
    return Array.from(set);
}

// Produces the flat .figma/variables.json resolution manifest, ready to commit:
//   { "<key>": "<kebab-token>", ... }   (bare string values, no debug)
// It RESOLVES every bound variable id with getVariableByIdAsync — which resolves
// both local variables and subscribed-library variables referenced in-file, even
// when the library is not import-enabled. Keys are the builder-normalized id, so
// the pipeline lookup matches exactly:
//   key = aliasId.replace(/^VariableID:/,"").split("/")[0];  manifest[key]
//   subscribed VariableID:<key>/<suffix> -> <key>;  flat VariableID:<localId> -> <localId>
async function generateVariableManifest(): Promise<string> {
    try {
        const manifest: Record<string, string> = {};

        // 1) Collect every bound variable id (yields to keep Figma responsive).
        reportManifestProgress('Loading pages…');
        const boundIds = await collectAllBoundVariableIds();

        // 2) Resolve each id in batches, reporting progress between batches.
        const BATCH = 100;
        for (let i = 0; i < boundIds.length; i += BATCH) {
            const batch = boundIds.slice(i, i + BATCH);
            const resolved = await Promise.all(batch.map(async id => {
                try { return { id, v: await figma.variables.getVariableByIdAsync(id) }; }
                catch (e) { return { id, v: null as Variable | null }; }
            }));
            for (const { id, v } of resolved) {
                if (!v || v.resolvedType !== 'COLOR') continue;
                const token = tokenFromVariableName(v.name);
                manifest[id.replace(/^VariableID:/, '').split('/')[0]] = token; // builder lookup key
                if (v.key) manifest[v.key] = token;                            // stable published key
            }
            reportManifestProgress(`Resolving variables… ${Math.min(i + BATCH, boundIds.length)}/${boundIds.length}`);
        }

        // 3) Also include local color variables not bound to any node.
        reportManifestProgress('Adding local variables…');
        const localVars = await figma.variables.getLocalVariablesAsync('COLOR');
        for (const v of localVars) {
            const token = tokenFromVariableName(v.name);
            if (v.key) manifest[v.key] = token;
            manifest[v.id.replace(/^VariableID:/, '')] = token;
        }

        if (Object.keys(manifest).length === 0) return 'No color variables found';
        return JSON.stringify(manifest, null, 2);
    } catch (error) {
        console.error('An error occurred:', error);
        return 'Error: ' + (error instanceof Error ? error.message : String(error));
    }
}


// Collects every VARIABLE_ALIAS id bound on a node, across all boundVariables
// fields (fills, strokes, effects, sizing, radii, componentProperties, …).
// boundVariables values are either a single {type,id}, an array of them, or a
// nested map (component properties), so we handle all three shapes.
function extractBoundVarIds(node: SceneNode): string[] {
    const bv = (node as any).boundVariables;
    if (!bv) return [];
    const ids: string[] = [];
    const push = (v: any) => {
        if (v && v.type === 'VARIABLE_ALIAS' && typeof v.id === 'string') ids.push(v.id);
    };
    for (const field of Object.keys(bv)) {
        const val = bv[field];
        if (Array.isArray(val)) {
            val.forEach(push);
        } else if (val && val.type === 'VARIABLE_ALIAS') {
            push(val);
        } else if (val && typeof val === 'object') {
            for (const k of Object.keys(val)) push(val[k]);
        }
    }
    return ids;
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


