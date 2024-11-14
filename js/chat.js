document.addEventListener('DOMContentLoaded', async () => {
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
