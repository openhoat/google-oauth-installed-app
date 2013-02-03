var GoogleCalendarService = require('./lib/google-calendar-service')
  , Step = require('step')
  , username = process.argv[2]
  , googleCalendarService = new GoogleCalendarService(username);

function exitError(msg, err) {
  if (msg) {
    console.error(msg);
  } else {
    console.error('Error !');
  }
  if (err) {
    console.error(err.stack);
  }
}

Step(
  function () {
    googleCalendarService.init(this);
  },
  function (err) {
    if (err) {
      return exitError(null, err);
    }
    googleCalendarService.loadCalendars(this);
  },
  function (err, calendars) {
    calendars.items.forEach(function (calendar) {
      googleCalendarService.loadCalendarEvents(calendar.id, function (err, calendarEvents) {
        if (err) {
          return exitError(null, err);
        }
        calendarEvents.items.forEach(function (calendarEvent) {
          console.log('[%s] - calendar %s : %s [%s - %s] @ %s',
            calendar.id,
            calendar.summary,
            calendarEvent.summary,
            calendarEvent.start,
            calendarEvent.end,
            calendarEvent.location
          );
        });
      });
    });
    this();
  }
);