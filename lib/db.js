var mongoose = require('mongoose')
  , googleCalendarAccountTokenSchema
  , GoogleCalendarAccountToken;

mongoose.connect('localhost', 'test');

googleCalendarAccountTokenSchema = mongoose.Schema({
  username:'string',
  client_id:'string',
  client_secret:'string',
  access_token:'string',
  expires_at:'Date',
  refresh_token:'string'
});
GoogleCalendarAccountToken = mongoose.model('GoogleCalendarAccountToken', googleCalendarAccountTokenSchema);

module.exports = {
  GoogleCalendarAccountToken:GoogleCalendarAccountToken,
  disconnect: function(){
    mongoose.disconnect();
  }
};