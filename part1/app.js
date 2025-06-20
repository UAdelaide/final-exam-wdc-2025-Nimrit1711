var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const mysql = require('mysql2/promise');

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


let db;
(async () => {
    try {
        // creeate db to mysql
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'DogWalkService'
        });

        await connection.query(`CREATE DATABASE IF NOT EXISTS DogWalkService`);
        await connection.end();

        // connect
        db = await mysql.createConnection({
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

        // creating tables

        await db.execute(`
            CREATE TABLE Users (
                user_id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                role ENUM('owner', 'walker') NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await db.execute(`
            CREATE TABLE Dogs (
                dog_id INT AUTO_INCREMENT PRIMARY KEY,
                owner_id INT NOT NULL,
                name VARCHAR(50) NOT NULL,
                size ENUM('small', 'medium', 'large') NOT NULL,
                FOREIGN KEY (owner_id) REFERENCES Users(user_id)
            )
        `);

        await db.execute(`
            CREATE TABLE WalkRequests (
                request_id INT AUTO_INCREMENT PRIMARY KEY,
                dog_id INT NOT NULL,
                requested_time DATETIME NOT NULL,
                duration_minutes INT NOT NULL,
                location VARCHAR(255) NOT NULL,
                status ENUM('open', 'accepted', 'completed', 'cancelled') DEFAULT 'open',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (dog_id) REFERENCES Dogs(dog_id)
            )
        `);


        await db.execute(`
            CREATE TABLE WalkApplications (
                application_id INT AUTO_INCREMENT PRIMARY KEY,
                request_id INT NOT NULL,
                walker_id INT NOT NULL,
                applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
                FOREIGN KEY (request_id) REFERENCES WalkRequests(request_id),
                FOREIGN KEY (walker_id) REFERENCES Users(user_id),
                CONSTRAINT unique_application UNIQUE (request_id, walker_id)
            )
        `);

        await db.execute(`
            CREATE TABLE WalkRatings (
                rating_id INT AUTO_INCREMENT PRIMARY KEY,
                request_id INT NOT NULL,
                walker_id INT NOT NULL,
                owner_id INT NOT NULL,
                rating INT CHECK (rating BETWEEN 1 AND 5),
                comments TEXT,
                rated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (request_id) REFERENCES WalkRequests(request_id),
                FOREIGN KEY (walker_id) REFERENCES Users(user_id),
                FOREIGN KEY (owner_id) REFERENCES Users(user_id),
                CONSTRAINT unique_rating_per_walk UNIQUE (request_id)
            )
        `);
            // inserting data into tables

        await db.query(`
            INSERT INTO Users (username, email, password_hash, role)
                VALUES
                ('alice123','alice@example.com','hashed123','owner'),
                ('bobwalker', 'bob@example.com', 'hashed456', 'walker'),
                ('carol123', 'carol@example.com', 'hashed789', 'owner'),
                ('nimx2', 'nim@example.com', 'hashed111', 'owner'),
                ('shub100', 'shub@example.com', 'hello3', 'walker');
        `);

        await db.query(`
            INSERT INTO Dogs (owner_id, name, size)
                VALUES
                ((SELECT user_id FROM Users WHERE username='alice123'), 'Max', 'medium'),
                ((SELECT user_id FROM Users WHERE username='carol123'), 'Bella', 'small'),
                ((SELECT user_id FROM Users WHERE username='nimx2'), 'Oreo', 'small'),
                ((SELECT user_id FROM Users WHERE username='nimx2'), 'Princess', 'large'),
                ((SELECT user_id FROM Users WHERE username='nimx2'), 'Cupcake', 'large');
        `);

         await db.query(`
            INSERT INTO WalkRequests (dog_id, requested_time, duration_minutes, location, status)
            VALUES
            ((SELECT dog_id FROM Dogs WHERE name = 'Max'), '2025-06-10 08:00:00', 30, 'Parklands', 'open'),
            ((SELECT dog_id FROM Dogs WHERE name = 'Bella'), '2025-06-10 09:30:00', 45, 'Beachside Ave', 'accepted'),
            ((SELECT dog_id FROM Dogs WHERE name = 'Oreo'), '2025-06-20 11:30:00', 60, 'Henley', 'accepted'),
            ((SELECT dog_id FROM Dogs WHERE name = 'Princess'), '2025-06-21 08:15:00', 20, 'Tea Tree Gully', 'open'),
            ((SELECT dog_id FROM Dogs WHERE name = 'Cupcake'), '2025-06-21 09:15:00', 20, 'Riverlea', 'open');
        `);
             console.log('Database created and filled');
             await db.end();
         } catch (error) {
            console.error('error loading database: ', error);
         }
        })();

        // Route to /api/dogs
        app.get('/api/dogs', async (req, res) => {
        try {
            const [dogs] = await db.execute('SELECT * FROM Dogs');
            res.json(dogs);
        } catch (err) {
            res.status(500).json({ error: 'Failed to fetch dogs' });
        }
        });

module.exports = app;
