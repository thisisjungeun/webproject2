module.exports = function(app) {
  var conn = require('./database')();
  var passport = require('passport');
  var FacebookStrategy = require('passport-facebook').Strategy;

  app.use(passport.initialize());
  app.use(passport.session());

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
      clientID: 'bigSecret',
      clientSecret: 'bigSecret',
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

  return passport;
}
