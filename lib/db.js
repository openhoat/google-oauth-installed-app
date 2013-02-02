var mongoose = require('mongoose')
  , googleAccountTokenSchema
  , GoogleAccountToken;

mongoose.connect('localhost', 'test');

googleAccountTokenSchema = mongoose.Schema({
  username:'string',
  client_id:'string',
  client_secret:'string',
  access_token:'string',
  expires_at:'Date',
  refresh_token:'string'
});

GoogleAccountToken = mongoose.model('GoogleAccountToken', googleAccountTokenSchema);

module.exports = {
  GoogleAccountToken:GoogleAccountToken,
  disconnect: function(){
    mongoose.disconnect();
  }
};