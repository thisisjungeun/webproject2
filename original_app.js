var express = require('express');
var app = express();
const fs = require('fs');
var multer = require('multer');
var storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function(req, file, cb) {
    cb(null, 'U' + req.user.id + file.originalname);
  }
});
var upload = multer({storage: storage});
var session = require('express-session');
var MySQLStore = require('express-mysql-session');
var bodyParser = require('body-parser');
var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;
var mysql = require('mysql');
var conn = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '329807',
  database: 'seoulinmind'
});
var JSAlert = require('js-alert');


conn.connect();
app.set('view engine', 'jade');
app.set('views', './views');
app.locals.pretty = true;
app.use(express.static('uploads'));
app.use(bodyParser.urlencoded({extended: false}));
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
app.use(passport.initialize());
app.use(passport.session());

app.get('/home', function(req, res) {
  if (req.user) {
    res.render('home');
  }
  else {
    res.render('home_stranger');
  }
});

app.param(['category', 'id'], function(req, res, next, value) {
  console.log('CALLED ONCE WITH ', value);
  next();
});

app.get('/home/:category', function(req, res) {
  var sql = "SELECT id, category, title FROM test WHERE category = ?";
  var category = req.params.category;
  conn.query(sql, [category], function(err, results) {
    if (err) {
      console.log(err);
      res.render('error/router_error');
    }
    else {
      res.render(category, {
        results: results
      });
    }
  });
});

app.get('/home/:category/:id', function(req, res) {
  var sql = "SELECT author, title, text, filename, createdDate FROM test WHERE id = ? AND category = ?";
  var category = req.params.category;
  var id = req.params.id;
  conn.query(sql, [id, category], function(err, results) {
    if (err) {
      console.log(err);
      res.render('error/router_error');
    }
    else {
      res.render('post', {
        id: id,
        category: category,
        author: results[0].author,
        title: results[0].title,
        text: results[0].text,
        userfile: '/' + results[0].filename,
        createdDate: results[0].createdDate
      });
    }
  });
}) ;

app.get('/home/contact', function(req, res) {
  res.render('contact');
});

passport.serializeUser(function(user, done) {
  done(null, user.authId);
});

passport.deserializeUser(function(id, done) {
  console.log('deserializeUser', id);
  var sql = 'SELECT * FROM users WHERE authId = ?';
  conn.query(sql, [id], function(err, results) {
    if (err) {
      console.log(err);
      done('Error: id or password is wrong.', false);
    }
    else {
      done(null, results[0]);
    }
  });
});

passport.use(new FacebookStrategy({
    clientID: '1935200200110824',
    clientSecret: '9cb0126b77adcb6a26dcc1954abf96cc',
    callbackURL: "/auth/facebook/callback",
    profileFields: ['id', 'displayName', 'email']
  },
  function(accessToken, refreshToken, profile, done) {
    console.log(profile);
    var authId = 'facebook: ' + profile.id;
    var sql = 'SELECT * FROM users WHERE authId = ?';
    conn.query(sql, [authId], function(err, results) {
      if (results.length == 0) {
        var sql = 'INSERT INTO users SET ?';
        var newuser = {
          'authId': authId,
          'displayName': profile.displayName,
          'email': profile.email
        };
        conn.query(sql, newuser, function(err, results) {
          if (err) {
            console.log(err);
            done('Error: Cannot add to a user.')
          }
          else {
            done(null, newuser);
          }
        });
      }
      else {
        done(null, results[0]);
      }
    });
  }
));

app.get(
  '/auth/facebook',
  passport.authenticate('facebook')
);

app.get(
  '/auth/facebook/callback',
  passport.authenticate(
    'facebook',
    {
      successRedirect: '/home',
      failureRedirect: '/auth/facebook'
    }
  )
);

app.get('/auth/logout', function(req, res) {
  req.session.destroy(
    (err) => {
      if (err)
        console.log(err);
      req.logout();
      res.redirect('/home');
    }
  )
});

app.get('/upload', function(req, res) {
  if (!req.user) {
    JSAlert.alert('You Should log in first!');
    res.redirect('/home');
  }
  else {
  res.render('upload');
  }
});

app.post('/upload', upload.single('userfile'), function(req, res) {
  var sql = "INSERT INTO test(author, category, title, filename, text) VALUES (?, ?, ?, ?, ?)";
  var author = req.user.displayName;
  var category = req.body.category;
  var title = req.body.title;
  var filename = 'U' + req.user.id + req.file.originalname;
  var text = req.body.text;
  conn.query(sql, [author, category, title, filename, text], function(err, results) {
    if (err) {
      console.log(err);
      res.render('error/upload_error');
    }
    else {
      JSAlert.alert('Successfully published.');
      res.redirect('/home');
    }
  });
});

app.get('/home/:category/:id/edit', function(req, res) {
  if (!req.user) {
    JSAlert.alert('You Should log in first!');
    res.redirect('/home');
  }
  else {
    var sql = "SELECT title, text FROM test WHERE id = ?";
    var category = req.params.category;
    var id = req.params.id;
    conn.query(sql, [id], function(err, results) {
      if (err) {
        console.log(err);
        res.render('error/router_error');
      }
      else {
        res.render('edit', {
          id: id,
          category: category,
          title: results[0].title,
          text: results[0].text
        });
      }
    });
  }
});

app.post('/home/:category/:id/edit', function(req, res) {
  var sql = 'UPDATE test SET category = ?, title = ?, text = ? WHERE id = ?';
  var category = req.body.category;
  var title = req.body.title;
  var text = req.body.text;
  var id = req.params.id;
  conn.query(sql, [category, title, text, id], function(err, results) {
    if (err) {
      console.log(err);
      res.render('error/edit_error');
    }
    else {
      JSAlert.alert('Successfully edited.');
      res.redirect('/home');
    }
  });
});

app.get('/home/:category/:id/delete', function(req, res) {
  if (!req.user) {
    JSAlert.alert('You Should log in first!');
    res.redirect('/home');
  }
  else {
    var sql = "SELECT filename FROM test WHERE id = ?";
    var id = req.params.id;
    var filename = '';
    conn.query(sql, [id], function(err, results) {
      if (err) {
        console.log(err);
        res.render('error/delete_error');
      }
      else {
        var filename = results[0].filename;
        console.log(filename);
      }
    });
    var sql = "DELETE FROM test WHERE id = ?";
    var filepath = 'uploads/' + filename;
    conn.query(sql, [id], function(err, results) {
      if (err) {
        console.log(err);
        res.render('error/delete_error');
      }
      else {
        fs.unlink(filepath, (err) => {
          if (err)
            console.log(err);
          else
            console.log(filename + ' is deleted.');
        });
        JSAlert.alert('Successfully deleted.');
        res.redirect('/home');
      }
    });
  }
});

app.listen(3003, function() {
  console.log('Successfully connected to port 3003');
});
