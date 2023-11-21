require("dotenv").config();
const OpenAI = require("openai");
const express = require('express');
const cors = require('cors');
const path = require('path');


const secretKey = process.env.OPEN_AI_KEY;
const openai = new OpenAI({
  apiKey: secretKey,
});

const uploadedFileId = 'file-pbFHxNimDOZbfY11xjw0Mliv';

let assistantId = null;
let threadId = null;

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

async function getOrCreateAssistant() {
  if (!assistantId) {
    try {
      const assistant = await openai.beta.assistants.create({
        name: "Metis Cultural Wellness Expert",
        instructions: "You are a personal tutor who is trained on the knowledge of Metis Cultural Wellness. Prepare to write and run code to answer questions regarding this subject",
        tools: [{ type: "code_interpreter" }],
        model: "gpt-4-1106-preview",
        file_ids: [uploadedFileId],
      });
      console.log(assistant); // Check the structure of the returned assistant object
      assistantId = assistant.id; // Assuming the 'id' is directly on the assistant object
    } catch (error) {
      console.error('Error creating assistant:', error);
      throw error; // Rethrow the error to be caught by the calling function
    }
  }
  return assistantId;
}

async function getOrCreateThread() {
  if (!threadId) {
    try {
      const thread = await openai.beta.threads.create();
      console.log(thread); // Check the structure of the returned thread object
      threadId = thread.id; // Update this to the correct path based on the logged object structure
    } catch (error) {
      console.error('Error creating thread:', error);
      throw error; // Rethrow the error to be caught by the calling function
    }
  }
  return threadId;
}


app.post('/letschat', async (req, res) => {
    try {
        const { messages } = req.body;
        const assistant_id = await getOrCreateAssistant();
        const thread_id = await getOrCreateThread();

        for (const message of messages) {
          await openai.beta.threads.messages.create(thread_id, {
            role: message.role,
            content: message.content,
          });
        }

        const run = await openai.beta.threads.runs.create(thread_id, {
          assistant_id: assistant_id,
        });

        let runStatus = await openai.beta.threads.runs.retrieve(thread_id, run.id);

        while (runStatus.status !== "completed") {
          await new Promise((resolve) => setTimeout(resolve, 2000));
          runStatus = await openai.beta.threads.runs.retrieve(thread_id, run.id);
        }

        const messagesResponse = await openai.beta.threads.messages.list(thread_id);
        const assistantResponse = messagesResponse.data.filter(
          (message) => message.role === "assistant"
        );

        res.status(200).json({ responses: assistantResponse });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "An error occurred", details: error.message });
    }
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "An internal server error occurred", details: err.message });
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server listening on port ${port}`));
