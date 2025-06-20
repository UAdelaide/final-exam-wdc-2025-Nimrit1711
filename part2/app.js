const express = require('express');
const path = require('path');
require('dotenv').config();
const session = require('express-session'); // added session


const app = express();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '/public')));
app.use(express.urlencoded({ extended: true })); // added session

// added session
app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: false

}));

// Routes
const walkRoutes = require('./routes/walkRoutes');
const userRoutes = require('./routes/userRoutes');


app.use('/api/walks', walkRoutes);
app.use('/api/users', userRoutes);
app.use('/api', userRoutes);

// Export the app instead of listening here
module.exports = app;
