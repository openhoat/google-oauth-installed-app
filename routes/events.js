var Step = require('step')
  , GoogleCalendarService = require('../lib/google-calendar-service')
  , middleware;

middleware = function (req, res, next) {
  var username, googleCalendarService, googleAccountToken, calendarId;
  Step(
    function () {
      if (req.session.user === undefined) {
        return res.redirect('/login?next=' + req.url);
      }
      username = req.session.user.name;
      googleAccountToken = req.session.user.googleAccountToken;
      if (googleAccountToken === undefined) {
        return res.redirect('/calendars?next=' + req.url);
      }
      calendarId = req.params.calendarId;
      googleCalendarService = new GoogleCalendarService(googleAccountToken);
      googleCalendarService.init(this);
    },
    function (err) {
      if (err) {
        return next(err);
      }
      googleCalendarService.loadCalendarEvents(calendarId, {showdeleted:true}, function (err, calendarEvents) {
        if (err) {
          return next(err);
        }
        res.render('events', { events:calendarEvents.items });
      });
    }
  );
};

module.exports = middleware;