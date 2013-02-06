var async = require('async')
  , Step = require('step')
  , GoogleCalendarService = require('../lib/google-calendar-service')
  , middleware;

middleware = function (req, res, next) {
  var username, currentUrl = req.url, googleCalendarService, calendars;
  if (req.session.user === undefined) {
    return res.redirect('/login?next=' + currentUrl);
  }
  username = req.session.user.name;
  Step(
    function () {
      var that = this
        , accountToken = req.session.user.googleAccountToken;
      googleCalendarService = new GoogleCalendarService(accountToken);
      googleCalendarService.init(function (err) {
        if (accountToken === undefined) {
          req.session.user.googleAccountToken = googleCalendarService.getGoogleAccountToken();
        }
        that();
      });
    },
    function (err) {
      if (err) {
        return next(err);
      }
      if (req.session.user.calendars === undefined) {
        googleCalendarService.loadCalendars(this);
      } else {
        this();
      }
    },
    function (err, calendars) {
      if (err) {
        return next(err);
      }
      if (calendars !== undefined) {
        req.session.user.calendars = calendars.items;
      }
      res.render('calendars');
    }
  );
};

module.exports = middleware;