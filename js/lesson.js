document.addEventListener('DOMContentLoaded', async() => {
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

  // Load chat history
  const loadChatHistory = async () => {
    try {
      const response = await fetch('/chat-history'); // Call your existing /chat-history endpoint
      if (response.ok) {
        const chatHistory = await response.json(); // Get chat summaries

        const chatHistoryContainer = document.getElementById('chat-history');
        chatHistoryContainer.innerHTML = ''; // Clear any existing content

        if (chatHistory.length === 0) {
          const noHistoryMessage = document.createElement('p');
          noHistoryMessage.textContent = 'No chat history found.';
          chatHistoryContainer.appendChild(noHistoryMessage);
          return;
        }

        chatHistory.forEach(({ conversation_id, summary }) => {
          const historyItem = document.createElement('div');
          historyItem.classList.add('chat-history-item');
          historyItem.dataset.conversationId = conversation_id;

          const contentDiv = document.createElement('div');
          contentDiv.classList.add('chat-item-content');

          const titleParagraph = document.createElement('p');
          titleParagraph.classList.add('chat-summary');
          titleParagraph.textContent = summary || `Conversation ${conversation_id}`;

          contentDiv.appendChild(titleParagraph);
          historyItem.appendChild(contentDiv);

          // Add click event listener
          historyItem.addEventListener('click', () => {
            sessionStorage.setItem('activeConversationId', conversation_id); // Save the conversation ID
            location.href = 'chat.html'; // Redirect to chat.html
          });

          chatHistoryContainer.appendChild(historyItem);
        });
      } else {
        console.error('Failed to fetch chat history');
      }
    } catch (error) {
      console.error('Error fetching chat history:', error);
    }
  };

  // Call the function to load chat history
  await loadChatHistory();

  // Pop-up logic for lessons
  const lessons = [
    {
      key: "hello-world",
      title: "Hello World",
      content: `
        <p><strong>Introduction:</strong></p>
        <p>Every journey begins with a single step, and in programming, that step is often writing a "Hello, World!" program. This simple exercise introduces you to the basic syntax of Python, demonstrating how to use its <code>print</code> function to display text on the screen.</p>

        <p><strong>Example Code:</strong></p>
        <pre><code>python
# This is a comment. Python ignores anything after the #
print("Hello, World!")  # This line prints a greeting to the console</code></pre>

        <p><strong>Explanation:</strong></p>
        <p><code>print()</code> is a built-in function in Python that outputs text to the screen. Strings (text) are enclosed in quotes. You can use either single (<code>'</code>) or double (<code>"</code>) quotes, but they must match.</p>

        <p><strong>Your Turn:</strong></p>
        <ul>
          <li>Modify the program to print "Hello, Python!" instead.</li>
          <li>Create another print statement that displays your name, e.g., <code>print("My name is John.")</code>.</li>
        </ul>

        <p><strong>Extra Challenge:</strong></p>
        <p>Print a short poem or quote of your choice using multiple <code>print()</code> statements.</p>
      `
    },
    {
      key: "variables",
      title: "Variables",
      content: `
      <p><strong>Introduction:</strong></p>
      <p>Variables are containers for storing data values. Think of them as labeled boxes where you can keep numbers, text, or other types of information. Python is dynamically typed, meaning you don’t need to specify the type of data a variable will hold—it figures it out automatically.</p>

      <p><strong>Example Code:</strong></p>
      <pre><code>python
# Storing information in variables
greeting = "Hello"
name = "Alice"
age = 25

# Using variables in print statements
print(greeting, name)  # Outputs: Hello Alice
print("Age:", age)</code></pre>

      <p><strong>Explanation:</strong></p>
      <p>Variables are assigned using the <code>=</code> operator.</p>
      <p>They can hold different data types, such as strings (<code>"text"</code>), integers (<code>25</code>), and floats (<code>3.14</code>).</p>
      <p>Variable names should be descriptive and follow naming conventions (e.g., <code>snake_case</code> for Python).</p>

      <p><strong>Your Turn:</strong></p>
      <ul>
        <li>Create a variable for your favorite color and print it.</li>
        <li>Write a program that swaps the values of two variables (e.g., <code>a = 5, b = 10</code>).</li>
      </ul>

      <p><strong>Extra Challenge:</strong></p>
      <p>Combine variables into a single print statement: <code>print(f"My name is {name}, and I am {age} years old.")</code>.</p>
    `
    },
    {
      key: "practice-problems",
      title: "Practice Problems",
      content: `
    <p><strong>Introduction:</strong></p>
    <p>Let's practice using variables and basic programming concepts to solve real-world problems. These exercises will help solidify your understanding of variables, assignments, and basic operations in Python.</p>

    <p><strong>Practice 1:</strong></p>
    <p>Create variables to store:</p>
    <ul>
      <li>Your name</li>
      <li>Your favorite movie</li>
      <li>A boolean value indicating whether you like Python (<code>True</code>/<code>False</code>)</li>
    </ul>
    <p>Print all the variables in a single sentence, e.g., <code>print(f"My name is {name}. My favorite movie is {movie}, and I love Python: {likes_python}.")</code></p>

    <p><strong>Practice 2:</strong></p>
    <p>Write a program that calculates the area of a rectangle. Use variables <code>length</code> and <code>width</code> to store values.</p>
    <pre><code>python
length = 10
width = 5
area = length * width
print("Area of the rectangle:", area)</code></pre>

    <p><strong>Extra Challenge:</strong></p>
    <p>Write a program that calculates the area and perimeter of a rectangle, given its length and width.</p>
  `
    },
    {
      key: "logic",
      title: "Logic",
      content: `
    <p><strong>Introduction:</strong></p>
    <p>Programming isn't just about running code line by line. It's about making decisions using logic. In this lesson, you'll learn about <code>if</code>, <code>else</code>, and <code>elif</code> statements, which allow your code to evaluate conditions and make decisions.</p>

    <p><strong>Example Code:</strong></p>
    <pre><code>python
age = 20
if age >= 18:
    print("You are an adult.")
else:
    print("You are a minor.")</code></pre>

    <p><strong>Explanation:</strong></p>
    <p>The <code>if</code> statement checks whether a condition is true. If it is, the indented code block runs. If not, the <code>else</code> block runs.</p>
    <p>Conditions can use comparison operators (<code>==</code>, <code>!=</code>, <code>&gt;</code>, <code>&lt;</code>, etc.) or logical operators (<code>and</code>, <code>or</code>, <code>not</code>).</p>

    <p><strong>Your Turn:</strong></p>
    <ul>
      <li>Write a program to check if a number is positive, negative, or zero.</li>
      <li>Write a program that determines whether someone qualifies for a senior discount (e.g., age &gt;= 60).</li>
    </ul>

    <p><strong>Extra Challenge:</strong></p>
    <p>Create a grading program that assigns a grade (A, B, C, etc.) based on a score input by the user.</p>
  `
    },
    {
      key: "loops",
      title: "Loops",
      content: `
    <p><strong>Introduction:</strong></p>
    <p>Loops allow you to repeat a block of code multiple times. Python has two main types of loops: <code>for</code> loops and <code>while</code> loops. They’re essential for automating repetitive tasks.</p>

    <p><strong>Example Code:</strong></p>
    <pre><code>python
# For loop example
for i in range(1, 6):  # Prints numbers from 1 to 5
    print(i)

# While loop example
count = 1
while count <= 5:  # Prints numbers from 1 to 5
    print(count)
    count += 1</code></pre>

    <p><strong>Explanation:</strong></p>
    <p><code>range(start, stop)</code> generates a sequence of numbers from <code>start</code> (inclusive) to <code>stop</code> (exclusive). Use <code>while</code> loops when the number of iterations is not predetermined.</p>

    <p><strong>Your Turn:</strong></p>
    <ul>
      <li>Write a <code>for</code> loop to print the squares of numbers from 1 to 10.</li>
      <li>Write a <code>while</code> loop to calculate the sum of numbers from 1 to 100.</li>
    </ul>

    <p><strong>Extra Challenge:</strong></p>
    <p>Write a program that generates the Fibonacci sequence up to 100 using a loop.</p>
  `
    },
    {
      key: "loop-practice",
      title: "Loop Practice Problems",
      content: `
    <p><strong>Practice 1:</strong></p>
    <p>Write a program to calculate the sum of the first 50 natural numbers using a loop.</p>

    <p><strong>Practice 2:</strong></p>
    <p>Prompt the user for a number and print its multiplication table up to 10.</p>
    <pre><code>python
num = int(input("Enter a number: "))
for i in range(1, 11):
    print(f"{num} x {i} = {num * i}")</code></pre>

    <p><strong>Extra Challenge:</strong></p>
    <p>Create a program that prints a pyramid of stars (<code>*</code>) based on the number of rows entered by the user.</p>
  `
    },
    {
      key: "functions",
      title: "Functions",
      content: `
    <p><strong>Introduction:</strong></p>
    <p>Functions allow you to group reusable blocks of code together. They make your programs modular and easier to maintain.</p>

    <p><strong>Example Code:</strong></p>
    <pre><code>python
# Define a function
def greet(name):
    print(f"Hello, {name}!")

# Call the function
greet("Alice")
greet("Bob")</code></pre>

    <p><strong>Explanation:</strong></p>
    <p>Functions are defined using the <code>def</code> keyword. They can take parameters and optionally return values using the <code>return</code> statement.</p>

    <p><strong>Your Turn:</strong></p>
    <ul>
      <li>Write a function that calculates the square of a number.</li>
      <li>Create a function that takes two numbers and returns their sum.</li>
    </ul>

    <p><strong>Extra Challenge:</strong></p>
    <p>Write a function that takes a list of numbers and returns the largest number in the list.</p>
  `
    },
    {
      key: "coding-challenge",
      title: "Coding Challenge",
      content: `
    <p><strong>Challenge 1:</strong></p>
    <p>Write a function <code>is_even(number)</code> that returns <code>True</code> if the number is even and <code>False</code> otherwise.</p>

    <p><strong>Challenge 2:</strong></p>
    <p>Create a function <code>factorial(n)</code> that calculates the factorial of a given number. Use a loop or recursion.</p>

    <p><strong>Challenge 3:</strong></p>
    <p>Write a function that checks whether a number is prime. Then write another function to generate all prime numbers less than 100.</p>
  `
    },
  ];

  let currentLessonIndex = 0;

  const lessonLinks = document.querySelectorAll('.lesson-link');
  const popup = document.getElementById('popup');
  const popupTitle = document.getElementById('popup-title');
  const popupBody = document.getElementById('popup-body');
  const closePopupBtn = document.getElementById('close-popup');
  const prevLessonBtn = document.getElementById('prev-lesson');
  const nextLessonBtn = document.getElementById('next-lesson');

  function showLesson(index) {
    const lesson = lessons[index];
    popupTitle.textContent = lesson.title;
    popupBody.innerHTML = lesson.content;
    popup.style.display = 'flex';
  }

  lessonLinks.forEach((link, index) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      currentLessonIndex = index;
      showLesson(currentLessonIndex);
    });
  });

  closePopupBtn.addEventListener('click', () => {
    popup.style.display = 'none';
  });

  prevLessonBtn.addEventListener('click', () => {
    if (currentLessonIndex > 0) {
      currentLessonIndex -= 1;
      showLesson(currentLessonIndex);
    }
  });

  nextLessonBtn.addEventListener('click', () => {
    if (currentLessonIndex < lessons.length - 1) {
      currentLessonIndex += 1;
      showLesson(currentLessonIndex);
    }
  });

  // Add logout button event listener
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
})
