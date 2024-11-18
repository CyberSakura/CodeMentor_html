document.addEventListener('DOMContentLoaded', async () => {
  // Chat functionality
  const chatWindow = document.getElementById('chat-window');
  const chatInput = document.getElementById('chat-input');
  const sendButton = document.getElementById('send-button');
  const chatHistoryContainer = document.getElementById('chat-history');
  const newConversationIcon = document.getElementById('new-conversation-icon');

  // Global Variables
  let currentlySelectedBlock = null;
  let activeConversationId = null;

  // const startNewConversation = () => {
  //   // Save the current conversation
  //   const chatMessages = Array.from(chatWindow.children).map((msg) => ({
  //     text: msg.textContent,
  //     type: msg.classList.contains('user-message') ? 'user' : 'bot',
  //   }));
  //
  //   if (chatMessages.length > 0) {
  //     // Create a summary of the current conversation for history
  //     const userMessage = chatMessages.find((msg) => msg.type === 'user')?.text || 'No User Message';
  //     const botResponse = chatMessages.find((msg) => msg.type === 'bot')?.text || 'No Bot Response';
  //
  //     // Add the summary to the chat history
  //     addHistoryItem(userMessage, botResponse);
  //   }
  //
  //   // Clear the chat window for a new conversation
  //   chatWindow.innerHTML = '';
  // };
  //
  // newConversationButton.addEventListener('click', startNewConversation);

  const addMessage = (message, type, simulateTyping = false) => {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('chat-message', type === 'user' ? 'user-message' : 'bot-message');
    messageDiv.textContent = message;
    chatWindow.appendChild(messageDiv);


    const hasCode = message.includes('```');

    if(simulateTyping){
      let currentIndex = 0;
      const typingText = hasCode ? message.replace(/```/g, '') : message;
      messageDiv.textContent = '';

      const typingInterval = setInterval(() => {
        messageDiv.textContent += typingText[currentIndex];
        currentIndex++;

        if(currentIndex === typingText.length){
          clearInterval(typingInterval);
          if (hasCode) formatCodeBlock(messageDiv, message);
        }

        chatWindow.scrollTop = chatWindow.scrollHeight;
      }, 20);
    }else if(hasCode){
      formatCodeBlock(messageDiv, message);
    }else{
      messageDiv.textContent = message;
    }
    chatWindow.scrollTop = chatWindow.scrollHeight;
  };

  const formatCodeBlock = (messageDiv, message) => {
    const [beforeCode, code, afterCode] = message.split(/```/); // Split the message into text and code parts
    messageDiv.innerHTML = `
    <div>${beforeCode.trim()}</div>
    <pre><code>${code.trim()}</code></pre>
    <div>${afterCode ? afterCode.trim() : ''}</div>
  `;
  };

  const switchToConversation = (conversationId) => {
    activeConversationId = conversationId;
    loadChatHistory(conversationId);
  }

  const startNewConversation = () => {
    activeConversationId = null; // Reset the conversation ID to indicate a new conversation
    chatWindow.innerHTML = ''; // Clear the chat window
    console.log('Started a new conversation');
  };

  if (newConversationIcon) {
    newConversationIcon.addEventListener('click', startNewConversation);
  }

  const newConversationButton = document.getElementById('new-conversation-button');
  if (newConversationButton) {
    newConversationButton.addEventListener('click', startNewConversation);
  }

  const addHistoryItem = (summary, conversationId) => {
    const historyDiv = document.createElement('div');
    historyDiv.classList.add('chat-history-item');

    // const userMessageDiv = document.createElement('p');
    // userMessageDiv.textContent = `User: ${userMessage}`;
    // userMessageDiv.style.fontWeight = 'bold';
    //
    // const botResponseDiv = document.createElement('p');
    // botResponseDiv.textContent = `Assistant: ${botResponse}`;

    const summaryDiv = document.createElement('p');
    summaryDiv.textContent = summary;
    summaryDiv.style.fontWeight = 'bold';

    historyDiv.appendChild(summaryDiv);

    // historyDiv.appendChild(userMessageDiv);
    // historyDiv.appendChild(botResponseDiv);

    historyDiv.addEventListener('click', () => {
      if(currentlySelectedBlock){
        currentlySelectedBlock.classList.remove('selected');
      }

      currentlySelectedBlock = historyDiv;
      historyDiv.classList.add('selected');
      loadCurrentConversation(conversationId)

      // loadConversationToChatWindow(userMessage, botResponse);
    });

    chatHistoryContainer.appendChild(historyDiv);
  }

  const loadChatHistory = async () => {
    try {
      const response = await fetch('/chat-history');
      if (response.ok) {
        const history = await response.json();
        chatHistoryContainer.innerHTML = ''; // Clear previous history

        history.forEach(({ conversation_id, summary }) => {
          addHistoryItem(summary, conversation_id);
        });
      } else {
        console.error('Failed to fetch chat history.');
      }
    } catch (error) {
      console.error('Error fetching chat history:', error);
    }
  };

  const loadCurrentConversation = async (conversationId) => {
    try {
      const response = await fetch(`/chat-history?conversation_id=${conversationId}`);
      if (response.ok) {
        const messages = await response.json();
        chatWindow.innerHTML = '';

        messages.forEach(({ user_message, bot_response }) => {
          addMessage(user_message, 'user');
          addMessage(bot_response, 'bot');
        });

        activeConversationId = conversationId;
      } else {
        console.error('Failed to load current conversation.');
      }
    } catch (error) {
      console.error('Error loading current conversation:', error);
    }
  };


  const showTypingIndicator = () => {
    const typingIndicator = document.createElement('div');
    typingIndicator.classList.add('chat-message', 'bot-message');
    typingIndicator.id = 'typing-indicator';
    typingIndicator.textContent = 'Typing...';
    chatWindow.appendChild(typingIndicator);
    chatWindow.scrollTop = chatWindow.scrollHeight;
  };

  const removeTypingIndicator = () => {
    const typingIndicator = document.getElementById('typing-indicator');
    if(typingIndicator){
      typingIndicator.remove();
    }
  };

  const sendMessageToAssistant = async (newMessage) => {
    showTypingIndicator();
    try{
      const uniqueMessages = new Set();

      const messages = Array.from(chatWindow.children).map((msg) => ({
        role: msg.classList.contains('user-message') ? 'user' : 'assistant',
        content: msg.textContent,
      }));
      // const messages = Array.from(chatWindow.children).map((msg) => {
      //   const role = msg.classList.contains('user-message') ? 'user' : 'assistant';
      //   const content = msg.textContent;
      //   const uniqueKey = `${role}:${content}`;
      //
      //   if(!uniqueMessages.has(uniqueKey)){
      //     uniqueMessages.add(uniqueKey);
      //     return {role, content};
      //   }
      //   return null;
      // }).filter((msg) => msg!== null);

      // let messages = Array.from(chatWindow.children).map((msg) => ({
      //   role: msg.classList.contains('user-message') ? 'user' : 'assistant',
      //   content: msg.textContent,
      // }));

      // messages = messages.filter((msg, index, self) =>
      //   msg.content !== 'Typing...' &&
      //   index === self.findIndex((m) => m.content === msg.content)
      // );
      messages.push({ role: 'user', content: newMessage });

      console.log('Payload being sent to server:', JSON.stringify({ messages }, null, 2));

      const response = await fetch('/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, conversation_id: activeConversationId }),
      });

      removeTypingIndicator();

      if (response.ok) {
        const data = await response.json();
        activeConversationId = data.conversation_id;
        addMessage(data.botReply, 'bot', true); // Add Assistant's reply to the chat
      } else {
        console.error('Server returned an error:', response.status);
        addMessage('Error: Unable to get a response from the assistant.', 'bot');
      }
    }catch(error){
      removeTypingIndicator();
      console.error('Error communicating with the assistant:', error);
      addMessage('Error: Something went wrong', 'bot');
    }
  };

  await loadChatHistory();

  let isSendingMessage = false;

  sendButton.addEventListener('click', () => {
    if (isSendingMessage) return;

    const userMessage = chatInput.value.trim();
    if(userMessage){
      addMessage(userMessage, 'user');
      chatInput.value = '';

      isSendingMessage = true;
      sendMessageToAssistant(userMessage);
      isSendingMessage = false;
    }
  });

  chatInput.addEventListener('keypress', (e) => {
    if(e.key === 'Enter'){
      sendButton.click();
    }
  });

  // Logout button functionality
  const logoutButton = document.getElementById('logoutButton');

  if (logoutButton) {
    logoutButton.addEventListener('click', async () => {
      try {
        const response = await fetch('/logout', { method: 'POST' });

        if (response.ok) {
          alert('Logged out successfully!');
          window.location.href = '../html/login.html'; // Redirect to login page
        } else {
          alert('Failed to log out. Please try again.');
        }
      } catch (error) {
        console.error('Logout error:', error);
        alert('An error occurred. Please try again.');
      }
    });
  }
});
