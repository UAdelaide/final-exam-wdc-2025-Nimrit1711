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
            password: ''
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

        const [usersRows] = await db.execute('SELECT COUNT(*) AS count FROM Users');
        if (usersRows[0].count ===0){
            await db.execute(`
                INSERT INTO Users (username, email, password_hash, role)
                    VALUES
                    ('alice123','alice@example.com','hashed123','owner'),
                    ('bobwalker', 'bob@example.com', 'hashed456', 'walker'),
                    ('carol123', 'carol@example.com', 'hashed789', 'owner'),
                    ('nimx2', 'nim@example.com', 'hashed111', 'owner'),
                    ('shub100', 'shub@example.com', 'hello3', 'walker');
            `);
        }

    const [dogRows] = await db.execute('SELECT COUNT(*) AS count FROM Dogs');
     if (dogRows[0].count ===0){
        await db.execute(`
                INSERT INTO Dogs (owner_id, name, size)
                    VALUES
                    ((SELECT user_id FROM Users WHERE username='alice123'), 'Max', 'medium'),
                    ((SELECT user_id FROM Users WHERE username='carol123'), 'Bella', 'small'),
                    ((SELECT user_id FROM Users WHERE username='nimx2'), 'Oreo', 'small'),
                    ((SELECT user_id FROM Users WHERE username='nimx2'), 'Princess', 'large'),
                    ((SELECT user_id FROM Users WHERE username='nimx2'), 'Cupcake', 'large');
            `);
    }

    const [reqRows] = await db.execute('SELECT COUNT(*) AS count FROM WalkRequests');
     if (reqRows[0].count ===0){
         await db.execute(`
            INSERT INTO WalkRequests (dog_id, requested_time, duration_minutes, location, status)
            VALUES
            ((SELECT dog_id FROM Dogs WHERE name = 'Max'), '2025-06-10 08:00:00', 30, 'Parklands', 'open'),
            ((SELECT dog_id FROM Dogs WHERE name = 'Bella'), '2025-06-10 09:30:00', 45, 'Beachside Ave', 'accepted'),
            ((SELECT dog_id FROM Dogs WHERE name = 'Oreo'), '2025-06-20 11:30:00', 60, 'Henley', 'accepted'),
            ((SELECT dog_id FROM Dogs WHERE name = 'Princess'), '2025-06-21 08:15:00', 20, 'Tea Tree Gully', 'open'),
            ((SELECT dog_id FROM Dogs WHERE name = 'Cupcake'), '2025-06-21 09:15:00', 20, 'Riverlea', 'open');
        `);
    }
        console.log('Database created and filled');
    } catch (error) {
        console.error('error loading database: ', error);
    }
})();

    // Route to /api/dogs
    app.get('/api/dogs', async (req, res) => {
        try {
            const [dogs] = await db.execute(`
                SELECT
                    d.name AS dog_name,
                    d.size,
                    u.username AS owner_username
                FROM Dogs d
                JOIN Users u ON d.owner_id = u.user_id
                `);
            res.json(dogs);
        } catch (err) {
            res.status(500).json({ error: 'Failed to fetch dogs' });
        }
        });

        // Route to /api/walkrequests/open
        app.get('/api/walkrequests/open', async (req, res) => {
            try {
                const [opens] = await db.execute(`
                    SELECT
                        wr.request_id,
                        d.name AS dog_name,
                        wr.requested_time,
                        wr.duration_minutes,
                        wr.location,
                        u.username AS owner_username
                    FROM WalkRequests wr
                    JOIN Dogs d ON wr.dog_id = d.dog_id
                    JOIN Users u ON d.owner_id = u.user_id
                    WHERE wr.status = 'open'
                    `);
                res.json(opens);
            } catch (err) {
                res.status(500).json({ error: 'Failed to fetch walk requests for status = open' });
            }
        });


        // Route to /api/walkers/summary
        app.get('/api/walkers/summary', async (req, res) => {
            try {
                const [summary] = await db.execute(`
                    SELECT
                        u.username AS walker_username,
                        COUNT(r.rating_id) AS total_ratings,
                        ROUND(AVG(r.rating), 1) AS average_rating,
                        COUNT(DISTINCT wr.request_id) AS completed_walks
                    FROM Users u
                    LEFT JOIN WalkRatings r ON u.user_id = r.walker_id
                    LEFT JOIN WalkRequests wr ON r.request_id = wr.request_id AND wr.status = 'completed'
                    WHERE u.role = 'walker'
                    GROUP BY u.user_id
                    `);
                res.json(summary);
            } catch (err) {
                res.status(500).json({ error: 'Failed to fetch Summary' });
            }
        });

module.exports = app;
