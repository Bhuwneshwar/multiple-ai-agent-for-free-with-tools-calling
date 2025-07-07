//

import express, { Request, Response } from "express";
import dotenv from "dotenv";
import { log } from "console";
import { exec } from "child_process";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const port = 3000;

app.use(express.json());

const messages: any[] = [];

const tools: any = [
  {
    name: "controlLight",
    parameters: {
      type: Type.OBJECT,
      description: "Set the brightness and color temperature of a room light.",
      properties: {
        brightness: {
          type: Type.NUMBER,
          description: "Light level from 0 to 100.",
        },
        colorTemperature: {
          type: Type.STRING,
          description: "Can be `daylight`, `cool`, or `warm`.",
        },
      },
      required: ["brightness", "colorTemperature"],
    },
  },
  {
    name: "executeCommand",
    parameters: {
      type: Type.OBJECT,
      description: "Execute a batch command on the windows.",
      properties: {
        command: {
          type: Type.STRING,
          description: "batch command to execute",
        },
      },
      required: ["command"],
    },
  },
  {
    name: "allContacts",
    description: "Retrieve all contacts from the phone's contact list.",
  },

  {
    name: "callPhone",
    parameters: {
      type: Type.OBJECT,
      description: "Make a phone call to a contact.",
      properties: {
        contactName: {
          type: Type.STRING,
          description: "Name of the contact to call.",
        },
      },
      required: ["contactName"],
    },
  },
  {
    name: "sendWhatsAppMessage",
    parameters: {
      type: Type.OBJECT,
      description: "Send a WhatsApp message to a contact.",
      properties: {
        contactNumber: {
          type: Type.STRING,
          description: "Number of the contact to send the message to.",
        },
        message: {
          type: Type.STRING,
          description: "The message content to send.",
        },
      },
      required: ["contactNumber", "message"],
    },
  },
  {
    name: "sendEmail",
    parameters: {
      type: Type.OBJECT,
      description: "Send an email to a recipient.",
      properties: {
        to: {
          type: Type.STRING,
          description: "Email address of the recipient.",
        },
        subject: {
          type: Type.STRING,
          description: "Subject of the email.",
        },
        body: {
          type: Type.STRING,
          description: "Body content of the email.",
        },
      },
      required: ["to", "subject", "body"],
    },
  },
  {
    name: "turnScreenOff",
    parameters: {
      type: Type.OBJECT,
      description:
        "Turn off the screen of the Android phone (no parameters needed).",
      properties: {},
    },
  },
  {
    name: "playMusic",
    parameters: {
      type: Type.OBJECT,
      description: "Play music on the Android phone (no parameters needed).",
      properties: {},
    },
  },
];

const controlLight = (params: {
  brightness: number;
  colorTemperature: string;
}) => {
  return "Executing controlLight with parameters: " + JSON.stringify(params);
};
const allContacts = () => {
  // Simulate fetching contacts
  return [
    { name: "bikram bhaya", phone: "123-456-7890" },
    { name: "hemant", phone: "987-654-3210" },
    { name: "suraj", phone: "555-555-5555" },
  ];
};
const callPhone = (params: { contactName: string }) => {
  return `Calling ${params.contactName}...`;
};
const sendWhatsAppMessage = (params: {
  contactNumber: string;
  message: string;
}) => {
  return `Sending WhatsApp message to ${params.contactNumber}: "${params.message}"`;
};
const sendEmail = (params: { to: string; subject: string; body: string }) => {
  return `Sending email to ${params.to} with subject "${params.subject}" and body "${params.body}"`;
};
const turnScreenOff = () => {
  return "Turning off the screen...";
};
const playMusic = () => {
  return "Playing music...";
};

const executeCommand = ({ command }: { command: string }) => {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing command: ${error.message}`);
        return reject(`Error: ${error.message}`);
      } else {
        console.log(`Command output: ${stdout}`);
        resolve(`stdout: ${stdout}\n stderr: ${stderr}`);
      }
    });
  });
};

const availableTools: any = {
  controlLight,
  callPhone,
  sendWhatsAppMessage,
  sendEmail,
  turnScreenOff,
  playMusic,
  allContacts,
  executeCommand,
};

const modelCall = async () => {
  try {
    log("Messages before model call:", JSON.stringify(messages, null, 2));
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: messages,
      config: {
        temperature: 1.5,
        systemInstruction: [
          {
            text: `
You are a powerful AI assistant that helps users perform actions on their Android phone.

You can control various phone functions like making calls, sending WhatsApp messages, sending emails, turning off the screen, and playing music.

Your job is to:
- Clearly understand the user's intention.
- Call the correct tool with accurate and minimal parameters.
- Never guess parameters like phone numbers or emails; always confirm or ask if missing.
- If a tool is not needed (e.g., answering general questions), reply directly.

Be natural and helpful in your tone. Only use a tool when necessary.

### Available tools:
${JSON.stringify(tools, null, 2)}

Examples:
- "Call mom" → callPhone({ contactName: "mom" })
- "Send 'I'm on the way' to John on WhatsApp" → sendWhatsAppMessage({ contactName: "John", message: "I'm on the way" })
- "Email boss the meeting notes" → sendEmail({ to: "boss@example.com", subject: "Meeting Notes", body: "..." })
- "Turn off the screen" → turnScreenOff({})
- "Play some music" → playMusic({})
`,
          },
        ],
        tools: [{ functionDeclarations: tools }],
      },
    });

    console.log(response.text);
    console.log(response.functionCalls);

    return response;
  } catch (error: any) {
    console.error("Error during model call:", error.message);
    throw new Error("Failed to call AI model: " + error.message);
  }
};

app.post("/ask", async (req: Request, res: Response) => {
  try {
    const question = req.body.question;

    if (!question) {
      res.status(400).json({ error: "Missing question in request body." });
      return;
    }

    // Add user message to the conversation history
    messages.push({
      role: "user",
      parts: [{ text: question }],
    });

    let finalAnswer = null;
    let maxIterations = 5; // Limit the number of iterations to prevent infinite loops

    while (maxIterations-- > 0) {
      const response = await modelCall();

      messages.push({
        role: "model",
        parts: [
          { text: response.text || JSON.stringify(response.functionCalls) },
        ],
      });

      if (response.functionCalls && response.functionCalls.length > 0) {
        //     // response.tool_calls.forEach(async (toolCall) => {

        const toolCall = response.functionCalls[0];
        const functionName = toolCall.name;
        const functionArgs = toolCall.args;
        log("Tool call detected:", { functionName }, { functionArgs });
        const toolResponse = await availableTools[functionName || ""](
          functionArgs
        );
        log("Tool response:", toolResponse);
        if (toolResponse) {
          messages.push({
            role: "user",
            // toolResponse: toolResponse,
            parts: [{ text: JSON.stringify(toolResponse) }],
            // tool_call_id: response.functionCalls[0].id,
          });
        }
        // log("history", { messages });
        // });
        // console.log("Messages updated:", messages);
      } else {
        // messages.push({
        //   role: "model",
        //   parts: [{ text: response.text }],
        // });
        finalAnswer = response.text;
        break;
      }
    }
    if (finalAnswer) {
      res.json({ finalAnswer });
    } else {
      res.status(500).json({ error: "No final answer returned." });
    }
  } catch (err) {
    console.error("Error from AI model:", err);
    res.status(500).json({ error: "Failed to get response from AI." });
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
