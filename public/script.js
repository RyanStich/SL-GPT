// Add styles for the messages
var styleEl = document.createElement('style');
styleEl.textContent = `
  .message { padding: 5px; margin-bottom: 5px; border-radius: 5px; }
  .user { align-self: flex-end; background-color: #dcf8c6; }
  .bot { align-self: flex-start; background-color: #ebebeb; }
`;
document.head.appendChild(styleEl);

// Function to add messages to chat box
function addMessageToChatBox(sender, message) {
  var chatBox = document.getElementById('chat-box');
  var messageDiv = document.createElement('div');
  messageDiv.classList.add('message', sender);
  messageDiv.textContent = message;
  chatBox.appendChild(messageDiv);

  // Scroll to the bottom of the chat box
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Function to send message to server and receive response
function sendMessageToServer(message) {
  // Display user's message
  addMessageToChatBox('user', message);

  // Send the message to the server and get the response
  fetch('http://127.0.0.1:5000/letschat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: [{ role: 'user', content: message }] })
  })
  .then(response => response.json())
  .then(data => {
    // Assuming the data.responses contains the array of responses from the chatbot
    if (data.responses && data.responses.length > 0) {
      // Display bot's message
      console.log(data)
      var lastResponse = data.responses[0].content[0].text.value;
      addMessageToChatBox('bot', lastResponse.trim());
    }
  })
  .catch(error => {
    console.error('Error:', error);
    // Handle error case, for example, by displaying a message to the user
  });
}

// Event listener for sending messages on button click
document.getElementById('send-btn').addEventListener('click', function() {
  var messageInput = document.getElementById('message-input');
  var message = messageInput.value;
  messageInput.value = ''; // Clear the input field

  if (message.trim() !== '') {
    sendMessageToServer(message); // Send the message to the server and display response
  }
});
