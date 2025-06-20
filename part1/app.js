var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const db = require('./db');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);



(async () => {
    try {
        //connect to mysql
        const root = await mysql.createConnection({ host: 'localhost', user: 'root', password: '' });

        await root.query(`CREATE DATABASE IF NOT EXISTS DogWalkService`);
        await root.end();

        const db = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'DogWalkService'
        });


        await db.query(`DROP TABLE IF EXISTS WalkRatings`);
        await db.query(`DROP TABLE IF EXISTS WalkApplications`);
        await db.query(`DROP TABLE IF EXISTS WalkRequests`);
        await db.query(`DROP TABLE IF EXISTS Dogs`);
        await db.query(`DROP TABLE IF EXISTS Users`);

        await db.query(`
     
    `);
})

module.exports = app;
