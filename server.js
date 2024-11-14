const express = require('express')
const path = require('path')
const sqlite3 = require('sqlite3').verbose()
const bodyParser = require('body-parser')

const app = express()
const port = process.env.PORT || 4000

app.use(bodyParser.json())
app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
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

app.get('/main.html', (req, res) => {
  if(!loggedInUser){
    return res.redirect('/');
  }

  res.sendFile(path.join(__dirname, 'main.html'));
});

app.get('/user-info', (req, res) => {
  if (!loggedInUser) {
    return res.status(401).json({ error: 'User not logged in' });
  }
  res.json(loggedInUser); // Send user info as JSON
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
})
