# VisualExplainer

> AI-powered code execution visualizer and explainer — right inside VS Code.

VisualExplainer is a VS Code extension that uses **Google Gemini** to help you understand code through two powerful modes:

1. **Explain Code** — adds clear inline comments to any selected code block without leaving your editor.
2. **Visualize Code** — runs an AI-powered execution trace, showing you exactly how variables change step-by-step, with a special **Loop Drill-Down** to walk through each iteration in plain English.

---

## Features

### ✨ Explain Code
Select any code (or place your cursor on a line), right-click, and choose **VisualExplainer: Explain Code**. Gemini adds inline comments directly into your code — no popups, no distractions.

### 🔍 Visualize Code
Select a block of code, right-click → **VisualExplainer: Visualize Code**. A panel opens showing:

- **Executing Line** — the current line being simulated
- **AI Explanation** — a markdown-rendered description of what's happening
- **Memory State** — all tracked variables and their values at that step
- **Step Navigation** — Prev / Next buttons + dot indicators to jump between steps

### 🔁 Loop Drill-Down
When a step's executing line contains a loop (`for`, `while`, `forEach`, etc.), a **Drill into Loop** button appears. Click it to open the **Loop Visualizer** modal, which narrates every iteration in plain English:

> *"In iteration 1, `index` is 0 and the element from the array is `"apple"`, so the condition evaluates to true and the body runs, setting `result` to `"APPLE"`."*

### 🔧 Code Lens & Hover
The extension automatically shows:
- **Code Lens** — an *✨ Explain Function* link above every function declaration
- **Hover** — a quick *Explain this line* action when hovering over complex lines

---

## Setup

### 1. Install the extension

Clone / open this repo in VS Code, then press **F5** to launch the Extension Development Host.  
*(Once published, install directly from the VS Code Marketplace.)*

### 2. Add your Gemini API Key

1. Open **Settings** (`Ctrl+,`)
2. Search for `VisualExplainer`
3. Paste your key into **Gemini Api Key**

Get a free key at [Google AI Studio](https://aistudio.google.com/app/apikey).

---

## Supported Languages

`JavaScript` · `TypeScript` · `Python` · `Java` · `C#` · `C++` · `Go`

---

## Project Structure

```
visualExplainer/
├── src/                    # Extension host (Node.js / VS Code API)
│   ├── extension.ts        # Entry point, command registration
│   ├── LLMService.ts       # Gemini API calls (explain, visualize, loop iterations)
│   ├── VisualizerPanel.ts  # Webview panel lifecycle + message bridge
│   └── providers.ts        # Hover & CodeLens providers
│
└── webview-ui/             # React + Tailwind UI (runs inside the VS Code panel)
    └── src/
        ├── App.tsx                       # Main layout, step navigation
        └── components/
            ├── MarkdownRenderer.tsx      # Renders AI markdown output
            ├── LoopVisualizer.tsx        # Loop iteration modal
            └── Loader.tsx                # Spinner
```

---

## Development

```bash
# Compile the extension (watch mode)
npm run watch

# Build the webview UI
cd webview-ui && npm run build

# Press F5 in VS Code to launch the Extension Development Host
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Extension host | TypeScript, VS Code Extension API |
| AI | Google Gemini (`gemini-2.5-flash`) via `@google/generative-ai` |
| Webview UI | React 18, Tailwind CSS, Vite |

---

## License

MIT
