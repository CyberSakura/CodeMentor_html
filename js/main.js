document.addEventListener('DOMContentLoaded', async () => {
  try {
    const response = await fetch('/user-info');
    if (response.ok) {
      const user = await response.json();

      console.log('User data:', user);


      // Update the user profile section
      const headerUsername = document.getElementById('header-username');
      if (headerUsername) {
        headerUsername.textContent = user.username;
      }

      const profileUsername = document.getElementById('username');
      if (profileUsername) {
        profileUsername.textContent = user.username;
      }

      // Update the progress bar
      const progressBar = document.querySelector('#progress-bar progress');
      const progressText = document.querySelector('#progress-bar p');

      if (user.progress === undefined || user.progress === null) {
        console.error('Progress is missing in the response');
      }

      if (typeof user.progress !== 'string' && typeof user.progress !== 'number') {
        console.error('Progress is not in the expected format:', user.progress);
      }


      if (progressBar && progressText) {
        let progressValue = parseFloat(user.progress);
        if (isNaN(progressValue) || progressValue < 0 || progressValue > 100) {
          console.error('Invalid progress value:', progressValue);
          progressValue = 0;
        }
        progressBar.value = progressValue;
        progressText.textContent = `${progressValue}% completed`;
      }
    } else {
      console.error('Failed to fetch user info');
      alert('You must be logged in to access this page.');
      window.location.href = '../html/login.html';
    }
  } catch (error) {
    console.error('Error fetching user info:', error);
  }

  const logoutButton = document.getElementById('logoutButton');
  if (logoutButton) {
    logoutButton.addEventListener('click', async () => {
      try {
        const response = await fetch('/logout', { method: 'POST' });
        if (response.ok) {
          alert('Logged Out Successfully!');
          window.location.href = '../html/login.html';
        } else {
          alert('Failed to log out. Please try again.');
        }
      } catch (error) {
        console.error('Error logging out:', error);
        alert('An error occurred. Please try again.');
      }
    });
  }
});
