var Profilemon = require('./index');
var profilemon = new Profilemon({interval: 2000, url: 'mongodb://localhost:27017/test'});

profilemon.on('profilemon', function(data){
  console.log('profilemon',JSON.stringify(data));
});

profilemon.start();

// setTimeout(function(){
//   profilemon.stop();
// },5000);