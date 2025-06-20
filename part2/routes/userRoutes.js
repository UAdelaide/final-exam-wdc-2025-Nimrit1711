const express = require('express');
const router = express.Router();
const db = require('../models/db');

// GET all users (for admin/testing)
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT user_id, username, email, role FROM Users');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// POST a new user (simple signup)
router.post('/register', async (req, res) => {
  const { username, email, password, role } = req.body;

  try {
    const [result] = await db.query(`
      INSERT INTO Users (username, email, password_hash, role)
      VALUES (?, ?, ?, ?)
    `, [username, email, password, role]);

    res.status(201).json({ message: 'User registered', user_id: result.insertId });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.get('/me', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not logged in' });
  }
  res.json(req.session.user);
});

// POST login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const [rows] = await db.execute(`SELECT * FROM Users WHERE username = ? AND password_hash = ?`, [username, password]);

      if (rows.length === 1) {
          req.session.user = {
            id: rows[0].username,
            role: rows[0].role
          };

          // redirect user base on their role
          if (rows[0].role === 'owner') {
            return res.redirect('/owner-dashboard.html');
          }

          if (rows[0].role === 'walker') {
            return res.redirect('/walker-dashboard.html');
          }
          // if invalid password or username send error message
        } else {
          return res.status(401).json({ error: 'Invalid username or password'});
      }
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server error');
    }
});


// logout route
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout failed: ', err);
      return res.status(500).send('Could not log out');
    }
    res.clearCookie('connect.sid'); // clear the session cookie
    res.redirect('/'); // redirect to index page
  });
});

// get request for users dogs

router.get('/mydogs', async (req, res) => {
  if (!req.session.user || req.session.user.role !== 'owner'){
    return res.status(401).json({ error: 'Not authorised'});
  }

  const userId = req.session.user.id;

  try {
    const [dogs] = await db.execute(
      'SELECT dog_id, name, size FROM Dogs WHERE owner_id = (SL'
    )
  }
})


module.exports = router;
