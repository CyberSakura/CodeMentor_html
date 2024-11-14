document.addEventListener('DOMContentLoaded', () => {
  const registerForm = document.getElementById('registerForm');

  registerForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if(password !== confirmPassword){
      alert('Passwords don\'t match');
      return;
    }

    try{
      const response = await fetch('/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({username, password}),
      });


      if(response.ok){
        alert('Successfully registered');
        window.location.href = '/'
      } else{
        const error = await response.text();
        alert(`Error: ${error}`);
      }
    }catch(err){
      console.error('Error during register', err);
      alert('An error occurred. Please try again');
    }
  })
});
