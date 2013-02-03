var db = require('../lib/db')
  , GoogleAccountToken = db.GoogleAccountToken;

module.exports = function (req, res, next) {
  var googleCalendarAccountToken;
  if (req.method === 'GET') {
    return res.render('registration', { nextUrl:req.query.next });
  }
  googleCalendarAccountToken = new GoogleAccountToken({
    username:req.session.username,
    client_id:req.body.client_id,
    client_secret:req.body.client_secret
  });
  googleCalendarAccountToken.save(function (err) {
    if (err) {
      return res.send(500, err);
    }
    res.redirect(req.body.next || '/');
  });
};