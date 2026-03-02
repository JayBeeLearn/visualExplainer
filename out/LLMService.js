"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LLMService = void 0;
const vscode = require("vscode");
const generative_ai_1 = require("@google/generative-ai");
class LLMService {
    genAI;
    model;
    constructor() {
        this.initialize();
        // Listen for configuration changes to update the API key if the user changes it
        vscode.workspace.onDidChangeConfiguration((e) => {
            if (e.affectsConfiguration("visualExplainer.geminiApiKey")) {
                this.initialize();
            }
        });
    }
    initialize() {
        const config = vscode.workspace.getConfiguration("visualExplainer");
        const apiKey = config.get("geminiApiKey") ||
            process.env.GEMINI_API_KEY ||
            "";
        if (apiKey) {
            this.genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
            // Use standard text model
            this.model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        }
        else {
            this.genAI = undefined;
            this.model = undefined;
        }
    }
    isConfigured() {
        return !!this.model;
    }
    /**
     * Prompts Gemini to explain a given code block.
     */
    async explainCode(code, language) {
        if (!this.model) {
            throw new Error("Gemini API key is not configured.");
        }
        const prompt = `
You are an expert developer. Add clear and concise inline comments to the following ${language} code to explain what it does.
Return the ENTIRE updated code block with your comments added. 
Absolutely do not include markdown formatting like \`\`\`${language} or any conversational filler. Return ONLY the raw code with comments.

Code to explain:
${code}
`;
        try {
            const result = await this.model.generateContent(prompt);
            return result.response.text().trim();
        }
        catch (error) {
            console.error("LLMService Error:", error);
            throw new Error("Failed to generate explanation from Gemini API.");
        }
    }
    /**
     * Prompts Gemini to perform a desk-check/execution trace for visualization.
     */
    async visualizeCode(code, language) {
        if (!this.model) {
            throw new Error("Gemini API key is not configured.");
        }
        const prompt = `
You are an expert developer and a code execution simulator.
Perform a desk-check for the following ${language} code. 
1. Come up with minimal, realistic sample data for any unknown variables.
2. Step through the execution for a maximum of 5 to 7 key iterations or steps. Do not over-explain or create too many steps for simple loops. Focus on the most important state changes.
3. Output the step-by-step state of variables in STRICT JSON FORMAT.

The JSON should be an array of objects, where each object represents a step and contains:
- "step": number
- "line": string (the line of code being executed)
- "variables": object (keys are variable names, values are their stringified values)
- "explanation": string (very brief description of what happened)

Return ONLY valid JSON. No markdown blocks, no conversational text.

Code to visualize:
${code}
`;
        try {
            const result = await this.model.generateContent(prompt);
            let text = result.response.text().trim();
            // Cleanup markdown artifacts if any
            if (text.startsWith("\`\`\`json")) {
                text = text.replace(/^\`\`\`json\n/, "").replace(/\n\`\`\`$/, "");
            }
            else if (text.startsWith("\`\`\`")) {
                text = text.replace(/^\`\`\`\n/, "").replace(/\n\`\`\`$/, "");
            }
            return JSON.parse(text);
        }
        catch (error) {
            console.error("LLMService Error:", error);
            throw new Error("Failed to generate visualization trace from Gemini API. Output was likely not valid JSON.");
        }
    }
    /**
     * Prompts Gemini to simulate a loop iteration-by-iteration with natural language explanations.
     * Each iteration gets a conversational narrative: "In iteration 1, index is 0 and the element
     * from the array is 'apple', so the condition evaluates to true and..."
     */
    async getLoopIterations(code, language, triggerLine) {
        if (!this.model) {
            throw new Error("Gemini API key is not configured.");
        }
        const prompt = `
You are an expert developer and patient teacher explaining code to a junior developer.
Simulate the execution of the loop on this line: \`${triggerLine}\`

Context (full code block):
\`\`\`${language}
${code}
\`\`\`

Instructions:
1. Choose realistic, illustrative sample data if no data is provided (e.g., an array like ["apple", "banana", "cherry"]).
2. Simulate at most 5 iterations (or fewer if the loop ends sooner).
3. For EACH iteration, write a warm, narrative explanation as if talking to a beginner — for example:
   "In iteration 1, \`index\` is 0 and the element from the array is \`"apple"\`, so the condition evaluates to true and the body runs, setting \`result\` to \`"APPLE"\`."
4. Also record the variable state at the END of that iteration.

Return ONLY a valid JSON array. No markdown fences, no extra text.
Each element must have:
- "iteration": number (1-based)
- "explanation": string (the narrative description described above — must be a full sentence in plain English)
- "variableState": object (keys = variable names, values = their stringified values at end of iteration)

Example output shape:
[
  {
    "iteration": 1,
    "explanation": "In iteration 1, \`i\` is 0 and the element from the array is \`\\"apple\\"\`, so the loop body runs and \`result\` is set to \`\\"APPLE\\"\`.",
    "variableState": { "i": "0", "element": "\\"apple\\"", "result": "\\"APPLE\\"" }
  }
]
`;
        try {
            const result = await this.model.generateContent(prompt);
            let text = result.response.text().trim();
            if (text.startsWith("\`\`\`json")) {
                text = text.replace(/^\`\`\`json\n/, "").replace(/\n\`\`\`$/, "");
            }
            else if (text.startsWith("\`\`\`")) {
                text = text.replace(/^\`\`\`\n/, "").replace(/\n\`\`\`$/, "");
            }
            return JSON.parse(text);
        }
        catch (error) {
            console.error("LLMService getLoopIterations Error:", error);
            throw new Error("Failed to generate loop iterations from Gemini API. Output was likely not valid JSON.");
        }
    }
}
exports.LLMService = LLMService;
//# sourceMappingURL=LLMService.js.map