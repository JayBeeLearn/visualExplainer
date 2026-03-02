import * as vscode from 'vscode';
import { LLMService } from './LLMService';

export class ExplainerHoverProvider implements vscode.HoverProvider {
  constructor(private llmService: LLMService) {}

  public async provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): Promise<vscode.Hover | null> {
    if (!this.llmService.isConfigured()) return null;

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

export class ExplainerCodeLensProvider implements vscode.CodeLensProvider {
  private _onDidChangeCodeLenses: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
  public readonly onDidChangeCodeLenses: vscode.Event<void> = this._onDidChangeCodeLenses.event;

  public provideCodeLenses(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ): vscode.CodeLens[] | Thenable<vscode.CodeLens[]> {
    const codeLenses: vscode.CodeLens[] = [];
    const text = document.getText();
    
    // Very basic regex to find function declarations in JS/TS/Python
    const regex = /(?:function|def)\s+([a-zA-Z0-9_]+)\s*\(|const\s+([a-zA-Z0-9_]+)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[a-zA-Z0-9_]+)\s*=>/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
      const line = document.positionAt(match.index).line;
      const range = new vscode.Range(line, 0, line, match[0].length);
      
      const cmd: vscode.Command = {
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
