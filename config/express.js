module.exports = function() {
  var express = require('express');
  var app = express();
  var session = require('express-session');
  var MySQLStore = require('express-mysql-session');

  app.set('view engine', 'jade');
  app.set('views', './views');
  app.locals.pretty = true;
  app.use(express.static('uploads'));
  app.use(session({
    secret: 'riggle098#wiggle643&%',
    resave: false,
    saveUninitialized: true,
    store: new MySQLStore({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: '329807',
      database: 'seoulinmind'
    })
  }));

  return app;
};
