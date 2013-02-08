var config = {
  port:3006,
  db:{
    host:'localhost',
    dbName:'google-installed-app-accounts'
  },
  routes:[
    { url:'/', middleware:'home', method:'get' },
    { url:'/login', middleware:'login' },
    { url:'/logout', middleware:'logout', method:'get' },
    { url:'/registration', middleware:'registration' },
    { url:'/approval', middleware:'approval' },
    { url:'/account', middleware:'account', method:'get' },
    { url:'/calendars', middleware:'calendars', method:'get' },
    { url:'/events/:calendarId', middleware:'events', method:'get' }
  ]
};

module.exports = config;