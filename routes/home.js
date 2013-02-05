var middleware = function (req, res, next) {
  res.render('home');
};

module.exports = middleware;