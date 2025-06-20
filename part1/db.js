const mysql = require('mysql2/promise');

const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    passowrd
    database: 'DogWalkService'
});

module.exports = db;
