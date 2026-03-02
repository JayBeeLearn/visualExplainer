"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExplainerCodeLensProvider = exports.ExplainerHoverProvider = void 0;
const vscode = require("vscode");
class ExplainerHoverProvider {
    llmService;
    constructor(llmService) {
        this.llmService = llmService;
    }
    async provideHover(document, position, token) {
        if (!this.llmService.isConfigured())
            return null;
        const line = document.lineAt(position.line).text;
        // Quick heuristic: Only hover if the line looks complex (e.g. contains regex or long lambda)
        if (line.length < 30 && !line.includes('=>') && !line.includes('/')) {
            return null;
        }
        const markdown = new vscode.MarkdownString();
        markdown.isTrusted = true;
        markdown.appendMarkdown('✨ **VisualExplainer**\\n\\n');
        markdown.appendMarkdown('[Explain this line](command:visualExplainer.explainSelection)');
        return new vscode.Hover(markdown);
    }
}
exports.ExplainerHoverProvider = ExplainerHoverProvider;
class ExplainerCodeLensProvider {
    _onDidChangeCodeLenses = new vscode.EventEmitter();
    onDidChangeCodeLenses = this._onDidChangeCodeLenses.event;
    provideCodeLenses(document, token) {
        const codeLenses = [];
        const text = document.getText();
        // Very basic regex to find function declarations in JS/TS/Python
        const regex = /(?:function|def)\s+([a-zA-Z0-9_]+)\s*\(|const\s+([a-zA-Z0-9_]+)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[a-zA-Z0-9_]+)\s*=>/g;
        let match;
        while ((match = regex.exec(text)) !== null) {
            const line = document.positionAt(match.index).line;
            const range = new vscode.Range(line, 0, line, match[0].length);
            const cmd = {
                title: "✨ Explain Function",
                tooltip: "VisualExplainer: Explain what this function does",
                command: "visualExplainer.explainSelection",
                arguments: []
            };
            codeLenses.push(new vscode.CodeLens(range, cmd));
        }
        return codeLenses;
    }
}
exports.ExplainerCodeLensProvider = ExplainerCodeLensProvider;
//# sourceMappingURL=providers.js.map