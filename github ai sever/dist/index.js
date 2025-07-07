"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const openai_1 = __importDefault(require("openai"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = 3000;
app.use(express_1.default.json());
const client = new openai_1.default({
    baseURL: "https://models.github.ai/inference",
    apiKey: process.env["GITHUB_TOKEN"],
});
app.post("/ask", async (req, res) => {
    const userQuestion = req.body.question;
    if (!userQuestion) {
        res.status(400).json({ error: "Missing question in request body." });
        return;
    }
    try {
        const response = await client.chat.completions.create({
            messages: [
                { role: "system", content: "You are a helpful assistant." },
                { role: "user", content: userQuestion },
            ],
            temperature: 1.0,
            top_p: 1.0,
            model: "gpt-4",
        });
        const message = response.choices[0].message.content;
        res.json({ answer: message });
    }
    catch (err) {
        console.error("Error from AI model:", err);
        res.status(500).json({ error: "Failed to get response from AI." });
    }
});
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
