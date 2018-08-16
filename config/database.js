module.exports = function() {
  var mysql = require('mysql');
  var conn = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '329807',
    database: 'seoulinmind'
  });
  conn.connect();
  return conn;
};
