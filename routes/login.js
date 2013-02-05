var db = require('../lib/db')
  , GoogleAccountToken = db.GoogleAccountToken
  , request = require('request')
  , middleware;

function requestAuth(res, client_id) {
  var google_auth_url = 'https://accounts.google.com/o/oauth2/auth?'
    + 'response_type=code'
    + '&client_id=' + client_id
    + '&redirect_uri=urn:ietf:wg:oauth:2.0:oob'
    + '&scope=https://www.googleapis.com/auth/calendar';
  return res.redirect('/approval?client_id=' + client_id);
  //return res.render('auth', {google_auth_url: google_auth_url});
  //return res.redirect(google_auth_url);
}

middleware = function (req, res, next) {
  var username, currentUrl = req.url, nextUrl = req.query.next || '/';
  if (req.session.username === undefined && req.method === 'GET') {
    return res.render('loginForm', { nextUrl:nextUrl });
  }
  nextUrl = req.query.next || req.body.next || '/';
  username = req.session.username || req.body.username;
  GoogleAccountToken.findOne({username:username}, function (err, googleAccountToken) {
    if (err) {
      return res.send(500, err);
    }
    req.session.username = username;
    if (googleAccountToken === null) {
      return res.redirect('/registration?next=' + currentUrl);
    }
    if (googleAccountToken.access_token === undefined) {
      return res.redirect('/approval?client_id=' + googleAccountToken.client_id + '&next=' + nextUrl);
    }
    delete req.session.username;
    req.session.user = {
      name:username,
      googleAccountToken:googleAccountToken
    };
    res.redirect(nextUrl);
  });
};

module.exports = middleware;