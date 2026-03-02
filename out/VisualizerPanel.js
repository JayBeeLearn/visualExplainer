"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VisualizerPanel = void 0;
const vscode = require("vscode");
class VisualizerPanel {
    static currentPanel;
    _panel;
    _extensionUri;
    _llmService;
    _disposables = [];
    constructor(panel, extensionUri, llmService) {
        this._panel = panel;
        this._extensionUri = extensionUri;
        this._llmService = llmService;
        this._update();
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        // Handle messages from the webview
        this._panel.webview.onDidReceiveMessage(async (message) => {
            if (message.command === "loopVisualize") {
                const { triggerLine, fullCode } = message;
                try {
                    const languageId = vscode.window.activeTextEditor?.document.languageId ?? "javascript";
                    const data = await this._llmService.getLoopIterations(fullCode, languageId, triggerLine);
                    this._panel.webview.postMessage({ command: "loopData", data });
                }
                catch (err) {
                    this._panel.webview.postMessage({
                        command: "loopError",
                        message: err.message ?? "Failed to generate loop visualization.",
                    });
                }
            }
        }, null, this._disposables);
    }
    static createOrShow(extensionUri, llmService, column) {
        const targetColumn = column ?? vscode.window.activeTextEditor?.viewColumn;
        // If we already have a panel, show it.
        if (VisualizerPanel.currentPanel) {
            VisualizerPanel.currentPanel._panel.reveal(targetColumn);
            return;
        }
        // Otherwise, create a new panel.
        const panel = vscode.window.createWebviewPanel("visualExplainer", "Code Visualizer", targetColumn || vscode.ViewColumn.One, {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.joinPath(extensionUri, "webview-ui", "build"),
            ],
        });
        VisualizerPanel.currentPanel = new VisualizerPanel(panel, extensionUri, llmService);
    }
    static sendVisualizeData(data, fullCode = "") {
        if (VisualizerPanel.currentPanel) {
            VisualizerPanel.currentPanel._panel.webview.postMessage({
                command: "visualize",
                data,
                fullCode,
            });
        }
    }
    dispose() {
        VisualizerPanel.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }
    _update() {
        const webview = this._panel.webview;
        this._panel.title = "Code Visualizer";
        this._panel.webview.html = this._getHtmlForWebview(webview);
    }
    _getHtmlForWebview(webview) {
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "webview-ui", "build", "assets", "index.js"));
        const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "webview-ui", "build", "assets", "index.css"));
        return `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; script-src ${webview.cspSource};">
        <link href="${styleUri}" rel="stylesheet">
        <title>Code Visualizer</title>
      </head>
      <body>
        <div id="root"></div>
        <script type="module" src="${scriptUri}"></script>
      </body>
      </html>`;
    }
}
exports.VisualizerPanel = VisualizerPanel;
//# sourceMappingURL=VisualizerPanel.js.map