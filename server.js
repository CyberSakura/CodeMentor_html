const express = require('express')
const path = require('path')
const sqlite3 = require('sqlite3').verbose()
const bodyParser = require('body-parser')
const OpenAI = require('openai');
const app = express()
const port = process.env.PORT || 4000
require('dotenv').config();

app.use(bodyParser.json())
app.use(express.static(path.join(__dirname)));

// OpenAI API setup
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Database setup
const db = new sqlite3.Database('./identifier.sqlite', (err) => {
  if (err) {
    console.error('Error connecting to database', err.message);
  }else{
    console.log('Connected to database')
  }
});

let loggedInUser = null;

// Route: Serve main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'html/login.html'));
});

// User login
app.post('/login', (req, res) => {
  const {username, password} = req.body

  if(!username || !password){
    return res.status(400).send('Username and password are required')
  }

  const query = 'SELECT * FROM users WHERE username = ?';
  db.get(query, [username], (err, user)=>{
    if(err){
      console.error('Database error', err.message);
      return res.status(500).send('Internal server error.');
    }

    if (!user || password !== user.password) {
      return res.status(401).send('Invalid username or password.');
    }

    loggedInUser = {
      id: user.id,
      username: username,
      password: password || 0,
    };

    res.send(`Welcome back, ${user.username}!`);
  });
});

// User register
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

// User logout
app.post('/logout', (req, res) => {
  if(loggedInUser){
    loggedInUser = null;
    res.status(200).send('Logged Out Successfully!');
  }else{
    res.status(400).send('No user is currently logged in.');
  }
});

// Route: Serve main page after login
app.get('/main.html', (req, res) => {
  if(!loggedInUser){
    return res.redirect('/');
  }

  res.sendFile(path.join(__dirname, 'html/main.html'));
});

// Get user information
app.get('/user-info', (req, res) => {
  if (!loggedInUser) {
    return res.status(401).json({ error: 'User not logged in' });
  }
  res.json(loggedInUser); // Send user info as JSON
});

// Chat: Send a message to the assistant
app.post('/chat', async (req, res) => {
  const { messages, conversation_id } = req.body;

  // console.log('Received body:', JSON.stringify(req.body, null, 2));

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).send('Messages are required.');
  }

  if (!loggedInUser) {
    return res.status(401).send('User is not logged in.');
  }

  const userId = loggedInUser.id;
  const userMessage = messages[messages.length - 1].content;

  try {
    let activeConversationId = conversation_id;

    if(!activeConversationId){
      const getMaxConversationIdQuery = `
        SELECT MAX(conversation_id) AS max_conversation_id
        FROM chat_history
        WHERE user_id = ?;
      `;

      activeConversationId = await new Promise((resolve, reject) => {
        db.get(getMaxConversationIdQuery, [userId], (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row?.max_conversation_id != null ? row.max_conversation_id +1: 1); // Start at 1 if no previous conversations exist
          }
        });
      });

      if(!activeConversationId){
        activeConversationId = 1;
      }
    }

    const titleResponse = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'Generate a concise, meaningful title for the following user input.'
        },
        {
          role: 'user',
          content: userMessage
        }
      ],
      max_tokens: 10, // Keep the title short
    });

    const title = titleResponse.choices[0]?.message?.content?.trim() || userMessage.slice(0, 20);


    const response = await openai.chat.completions.create({
      model: 'gpt-4o', // Specify the model
      messages: [
        { role: 'system',
          content: '    You are a Python mentor for new learners. \n' +
            '    Your goal is to explain Python concepts in the simplest terms possible, avoiding jargon or overly technical language.\n' +
            '    When asked to explain a concept, provide a concise, easy-to-understand explanation and a very basic example in Python.\n' +
            '    Always encourage the user and keep the tone friendly and supportive.\n' +
            '    If a question isn\'t clear, politely ask for clarification instead of making assumptions.. ' },
        ...messages,
      ],
      max_tokens: 1000,
    });

    const botReply = response.choices[0].message.content; // Extract the assistant's reply

    const query = `
      INSERT INTO chat_history (user_id, conversation_id, user_message, bot_response, title)
      VALUES (?, ?, ?, ?, ?)
    `;

    db.run(
      query,
      [userId, activeConversationId, userMessage, botReply, title],
      (err) => {
        if (err) {
          console.error('Error saving chat to database:', err.message);
          return res.status(500).send('Failed to save chat to history.');
        }
      }
    );


    res.json({ botReply, conversation_id: activeConversationId });
  } catch (error) {
    console.error('Error during chat interaction:', error.message);
    res.status(500).send('Failed to get a response from GPT-4.');
  }
});

// Chat history endpoint
// app.get('/chat-history', (req, res) => {
//   if (!loggedInUser) {
//     return res.status(401).json({ error: 'User is not logged in' });
//   }
//
//   const userId = loggedInUser.id;
//
//   const query = `
//     SELECT conversation_id, MIN(user_message) AS user_message, MIN(bot_response) AS bot_response
//     FROM chat_history
//     WHERE user_id = ?
//     GROUP BY conversation_id
//     ORDER BY conversation_id DESC;
//   `;
//
//   db.all(query, [userId], (err, rows) => {
//     if (err) {
//       console.error('Error fetching chat history:', err.message);
//       return res.status(500).send('Failed to fetch chat history.');
//     }
//
//     res.json(rows); // Send the chat history as JSON
//   });
// });

app.get('/chat-history', (req, res) => {
  const conversationId = req.query.conversation_id;
  const userId = loggedInUser.id;

  if (conversationId) {
    const query = `
      SELECT user_message, bot_response, timestamp
      FROM chat_history
      WHERE user_id = ? AND conversation_id = ?
      ORDER BY timestamp ASC;
    `;

    db.all(query, [userId, conversationId], (err, rows) => {
      if (err) {
        console.error('Error fetching conversation messages:', err.message);
        return res.status(500).send('Failed to fetch messages.');
      }

      res.json(rows); // Return all messages for the selected conversation
    });
  } else {
    // Return summaries of all conversations (as above)
    const query = `
      SELECT
        conversation_id,
        CASE
          WHEN title IS NOT NULL AND title != '' THEN title
          ELSE MIN(user_message)
          END AS summary
      FROM chat_history
      WHERE user_id = ?
      GROUP BY conversation_id
      ORDER BY conversation_id DESC;
    `;

    db.all(query, [userId], (err, rows) => {
      if (err) {
        console.error('Error fetching chat history:', err.message);
        return res.status(500).send('Failed to fetch chat history.');
      }

      console.log("Query result from chat-history:", rows);
      res.json(rows); // Return summaries of conversations
    });
  }
});

// Rename a chat history item
app.put('/chat-history/rename', (req, res) => {
  const { conversationId, newName } = req.body;

  if (!loggedInUser || !conversationId || !newName) {
    return res.status(400).send('Invalid request data.');
  }

  const query = `
    UPDATE chat_history
    SET title = ?
    WHERE user_id = ? AND conversation_id = ?;
  `;

  db.run(query, [newName, loggedInUser.id, conversationId], (err) => {
    if (err) {
      console.error('Error renaming chat history:', err.message);
      return res.status(500).send('Failed to rename chat history.');
    }

    res.status(200).send('Chat history renamed successfully.');
  });
});

// Delete a chat history item
app.delete('/chat-history/delete', (req, res) => {
  const { conversationId } = req.body;

  if (!loggedInUser || !conversationId) {
    return res.status(400).send('Invalid request data.');
  }

  const query = `
        DELETE FROM chat_history
        WHERE user_id = ? AND conversation_id = ?;
    `;

  db.run(query, [loggedInUser.id, conversationId], (err) => {
    if (err) {
      console.error('Error deleting chat history:', err.message);
      return res.status(500).send('Failed to delete chat history.');
    }

    res.status(200).send('Chat history deleted successfully.');
  });
});


app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
})
