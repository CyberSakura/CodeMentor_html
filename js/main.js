document.addEventListener('DOMContentLoaded', async () => {
  try {
    const response = await fetch('/user-info');
    if (response.ok) {
      const user = await response.json();

      // Update the user profile section
      document.getElementById('username').textContent = user.username;

      // Update the progress bar
      const progressBar = document.querySelector('#progress-bar progress');
      const progressText = document.querySelector('#progress-bar p');

      progressBar.value = user.progress;
      progressText.textContent = `${user.progress}% completed`;
    } else {
      console.error('Failed to fetch user info');
      alert('You must be logged in to access this page.');
      window.location.href = 'index.html';
    }
  } catch (error) {
    console.error('Error fetching user info:', error);
  }
});
