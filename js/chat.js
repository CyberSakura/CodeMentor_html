document.addEventListener('DOMContentLoaded', async () => {
  // Chat functionality
  const chatWindow = document.getElementById('chat-window');
  const chatInput = document.getElementById('chat-input');
  const sendButton = document.getElementById('send-button');

  const addMessage = (message, type) => {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('chat-message', type === 'user' ? 'user-message' : 'bot-message');
    messageDiv.textContent = message;
    chatWindow.appendChild(messageDiv);
    chatWindow.scrollTop = chatWindow.scrollHeight;
  };

  const sendMessageToAssistant = async (message) => {
    try{
      const response = await fetch('/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({message}),
      });

      if (response.ok) {
        const data = await response.json();
        addMessage(data.reply, 'bot'); // Add Assistant's reply to the chat
      } else {
        addMessage('Error: Unable to get a response from the assistant.', 'bot');
      }
    }catch(error){
      console.error('Error communicating with the asistant:', error);
      addMessage('Error: Something went wrong', 'bot');
    }
  };

  sendButton.addEventListener('click', () => {
    const userMessage = chatInput.value.trim();
    if(userMessage){
      addMessage(userMessage, 'user');
      chatInput.value = '';
      sendMessageToAssistant(userMessage);
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
          window.location.href = '../html/index.html'; // Redirect to login page
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
