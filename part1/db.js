const mysql = require('mysql2/promise');

const db = mysql.createPool({
    host: 'localhost',
    database: ''
})