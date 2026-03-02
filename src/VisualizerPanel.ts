import * as vscode from "vscode";
import { LLMService } from "./LLMService";

export class VisualizerPanel {
  public static currentPanel: VisualizerPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private readonly _llmService: LLMService;
  private _disposables: vscode.Disposable[] = [];

  private constructor(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    llmService: LLMService
  ) {
    this._panel = panel;
    this._extensionUri = extensionUri;
    this._llmService = llmService;

    this._update();
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    // Handle messages from the webview
    this._panel.webview.onDidReceiveMessage(
      async (message) => {
        if (message.command === "loopVisualize") {
          const { triggerLine, fullCode } = message;
          try {
            const languageId =
              vscode.window.activeTextEditor?.document.languageId ?? "javascript";
            const data = await this._llmService.getLoopIterations(
              fullCode,
              languageId,
              triggerLine
            );
            this._panel.webview.postMessage({ command: "loopData", data });
          } catch (err: any) {
            this._panel.webview.postMessage({
              command: "loopError",
              message: err.message ?? "Failed to generate loop visualization.",
            });
          }
        }
      },
      null,
      this._disposables
    );
  }

  public static createOrShow(
    extensionUri: vscode.Uri,
    llmService: LLMService,
    column?: vscode.ViewColumn
  ) {
    const targetColumn = column ?? vscode.window.activeTextEditor?.viewColumn;

    // If we already have a panel, show it.
    if (VisualizerPanel.currentPanel) {
      VisualizerPanel.currentPanel._panel.reveal(targetColumn);
      return;
    }

    // Otherwise, create a new panel.
    const panel = vscode.window.createWebviewPanel(
      "visualExplainer",
      "Code Visualizer",
      targetColumn || vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, "webview-ui", "build"),
        ],
      }
    );

    VisualizerPanel.currentPanel = new VisualizerPanel(
      panel,
      extensionUri,
      llmService
    );
  }

  public static sendVisualizeData(data: any, fullCode: string = "") {
    if (VisualizerPanel.currentPanel) {
      VisualizerPanel.currentPanel._panel.webview.postMessage({
        command: "visualize",
        data,
        fullCode,
      });
    }
  }

  public dispose() {
    VisualizerPanel.currentPanel = undefined;

    this._panel.dispose();

    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }

  private _update() {
    const webview = this._panel.webview;
    this._panel.title = "Code Visualizer";
    this._panel.webview.html = this._getHtmlForWebview(webview);
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this._extensionUri,
        "webview-ui",
        "build",
        "assets",
        "index.js"
      )
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this._extensionUri,
        "webview-ui",
        "build",
        "assets",
        "index.css"
      )
    );

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
