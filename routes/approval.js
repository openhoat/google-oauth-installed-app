var db = require('../lib/db')
  , GoogleAccountToken = db.GoogleAccountToken
  , middleware;

function requestAuth(req, res, client_id) {
  var google_auth_url = 'https://accounts.google.com/o/oauth2/auth?'
    + 'response_type=code'
    + '&client_id=' + client_id
    + '&redirect_uri=http://localhost:3000'
    + '&scope=https://www.googleapis.com/auth/calendar';
  return res.redirect(google_auth_url);
}

middleware = function (req, res, next) {
  var username, currentUrl = req.url;
  username = req.session.username || (req.session.user && req.session.user.name);
  GoogleAccountToken.findOne({username:username}, function (err, googleAccountToken) {
    if (err) {
      return res.send(500, err);
    }
    req.session.username = username;
    if (googleAccountToken === null) {
      return res.redirect('/registration?next=' + currentUrl);
    }
    return requestAuth(req, res, googleAccountToken.client_id);
  });
};

module.exports = middleware;