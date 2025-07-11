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

// middle ware for user authentication. IM NOT sure if this is required in this exam pls ignore ;)

function requireLogin(req, res, next) {
    if (req.session && req.session.user) {
        next();
    } else {
        res.redirect('/');
    }
}

// to ensure only users can access their required role dashboard
function requireRole(role) {
    return function (req, res, next) {
        if (req.session && req.session.user && req.session.user.role === role) {
            next();
        } else {
            res.redirect('/');
        }
    };
}

// Now user needs to login in order to access these pages
app.get('/owner', requireLogin, requireRole('owner'), (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'owner-dashboard.html'));
});

app.get('/walker', requireLogin, requireRole('walker'), (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'walker-dashboard.html'));
});

// Routes
const walkRoutes = require('./routes/walkRoutes');
const userRoutes = require('./routes/userRoutes');
const e = require('express');


app.use('/api/walks', walkRoutes);
app.use('/api/users', userRoutes);
app.use('/api', userRoutes);

// Export the app instead of listening here
module.exports = app;
