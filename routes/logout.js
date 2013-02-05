var middleware = function (req, res, next) {
  delete req.session.user;
  req.session.message = 'You are now logged out';
  res.redirect(req.body.next || '/');
};

module.exports = middleware;