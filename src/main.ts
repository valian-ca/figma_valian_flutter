if (figma.editorType === 'figma' || figma.editorType === 'dev') {
    figma.showUI(__html__, { width: 600, height: 600 });

    figma.ui.onmessage = async msg => {
        if (msg.type === 'generate-textstyles') {
            let dartCode = await generateTextStyles();
            figma.ui.postMessage({ type: 'dart-code', code: dartCode });
        }

        if (msg.type === 'generate-colors') {
            let dartCode = await generateColors();
            figma.ui.postMessage({ type: 'dart-code', code: dartCode });
        }

        if (msg.type === 'design-check') {
            const result = await checkDesign();
            figma.ui.postMessage({ type: 'design-check-result', result });
        }

        if (msg.type === 'select-node') {
            const node = await figma.getNodeByIdAsync(msg.nodeId);
            if (node && node.type !== 'DOCUMENT' && node.type !== 'PAGE') {
                figma.currentPage.selection = [node as SceneNode];
                figma.viewport.scrollAndZoomIntoView([node as SceneNode]);
            }
        }

    };
}
