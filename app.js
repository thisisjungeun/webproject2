var app = require('./config/express')();
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
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: false}));
var JSAlert = require('js-alert');

var passport = require('./config/passport')(app);
var auth = require('./config/auth')(passport);
var conn = require('./config/database')();
app.use('/auth', auth);

app.get('/home', function(req, res) {
  if (req.user) {
    res.render('home');
  }
  else {
    res.render('home_stranger');
  }
});

app.get('/home/contact', function(req, res) {
  res.render('contact');
});

app.param(['category', 'id'], function(req, res, next, value) {
  console.log('CALLED ONCE WITH ', value);
  next();
});

app.get('/home/:category', function(req, res) {
  var sql = "SELECT id, category, title FROM content WHERE category = ?";
  var category = req.params.category;
  conn.query(sql, [category], function(err, results) {
    if (err) {
      console.log(err);
      res.render('error/router_error');
    }
    else {
      res.render('categories/'+ category, {
        results: results
      });
    }
  });
});

app.get('/home/:category/:id', function(req, res) {
  var sql = "SELECT author, title, text, filename, createdDate FROM content WHERE id = ? AND category = ?";
  var category = req.params.category;
  var id = req.params.id;
  conn.query(sql, [id, category], function(err, results) {
    if (err) {
      console.log(err);
      res.render('error/router_error');
    }
    else {
      res.render('crud/post', {
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
});

app.get('/upload', function(req, res) {
  if (!req.user) {
    JSAlert.alert('You Should log in first!');
    res.redirect('/home');
  }
  else {
  res.render('crud/upload');
  }
});

app.post('/upload', upload.single('userfile'), function(req, res) {
  var sql = "INSERT INTO content(author, category, title, filename, text) VALUES (?, ?, ?, ?, ?)";
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
    var sql = "SELECT title, text FROM content WHERE id = ?";
    var category = req.params.category;
    var id = req.params.id;
    conn.query(sql, [id], function(err, results) {
      if (err) {
        console.log(err);
        res.render('error/router_error');
      }
      else {
        res.render('crud/edit', {
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
  var sql = 'UPDATE content SET category = ?, title = ?, text = ? WHERE id = ?';
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
    var sql = "SELECT filename FROM content WHERE id = ?";
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
    var sql = "DELETE FROM content WHERE id = ?";
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
