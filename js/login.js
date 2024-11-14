document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');

  // Handle form submission
  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault(); // Prevent the default form submission

    // Collect form data
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
      // Send login data to the server
      const response = await fetch('/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      // Handle the response
      if (response.ok) {
        const message = await response.text();
        alert(message);
        window.location.href = '../html/main.html';
      } else {
        const error = await response.text();
        alert(`Error: ${error}`); // Show an error message
      }
    } catch (error) {
      console.error('Error during login:', error);
      alert('An error occurred. Please try again later.');
    }
  });
});
