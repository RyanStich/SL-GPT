// Import the required dependencies
require("dotenv").config();
const OpenAI = require("openai");
const express = require('express');
const cors = require('cors');
const readline = require("readline").createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Create an OpenAI connection
const secretKey = process.env.OPEN_AI_KEY;
const openai = new OpenAI({
  apiKey: secretKey,
});

const uploadedFileId = 'file-pbFHxNimDOZbfY11xjw0Mliv';

// Create an Express app
const app = express();
app.use(cors());
app.use(express.json());

// Endpoint to handle chat requests from the frontend
app.post('/letschat', async (req, res) => {
    try {
        const { messages } = req.body;

        // Create an assistant
        const assistant = await openai.beta.assistants.create({
          name: "Metis Cultural Wellness Expert",
          instructions: "You are a personal tutor who is trained on the knowledge of Metis Cultural Wellness. Prepare to write and run code to answer questions regarding this subject",
          tools: [{ type: "code_interpreter" }],
          model: "gpt-4-1106-preview",
          file_ids: [uploadedFileId],
        });

        // Create a thread
        const thread = await openai.beta.threads.create();

        // Add user's message to the thread
        for (const message of messages) {
          await openai.beta.threads.messages.create(thread.id, {
            role: message.role,
            content: message.content,
          });
        }

        // Run the assistant
        const run = await openai.beta.threads.runs.create(thread.id, {
          assistant_id: assistant.id,
        });

        // Retrieve the run status
        let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);

        // Polling mechanism to check if runStatus is completed
        while (runStatus.status !== "completed") {
          await new Promise((resolve) => setTimeout(resolve, 2000));
          runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
        }

        // Get the assistant's response
        const messagesResponse = await openai.beta.threads.messages.list(thread.id);
        const assistantResponse = messagesResponse.data.filter(
          (message) => message.role === "assistant"
        );

        // Send back the assistant's response
        res.status(200).json({ responses: assistantResponse });
    } catch (error) {
        console.error(error);
        res.status(500).send("An error occurred");
    }
});

// Start the server
const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server listening on port ${port}`));

