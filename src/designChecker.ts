interface ColorIssue {
    nodeId: string;
    nodeName: string;
    hex: string;
    property: 'fill' | 'stroke';
}

interface TextStyleIssue {
    nodeId: string;
    nodeName: string;
    fontFamily: string;
    fontSize: number;
    fontWeight: number;
    preview: string;
}

interface DesignCheckResult {
    status: 'CLEAN' | 'HAS ISSUES' | 'ERROR';
    nodesScanned: number;
    hardcodedColors: ColorIssue[];
    unboundTextStyles: TextStyleIssue[];
    error?: string;
}

function rgbaToHex(r: number, g: number, b: number): string {
    return '#' + [r, g, b].map(c =>
        padStart(Math.round(c * 255).toString(16), 2, '0')
    ).join('').toUpperCase();
}

function collectNodes(node: SceneNode): SceneNode[] {
    if (node.locked) return [];
    const nodes: SceneNode[] = [node];
    if ('children' in node) {
        for (const child of node.children) {
            nodes.push(...collectNodes(child));
        }
    }
    return nodes;
}

function checkColorsOnNode(node: SceneNode): ColorIssue[] {
    const issues: ColorIssue[] = [];

    if (!('fills' in node) && !('strokes' in node)) return issues;

    const fillBindings = node.boundVariables?.fills;
    if ('fills' in node && Array.isArray(node.fills)) {
        for (let i = 0; i < node.fills.length; i++) {
            const fill = node.fills[i];
            if (fill.type !== 'SOLID' || !fill.visible) continue;
            const isBound = fillBindings && fillBindings[i];
            if (!isBound) {
                issues.push({
                    nodeId: node.id,
                    nodeName: node.name,
                    hex: rgbaToHex(fill.color.r, fill.color.g, fill.color.b),
                    property: 'fill',
                });
            }
        }
    }

    const strokeBindings = node.boundVariables?.strokes;
    if ('strokes' in node && Array.isArray(node.strokes)) {
        for (let i = 0; i < node.strokes.length; i++) {
            const stroke = node.strokes[i];
            if (stroke.type !== 'SOLID' || !stroke.visible) continue;
            const isBound = strokeBindings && strokeBindings[i];
            if (!isBound) {
                issues.push({
                    nodeId: node.id,
                    nodeName: node.name,
                    hex: rgbaToHex(stroke.color.r, stroke.color.g, stroke.color.b),
                    property: 'stroke',
                });
            }
        }
    }

    return issues;
}

function checkTextStyleOnNode(node: SceneNode): TextStyleIssue | null {
    if (node.type !== 'TEXT') return null;

    const textNode = node as TextNode;
    if (textNode.textStyleId && textNode.textStyleId !== '' && textNode.textStyleId !== figma.mixed) {
        return null;
    }

    const fontName = textNode.fontName;
    const fontSize = textNode.fontSize;

    return {
        nodeId: node.id,
        nodeName: node.name,
        fontFamily: fontName === figma.mixed ? '(mixed)' : fontName.family,
        fontSize: fontSize === figma.mixed ? 0 : fontSize,
        fontWeight: fontName === figma.mixed ? 0 : inferFontWeightFromStyle(fontName.style),
        preview: textNode.characters.slice(0, 50),
    };
}

async function checkDesign(): Promise<DesignCheckResult> {
    const selection = figma.currentPage.selection;

    if (selection.length === 0) {
        return {
            status: 'ERROR',
            nodesScanned: 0,
            hardcodedColors: [],
            unboundTextStyles: [],
            error: 'No frames selected. Select one or more frames to check.',
        };
    }

    const allNodes: SceneNode[] = [];
    for (const selected of selection) {
        allNodes.push(...collectNodes(selected));
    }

    const hardcodedColors: ColorIssue[] = [];
    const unboundTextStyles: TextStyleIssue[] = [];

    for (const node of allNodes) {
        hardcodedColors.push(...checkColorsOnNode(node));
        const textIssue = checkTextStyleOnNode(node);
        if (textIssue) unboundTextStyles.push(textIssue);
    }

    const hasIssues = hardcodedColors.length > 0 || unboundTextStyles.length > 0;

    return {
        status: hasIssues ? 'HAS ISSUES' : 'CLEAN',
        nodesScanned: allNodes.length,
        hardcodedColors,
        unboundTextStyles,
    };
}
