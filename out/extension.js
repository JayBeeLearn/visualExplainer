"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = require("vscode");
const LLMService_1 = require("./LLMService");
const VisualizerPanel_1 = require("./VisualizerPanel");
const providers_1 = require("./providers");
function activate(context) {
    console.log('Congratulations, your extension "visual-explainer" is now active!');
    const llmService = new LLMService_1.LLMService();
    // Explainer Command
    let explainSelection = vscode.commands.registerCommand('visualExplainer.explainSelection', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active text editor found.');
            return;
        }
        if (!llmService.isConfigured()) {
            vscode.window.showErrorMessage('VisualExplainer: Please configure your Gemini API Key in the settings.');
            return;
        }
        const selection = editor.selection;
        let code = '';
        let replaceRange;
        if (selection.isEmpty) {
            // Get the current line
            const line = editor.document.lineAt(selection.active.line);
            code = line.text;
            replaceRange = line.range;
        }
        else {
            code = editor.document.getText(selection);
            replaceRange = new vscode.Range(selection.start, selection.end);
        }
        if (!code.trim()) {
            vscode.window.showInformationMessage('VisualExplainer: No code selected to explain.');
            return;
        }
        // Determine language
        const languageId = editor.document.languageId;
        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "VisualExplainer: Generating Code Explanation...",
            cancellable: false
        }, async () => {
            try {
                const explanation = await llmService.explainCode(code, languageId);
                const edit = new vscode.WorkspaceEdit();
                let formattedExplanation = explanation;
                // Remove markdown formatting if the LLM still wrapped it
                if (formattedExplanation.startsWith('```')) {
                    const lines = formattedExplanation.split('\n');
                    if (lines[0].startsWith('```')) {
                        lines.shift();
                    }
                    if (lines.length > 0 && lines[lines.length - 1].startsWith('```')) {
                        lines.pop();
                    }
                    formattedExplanation = lines.join('\n');
                }
                edit.replace(editor.document.uri, replaceRange, formattedExplanation);
                await vscode.workspace.applyEdit(edit);
            }
            catch (err) {
                vscode.window.showErrorMessage('VisualExplainer Error: ' + err.message);
            }
        });
    });
    // Visualizer Command
    let visualizeCode = vscode.commands.registerCommand('visualExplainer.visualizeCode', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active text editor found.');
            return;
        }
        if (!llmService.isConfigured()) {
            vscode.window.showErrorMessage('VisualExplainer: Please configure your Gemini API Key in the settings.');
            return;
        }
        const selection = editor.selection;
        let code = '';
        if (selection.isEmpty) {
            vscode.window.showInformationMessage('VisualExplainer: Please select a block of code (like a loop) to visualize.');
            return;
        }
        else {
            code = editor.document.getText(selection);
        }
        // Determine language
        const languageId = editor.document.languageId;
        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "VisualExplainer: Generating Code Visualization...",
            cancellable: false
        }, async () => {
            try {
                const traceData = await llmService.visualizeCode(code, languageId);
                // Show webview
                VisualizerPanel_1.VisualizerPanel.createOrShow(context.extensionUri, llmService);
                // Send data (with fullCode so the webview can use it for loop drill-down)
                setTimeout(() => {
                    VisualizerPanel_1.VisualizerPanel.sendVisualizeData(traceData, code);
                }, 1000); // Give webview a moment to load
            }
            catch (err) {
                vscode.window.showErrorMessage('VisualExplainer Error: ' + err.message);
            }
        });
    });
    // Register Providers
    context.subscriptions.push(vscode.languages.registerHoverProvider(['javascript', 'typescript', 'python', 'java', 'csharp', 'cpp', 'go'], new providers_1.ExplainerHoverProvider(llmService)));
    context.subscriptions.push(vscode.languages.registerCodeLensProvider(['javascript', 'typescript', 'python', 'java', 'csharp', 'cpp', 'go'], new providers_1.ExplainerCodeLensProvider()));
    context.subscriptions.push(explainSelection);
    context.subscriptions.push(visualizeCode);
}
function deactivate() { }
//# sourceMappingURL=extension.js.map