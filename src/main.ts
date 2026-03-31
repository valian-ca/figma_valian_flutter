if (figma.editorType === 'figma' || figma.editorType === 'dev') {
    figma.showUI(__html__, { width: 600, height: 600 });

    let watchNodeIds: string[] = [];
    let watchTimer: ReturnType<typeof setInterval> | null = null;
    let lastResultJson = '';

    function startWatchPolling() {
        if (watchTimer !== null) clearInterval(watchTimer);
        watchTimer = setInterval(async () => {
            if (watchNodeIds.length === 0) return;
            const result = await checkDesignByIds(watchNodeIds);
            const json = JSON.stringify(result);
            if (json !== lastResultJson) {
                lastResultJson = json;
                figma.ui.postMessage({ type: 'design-check-result', result });
            }
        }, 2000);
    }

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

        if (msg.type === 'start-watch') {
            const selection = figma.currentPage.selection;
            if (selection.length === 0) {
                figma.ui.postMessage({
                    type: 'watch-error',
                    error: 'No frames selected. Select one or more frames first.',
                });
                return;
            }
            // Stop any existing watch before starting a new one
            if (watchTimer !== null) {
                clearInterval(watchTimer);
            }
            watchNodeIds = selection.map(n => n.id);
            const watchNodes = selection.map(n => ({ id: n.id, name: n.name }));
            figma.ui.postMessage({ type: 'watch-started', watchNodes });
            const result = await checkDesign();
            lastResultJson = JSON.stringify(result);
            figma.ui.postMessage({ type: 'design-check-result', result });
            startWatchPolling();
        }

        if (msg.type === 'stop-watch') {
            watchNodeIds = [];
            lastResultJson = '';
            if (watchTimer !== null) {
                clearInterval(watchTimer);
                watchTimer = null;
            }
            figma.ui.postMessage({ type: 'watch-stopped' });
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
