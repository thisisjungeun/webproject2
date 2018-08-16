module.exports = function(passport) {
  var route = require('express').Router();
  route.get(
    '/facebook',
    passport.authenticate('facebook')
  );

  route.get(
    '/facebook/callback',
    passport.authenticate(
      'facebook',
      {
        successRedirect: '/home',
        failureRedirect: '/auth/facebook'
      }
    )
  );

  route.get('/logout', function(req, res) {
    req.session.destroy(
      (err) => {
        if (err)
          console.log(err);
        req.logout();
        res.redirect('/home');
      }
    )
  });

  return route;
};
