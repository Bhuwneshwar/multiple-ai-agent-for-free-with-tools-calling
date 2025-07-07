// import ollama from "ollama";

// export const start = async () => {
//   //   const response = await ollama.chat({
//   //     model: 'deepseek-r1:1.5b',
//   //     messages: [{ role: 'user', content: 'Why is the sky blue?' }],
//   //   });54
//   //   console.log(response.message.content);

//   const message = { role: "user", content: "Why is the sky blue?" };
//   const response = await ollama.chat({
//     model: "phi",
//     // ollama run qwen2:1.5b-instruct-q4_K_M
//     // ollama run phi3:mini
//     messages: [message],
//     stream: true,
//     // tools: [
//     //   {
//     //     type: "function",
//     //     function: {
//     //       name: "callPhone",
//     //       description: "Make a phone call to a given number.",
//     //       parameters: {
//     //         type: "object",
//     //         properties: {
//     //           // contactName: { type: "string", description: "Name of the contact" },
//     //           phoneNumber: {
//     //             type: "string",
//     //             description: "Phone number to call",
//     //           },
//     //         },
//     //         required: ["phoneNumber"],
//     //       },
//     //     },
//     //   },
//     // ],
//   });
//   let responseMessage = "";
//   for await (const part of response) {
//     process.stdout.write(part.message.content);
//     responseMessage += part.message.content;
//   }
//   return responseMessage;
// };

// start().catch((error) => {
//   console.error("Error during Ollama chat:", error);
//   process.exit(1);
// });

import express, { Request, Response } from "express";
import dotenv from "dotenv";
import ollama, { Tool } from "ollama";
import { log } from "console";
import { exec } from "child_process";

dotenv.config();

const app = express();
const port = 3000;

app.use(express.json());

const client = ollama;

const messages: any[] = [];

// const tools:Tool = [
//   {

//   }
// ];

// Mock function implementations
const callPhone = async (args: { phoneNumber: string }) => {
  log("Calling phone number:", args.phoneNumber);
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return `Phone call to ${args.phoneNumber} initiated successfully.`;
};

const sendWhatsAppMessage = async (args: {
  contactNumber: string;
  message: string;
}) => {
  log("Sending WhatsApp message to:", args.contactNumber);
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return `WhatsApp message sent to ${args.contactNumber}: "${args.message}"`;
};

const sendEmail = async (args: {
  to: string;
  subject: string;
  body: string;
}) => {
  log("Sending email to:", args.to);
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return `Email sent to ${args.to} with subject "${args.subject}" and body "${args.body}"`;
};

const turnScreenOff = async () => {
  log("Turning off the phone screen.");
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return "Phone screen turned off successfully.";
};

const playMusic = async () => {
  log("Playing music on the phone.");
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return "Music is now playing.";
};

const getAllContacts = async () => {
  log("Retrieving all contacts from the phone.");
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
  callPhone,
  sendWhatsAppMessage,
  sendEmail,
  turnScreenOff,
  playMusic,
  getAllContacts,
  executeCommand,
};

const modelCall = async () => {
  try {
    console.log(
      "Preparing to call Ollama model with messages:",
      JSON.stringify(messages, null, 2)
    );

    const response = await client.chat({
      model: "phi",
      // process.env["phi"] || "phi3:mini", // Default model, configurable via .env
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


Examples:
- "Call mom" → callPhone({ phoneNumber: "123-456-7890" })
- "Send 'I'm on the way' to John on WhatsApp" → sendWhatsAppMessage({ contactNumber: "987-654-3210", message: "I'm on the way" })
- "Email boss the meeting notes" → sendEmail({ to: "boss@example.com", subject: "Meeting Notes", body: "..." })
- "Turn off the screen" → turnScreenOff({})
- "Play some music" → playMusic({})
`,
        },
        ...messages,
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "getAllContacts",
            description: "Retrieve all contacts from the phone.",
          },
        },
      ],
      // stream: true,
    });
    // ${JSON.stringify(tools, null, 2)}

    // let responseMessage = "";
    // let response = { content: "", tool_calls: null };

    log("Ollama response received:", JSON.stringify(response));

    // log("Response from Ollama:", response);
    return response;
  } catch (error) {
    console.error("Error in model call:", error);
    throw new Error("Failed to get response from Ollama model");
  }
};

app.post("/ask", async (req: Request, res: Response) => {
  try {
    const question = req.body.question;

    if (!question) {
      res.status(400).json({ error: "Missing question in request body." });
      return;
    }

    messages.push({
      role: "user",
      content: question,
    });

    let finalAnswer = null;
    let maxIterations = 10;

    while (maxIterations-- > 0) {
      const response = await modelCall();

      messages.push({
        role: "assistant",
        content: response.message,
        tool_calls: response.message.tool_calls,
      });

      if (
        response.message.tool_calls &&
        response.message.tool_calls.length > 0
      ) {
        const toolCall = response.message.tool_calls[0];
        const functionName = toolCall.function.name;
        const functionArgs = toolCall.function.arguments;

        const toolResponse = await availableTools[functionName](functionArgs);

        messages.push({
          role: "tool",
          content: JSON.stringify(toolResponse),
          // tool_call_id: response.message.tool_calls[0].function.,
        });
      } else {
        finalAnswer = response.message.content;
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
