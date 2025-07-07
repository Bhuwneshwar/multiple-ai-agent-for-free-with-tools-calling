import express, { Request, Response } from "express";
import { exec } from "node:child_process";
import { Groq } from "groq-sdk";
import bodyParser from "body-parser";
import { ChatCompletionTool } from "groq-sdk/resources/chat/completions";
import dotenv from "dotenv";
import { log } from "console";
// import { promises } from "node:dns";
// Load environment variables from .env file
dotenv.config();

const app = express();
const port = 3000;

// Initialize Grok client (ensure API key is set in environment variables)
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Middleware
app.use(bodyParser.json());

// Interface for request body
interface QuestionRequest {
  question: string;
}

// Define tools (example: get_weather function)
const tools: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "getAllContacts",
      description: "Retrieve all contacts from the phone.",
    },
  },
  {
    type: "function",
    function: {
      name: "callPhone",
      description: "Make a phone call to a given number.",
      parameters: {
        type: "object",
        properties: {
          // contactName: { type: "string", description: "Name of the contact" },
          phoneNumber: { type: "string", description: "Phone number to call" },
        },
        required: ["phoneNumber"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "sendWhatsAppMessage",
      description: "Send a WhatsApp message to a contact.",
      parameters: {
        type: "object",
        properties: {
          contactNumber: {
            type: "string",
            description: "Number of the WhatsApp contact",
          },
          message: { type: "string", description: "Message content to send" },
        },
        required: ["contactNumber", "message"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "sendEmail",
      description: "Send an email to someone.",
      parameters: {
        type: "object",
        properties: {
          to: { type: "string", description: "Recipient's email address" },
          subject: { type: "string", description: "Email subject" },
          body: { type: "string", description: "Email body content" },
        },
        required: ["to", "subject", "body"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "turnScreenOff",
      description: "Turn off the phone screen.",
    },
  },
  {
    type: "function",
    function: {
      name: "playMusic",
      description: "Play music on the phone.",
    },
  },
  {
    type: "function",
    function: {
      name: "executeCommand",
      description: "Execute a batch command on the windows.",
      parameters: {
        type: "object",
        properties: {
          command: {
            type: "string",
            description: "batch command to execute",
          },
        },
        required: ["command"],
      },
    },
  },

  // Add more tools as needed
];

// Mock function to simulate getting weather data
const callPhone = async (args: { phoneNumber: string }) => {
  log("Calling phone number:", args.phoneNumber);
  // Simulate a delay for the phone call
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return `Phone call to ${args.phoneNumber} initiated successfully.`;
};
const sendWhatsAppMessage = async (args: {
  contactNumber: string;
  message: string;
}) => {
  log("Sending WhatsApp message to:", args.contactNumber);
  // Simulate a delay for sending the message
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return `WhatsApp message sent to ${args.contactNumber}: "${args.message}"`;
};
const sendEmail = async (args: {
  to: string;
  subject: string;
  body: string;
}) => {
  log("Sending email to:", args.to);
  // Simulate a delay for sending the email
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return `Email sent to ${args.to} with subject "${args.subject}" and body "${args.body}"`;
};
const turnScreenOff = async () => {
  log("Turning off the phone screen.");
  // Simulate a delay for turning off the screen
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return "Phone screen turned off successfully.";
};
const playMusic = async () => {
  log("Playing music on the phone.");
  // Simulate a delay for playing music
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return "Music is now playing.";
};
const getAllContacts = async () => {
  log("Retrieving all contacts from the phone.");
  // Simulate a delay for retrieving contacts
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return [
    { name: "hemant", phoneNumber: "123-456-7890" },
    { name: "ujjwal", phoneNumber: "987-654-3210" },
    { name: "bikram", phoneNumber: "555-555-5555" },
  ];
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
  callPhone: callPhone,
  sendWhatsAppMessage: sendWhatsAppMessage,
  sendEmail: sendEmail,
  turnScreenOff: turnScreenOff,
  playMusic: playMusic,
  getAllContacts: getAllContacts,
  executeCommand: executeCommand, // Add the command execution tool

  // Add more tool functions as needed
};

const messages: any[] = [];

const modelCall = async () => {
  try {
    console.log(
      "Preparing to call Groq model with messages:",
      JSON.stringify(messages, null, 2)
    );

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `
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
        ...messages,
      ],
      model: "llama-3.3-70b-versatile", // Specify the model to use
      // temperature: 1,
      // max_completion_tokens: 1024,
      // top_p: 1,
      tools, // Include tools in the request
      // tool_choice: "auto", // Let the model decide whether to use a tool
    });

    const response = chatCompletion.choices[0].message;
    log("Response from Groq:", response);

    return response;
  } catch (error) {
    console.error("Error in model call:", error);
    throw new Error("Failed to get response from Groq model");
  }
};

// POST endpoint to handle questions with tool calling
app.post(
  "/ask",
  async (req: Request<{}, {}, QuestionRequest>, res: Response) => {
    try {
      const { question } = req.body;
      // log("Received question:", question);

      if (!question) {
        res.status(400).json({ error: "Question is required" });
        return;
      }

      // Add user message to the conversation history
      messages.push({
        role: "user",
        content: question,
      });

      let finalAnswer = null;
      let maxIterations = 10;

      while (maxIterations-- > 0) {
        const response = await modelCall();
        // log("Response from Groq:", response);

        messages.push({
          ...response,
        });
        // console.log("Messages updated:", messages);

        if (response.tool_calls && response.tool_calls.length > 0) {
          // response.tool_calls.forEach(async (toolCall) => {
          const toolCall = response.tool_calls[0];
          const functionName = toolCall.function.name;
          const functionArgs = JSON.parse(toolCall.function.arguments);
          // log("Tool call detected:", { functionName }, { functionArgs });

          const toolResponse = await availableTools[functionName](functionArgs);
          // log("Tool response:", toolResponse);
          // if (toolResponse) {
          messages.push({
            role: "tool",
            // toolResponse: toolResponse,
            content: JSON.stringify(toolResponse),
            tool_call_id: toolCall.id,
          });
          // }
          // log("history", { messages });
          // });
          // console.log("Messages updated:", messages);
        } else {
          finalAnswer = response.content;
          break;
        }
      }
      if (finalAnswer) {
        res.json({ finalAnswer });
      } else {
        res.status(500).json({ error: "No final answer returned." });
      }
    } catch (error) {
      console.error("Error processing question:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
