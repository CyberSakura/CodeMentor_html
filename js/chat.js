document.addEventListener('DOMContentLoaded', async () => {
  // Chat functionality
  const chatWindow = document.getElementById('chat-window');
  const chatInput = document.getElementById('chat-input');
  const sendButton = document.getElementById('send-button');
  const chatHistoryContainer = document.getElementById('chat-history');
  const newConversationIcon = document.getElementById('new-conversation-icon');
  const newConversationButton = document.getElementById('new-conversation-button');

  // Global Variables
  let currentlySelectedBlock = null;
  let activeConversationId = localStorage.getItem('activeConversationId');
  let isContinuingConversation = false;

  const resetActiveConversation = () => {
    activeConversationId = null;
    isContinuingConversation = false;
    localStorage.removeItem('activeConversationId');
  };

  const addMessage = (message, type, simulateTyping = false) => {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('chat-message', type === 'user' ? 'user-message' : 'bot-message');
    chatWindow.appendChild(messageDiv);

    if (simulateTyping) {
      const plainText = message.replace(/```([\s\S]+?)```/g, ''); // Remove block code during typing
      let currentIndex = 0;

      const typingInterval = setInterval(() => {
        const typingText = plainText.slice(0, currentIndex + 1);
        messageDiv.innerHTML = renderMarkdownToHTML(typingText); // Render Markdown progressively
        currentIndex++;

        if (currentIndex === plainText.length) {
          clearInterval(typingInterval);
          messageDiv.innerHTML = renderMarkdownToHTML(message); // Render the full formatted message
        }

        chatWindow.scrollTop = chatWindow.scrollHeight;
      }, 20);
    } else {
      // Render the full message immediately
      messageDiv.innerHTML = renderMarkdownToHTML(message);
      chatWindow.scrollTop = chatWindow.scrollHeight;
    }
  };

  // Helper function to render Markdown-like content to HTML
  const renderMarkdownToHTML = (text) => {
    // Handle block code (```code```)
    text = text.replace(/```([\s\S]+?)```/g, '<pre><code>$1</code></pre>');

    // Handle inline code (`code`)
    text = text.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Handle bold (**text**)
    text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    // Handle nested lists (with spaces for indentation)
    const lines = text.split('\n');
    const listStack = [];
    let html = '';

    lines.forEach((line) => {
      const match = line.match(/^(\s*)([-\d]+\.)\s+(.*)/); // Match list items with indentation
      if (match) {
        const [_, spaces, marker, content] = match;
        const level = spaces.length / 2; // Determine nesting level (2 spaces per level)

        while (listStack.length > level) {
          html += `</${listStack.pop()}>`; // Close deeper levels
        }

        if (listStack.length < level) {
          const tag = marker.endsWith('.') ? 'ol' : 'ul'; // Detect ordered or unordered
          html += `<${tag}>`;
          listStack.push(tag);
        }

        html += `<li>${content}</li>`;
      } else {
        while (listStack.length > 0) {
          html += `</${listStack.pop()}>`; // Close all open lists
        }

        if (!line.startsWith('<pre><code>') && !line.endsWith('</code></pre>')) {
          html += `<p>${line}</p>`;
        } else {
          html += line;
        }
      }
    });

    while (listStack.length > 0) {
      html += `</${listStack.pop()}>`; // Ensure all lists are closed
    }

    return html;
  };

  const addHistoryItem = (summary, conversationId) => {
    const historyDiv = document.createElement('div');
    historyDiv.classList.add('chat-history-item');
    historyDiv.dataset.conversationId = conversationId;

    const summaryDiv = document.createElement('p');
    summaryDiv.textContent = summary;
    summaryDiv.style.fontWeight = 'bold';

    historyDiv.appendChild(summaryDiv);

    if (conversationId !== "new") {
      historyDiv.addEventListener('click', () => {
        if (currentlySelectedBlock) {
          currentlySelectedBlock.classList.remove('selected');
        }

        currentlySelectedBlock = historyDiv;
        historyDiv.classList.add('selected');
        loadCurrentConversation(conversationId);
      });
    }

    chatHistoryContainer.appendChild(historyDiv);
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

  const startNewConversation = () => {
    activeConversationId = null; // Reset the conversation ID to indicate a new conversation
    localStorage.removeItem('activeConversationId');
    chatWindow.innerHTML = ''; // Clear the chat window
    console.log('Started a new conversation');

    if (currentlySelectedBlock) {
      currentlySelectedBlock.classList.remove('selected');
      currentlySelectedBlock = null;
    }

    const newConversationSummary = "New Conversation";
    const newConversationID = "new";
    addHistoryItem(newConversationSummary, newConversationID);

    const historyItems = chatHistoryContainer.children;
    if (historyItems.length > 0) {
      historyItems[historyItems.length - 1].classList.add('selected');
      currentlySelectedBlock = historyItems[historyItems.length - 1];
    }

    const welcomeMessage = `
      <p><strong>Welcome!</strong> Here are some common questions you can ask:</p>
      <ul>
        <li><a href="#" class="common-question" data-question="What are some beginner-friendly Python projects?">What are some beginner-friendly Python projects?</a></li>
        <li><a href="#" class="common-question" data-question="Can you explain Python loops with examples?">Can you explain Python loops with examples?</a></li>
        <li><a href="#" class="common-question" data-question="How do I install Python on my computer?">How do I install Python on my computer?</a></li>
        <li><a href="#" class="common-question" data-question="What is the difference between a list and a tuple in Python?">What is the difference between a list and a tuple in Python?</a></li>
      </ul>
    `;
    addMessage(welcomeMessage, 'bot');

    // Add event listeners to the clickable hyperlinks
    const questionLinks = chatWindow.querySelectorAll('.common-question');
    questionLinks.forEach((link) => {
      link.addEventListener('click', (event) => {
        event.preventDefault(); // Prevent the default link behavior
        const question = link.dataset.question;
        addMessage(question, 'user'); // Add the question to the chat as a user message
        sendMessageToAssistant(question); // Send the question as a prompt
      });
    });
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
    if (typingIndicator) {
      typingIndicator.remove();
    }
  };

  const sendMessageToAssistant = async (newMessage) => {
    showTypingIndicator();
    try {
      const messages = Array.from(chatWindow.children).map((msg) => ({
        role: msg.classList.contains('user-message') ? 'user' : 'assistant',
        content: msg.textContent,
      }));
      messages.push({ role: 'user', content: newMessage });

      const response = await fetch('/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages,
          conversation_id: activeConversationId,
        }),
      });

      removeTypingIndicator();

      if (response.ok) {
        const data = await response.json();
        const { conversation_id: newConversationId, botReply } = data;

        if (!activeConversationId) {
          activeConversationId = newConversationId;
          localStorage.setItem('activeConversationId', activeConversationId);

          const historyItems = Array.from(chatHistoryContainer.children);
          const pendingHistoryItem = historyItems.find(
            (item) => item.dataset.conversationId === "new"
          );

          if (pendingHistoryItem) {
            pendingHistoryItem.querySelector('p').textContent = `Conversation ${newConversationId}`;
            pendingHistoryItem.dataset.conversationId = newConversationId;

            // Add click handler to the updated block
            pendingHistoryItem.addEventListener('click', () => loadCurrentConversation(newConversationId));
          }
        }

        addMessage(botReply, 'bot', true); // Add Assistant's reply to the chat
      } else {
        console.error('Server returned an error:', response.status);
        addMessage('Error: Unable to get a response from the assistant.', 'bot');
      }
    } catch (error) {
      removeTypingIndicator();
      console.error('Error communicating with the assistant:', error);
      addMessage('Error: Something went wrong', 'bot');
    }
  };

  if (!isContinuingConversation) {
    resetActiveConversation();
    startNewConversation();
  }

  if (newConversationIcon) {
    newConversationIcon.addEventListener('click', startNewConversation);
  }

  if (newConversationButton) {
    newConversationButton.addEventListener('click', startNewConversation);
  }

  await loadChatHistory();

  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Allow newline input on Shift+Enter
        console.log('Shift+Enter detected! Adding a newline.');
      } else {
        // Send the message on Enter
        e.preventDefault();
        sendButton.click();
      }
    }
  });

  // Adjust the height of the textarea dynamically
  const adjustTextareaHeight = () => {
    chatInput.style.height = 'auto'; // Reset height to compute new height properly
    chatInput.style.height = `${chatInput.scrollHeight}px`; // Adjust to fit content
  };

  // Adjust height dynamically as the user types
  chatInput.addEventListener('input', adjustTextareaHeight);

  // Optionally adjust height when the textarea is focused (in case no input exists yet)
  chatInput.addEventListener('focus', adjustTextareaHeight);

  let isSendingMessage = false;

  sendButton.addEventListener('click', () => {
    if (isSendingMessage) return;

    const userMessage = chatInput.value.trim();
    if (userMessage) {
      addMessage(userMessage, 'user');
      chatInput.value = '';

      adjustTextareaHeight();

      isSendingMessage = true;
      sendMessageToAssistant(userMessage);
      isSendingMessage = false;
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
