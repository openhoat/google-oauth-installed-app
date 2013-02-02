module.exports = function (req, res, next) {
  if (req.method === 'GET') {
    return res.render('login', { nextUrl:req.query.next });
  }
  req.session.username = req.body.username;
  res.redirect(req.body.next || '/');
};