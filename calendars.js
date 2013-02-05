var async = require('async')
  , db = require('./lib/db')
  , Step = require('step')
  , GoogleCalendarService = require('./lib/google-calendar-service')
  , username = process.argv[2]
  , googleCalendarService = new GoogleCalendarService(username);

function exitError(msg, err) {
  if (msg) {
    console.error(msg);
  } else {
    console.error('Error !');
  }
  console.error(err);
  if (err.stack) {
    console.error(err.stack);
  }
  db.disconnect();
}

Step(
  function () {
    db.connect();
    googleCalendarService.init(this);
  },
  function (err) {
    if (err) {
      return exitError(null, err);
    }
    googleCalendarService.loadCalendars(this);
  },
  function (err, calendars) {
    if (err) {
      return exitError(null, err);
    }
    async.forEachSeries(calendars.items, function (calendar, nextCalendar) {
      console.log('[%s] - calendar %s', calendar.id, calendar.summary);
      googleCalendarService.loadCalendarEvents(calendar.id, {showdeleted:true}, function (err, calendarEvents) {
        if (err) {
          console.error('err :', err);
          return nextCalendar();
        }
        if (calendarEvents.items) {
          async.forEachSeries(calendarEvents.items, function (calendarEvent, nextCalendarEvent) {
            console.log('event %s : %s [%s - %s] @ %s',
              calendarEvent.id,
              calendarEvent.summary,
              calendarEvent.start ? calendarEvent.start.startTime : 'undefined',
              calendarEvent.end ? calendarEvent.end.endTime : 'undefined',
              calendarEvent.location
            );
            nextCalendarEvent();
          }, function () {
            nextCalendar();
          });
        } else {
          nextCalendar();
        }
      });
    }, function () {
      console.log('done');
      db.disconnect();
    });
  }
);