const express = require('express')
const path = require('path')
const sqlite3 = require('sqlite3').verbose()
const bodyParser = require('body-parser')
const OpenAI = require('openai')

const app = express()
const port = process.env.PORT || 4000

app.use(bodyParser.json())
app.use(express.static(path.join(__dirname)));

// OpenAI API setup
const openaiClient = new OpenAI({
  apiKey: 'Enter your api key here'
});

// Configure Assistant Gpt API
let assistant = null;
let thread = null;

(async () => {
  try {
    assistant = await openaiClient.beta.assistants.create({
      name: "Code Mentor",
      instructions: "You are a Code Montor for new Python Learner. You should response the answers with very simple concept and simple example.",
      tools: [],
      model: "gpt-4o",
    });
    console.log('Assistant created successfully: ', assistant.id);

    thread = await openaiClient.beta.threads.create();
    console.log('Thread created successfully:', thread.id);
  }catch (error){
    console.error('Error creating assistant:', error);
  }
})();

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'html/index.html'));
});

const db = new sqlite3.Database('./identifier.sqlite', (err) => {
  if (err) {
    console.error('Error connecting to database', err.message);
  }else{
    console.log('Connected to database')
  }
});

let loggedInUser = null;
app.post('/login', (req, res) => {
  const {username, password} = req.body

  if(!username || !password){
    return res.status(400).send('Username and password are required')
  }

  const query = 'SELECT * FROM users WHERE username = ?';
  db.get(query, [username], (err, user)=>{
    if(err){
      console.error('Database error', error.message);
      return res.status(500).send('Internal server error.');
    }

    if(!user){
      return res.status(401).send('Invalid username or password.');
    }

    if(password !== user.password){
      return res.status(401).send('Invalid password');
    }

    loggedInUser = {
      username: username,
      password: password || 0,
    };

    res.send(`Welcome back, ${user.username}!`);
  });
});

app.post('/register', (req, res) => {
  const {username, password} = req.body;
  if(!username || !password){
    return res.status(400).send('Username and password are required');
  }

  const query = 'INSERT INTO users (username, password) VALUES (?,?)';
  db.run(query, [username, password], (err) => {
    if (err) {
      if (err.code === 'SQLITE_CONSTRAINT') {
        return res.status(400).send('Username already exists.');
      }
      console.error('Error inserting user:', err.message);
      return res.status(500).send('Internal server error.');
    }

    res.status(201).send('User registered successfully.');
  });
})

app.post('/logout', (req, res) => {
  if(loggedInUser){
    loggedInUser = null;
    res.status(200).send('Logged Out Successfully!');
  }else{
    res.status(400).send('No user is currently logged in.');
  }
});

app.get('/main.html', (req, res) => {
  if(!loggedInUser){
    return res.redirect('/');
  }

  res.sendFile(path.join(__dirname, 'html/main.html'));
});

app.get('/user-info', (req, res) => {
  if (!loggedInUser) {
    return res.status(401).json({ error: 'User not logged in' });
  }
  res.json(loggedInUser); // Send user info as JSON
});

// Chat Feature
app.post('/chat', async (req, res) => {
  const { message } = req.body;

  if(!assistant){
    return res.status(500).send('Assistant is not initialized.');
  }

  if(!thread){
    return res.status(500).send('Thread is not initialized.');
  }

  if(!message){
    return res.status(400).send('Message is required.');
  }

  try{
    await openaiClient.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: message,
    });

    const run = await openaiClient.beta.threads.runs.create(thread.id, {
      assistant_id: assistant.id,
    })

    const assistantMessage = run.results[0].messages.find(
      (msg) => msg.role === 'assistant'
    );

    if (!assistantMessage) {
      return res.status(500).send('No response received from assistant.');
    }
  }catch(err){
    console.error('Error during the conversion: ', err.message);
    res.status(500).send('Currently failed to get a response from the GPT Api, please try again later.');
  }

});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
})
