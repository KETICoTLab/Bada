global.usespid = '//keti.re.kr';

global.defaultbodytype      = 'json';

// my CSE information
global.usecsebase           = 'Mobius';
global.usecsebadabase       = 'bada';
global.usecseid             = '/Mobius2';
global.usecsebasebadaport   = '7576';


global.usepxywsport         = '7567';
global.usepxymqttport       = '7578';
// global.usepxywsport         = '7000';
// global.usepxymqttport       = '7001';

global.use_mqtt_broker      = 'localhost'; // mqttbroker for mobius
global.use_mqtt_port = '1883';

global.use_secure           = 'disable';

// global.use_mqtt_port        = '7002';
if(use_secure === 'enable') {
    use_mqtt_port           = '8883';
}

global.wdt = require('../pxy/wdt');

global.uservi = '2a';

