var db = require('../lib/db')
  , GoogleAccountToken = db.GoogleAccountToken
  , request = require('request')
  , middleware;

middleware = function (req, res, next) {
  var currentUrl = req.url;
  if (req.session.user === undefined) {
    return res.redirect('/login?next=' + currentUrl);
  }
  GoogleAccountToken.findOne({username:req.session.user.name}, function (err, googleAccountToken) {
    if (err) {
      return res.send(500, err);
    }
    res.render('account', { googleAccountToken:googleAccountToken });
  });
};

module.exports = middleware;