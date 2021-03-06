var db = require('../lib/db')
  , GoogleAccountToken = db.GoogleAccountToken
  , middleware;

middleware = function (req, res, next) {
  var nextUrl = req.query.next || '/', googleAccountToken;
  if (req.method === 'GET') {
    return res.render('registrationForm', { username: req.session.username, nextUrl:nextUrl });
  }
  nextUrl = req.body.next || '/';
  googleAccountToken = new GoogleAccountToken({
    username:req.body.username,
    client_id:req.body.client_id,
    client_secret:req.body.client_secret
  });
  googleAccountToken.save(function (err) {
    if (err) {
      return res.send(500, err);
    }
    req.session.user = {
      name:req.body.username,
      googleAccountToken:googleAccountToken
    };
    res.redirect(nextUrl);
  });
};

module.exports = middleware;