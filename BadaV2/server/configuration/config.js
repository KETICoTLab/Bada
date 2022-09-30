module.exports = {
  jwt: { secret: "badacafe00" },
  averageCount: { responseTime: 10},
  server: {
    port: "7576"
  },
  resource: {
    limit: 5
  },
  db: {
    bada: {
      host: "127.0.0.1",
      user: "root",
      password: "keti123",
      database: "bada"
    },
    influx: {
      host: '127.0.0.1',
      username: 'root',
      password: 'Cotlab12#$',
      database: 'BADA_DATA',
      precision: 'rc3339'
    }
  },
  mobius: {
    host: 'localhost',
    port: '7579',
    cb: 'Mobius'
  },
  admin: {
    id: "admin@bada.com"
  }
}
global.usespid = '//keti.re.kr';
global.usesuperuser = 'Sponde'; //'Superman';
global.useobserver = 'Sandwich';

global.defaultbodytype      = 'json';

// my CSE information
global.usecsetype           = 'in'; // select 'in' or 'mn' or asn'
global.usecsebase           = 'Mobius';
global.usecsebadabase       = 'bada';
global.usecseid             = '/Mobius2';
global.usecsebaseport       = '7579';
global.usecsebasebadaport   = '7576';

global.usedbhost            = 'localhost';
global.usedbpass            = "keti123";

global.usepxywsport         = '7567';
global.usepxymqttport       = '7578';
// global.usepxywsport         = '7000';
// global.usepxymqttport       = '7001';

global.use_sgn_man_port     = '7599';
global.use_cnt_man_port     = '7583';
global.use_hit_man_port     = '7594';

// global.use_sgn_man_port     = '7003';
// global.use_cnt_man_port     = '7004';
// global.use_hit_man_port     = '7005';

global.usetsagentport       = '7582';
// global.usetsagentport       = '7006';

global.use_mqtt_broker      = 'localhost'; // mqttbroker for mobius

global.use_secure           = 'disable';
global.use_mqtt_port        = '1883';
// global.use_mqtt_port        = '7002';
if(use_secure === 'enable') {
    use_mqtt_port           = '8883';
}

global.useaccesscontrolpolicy = 'disable';

global.wdt = require('../pxy/wdt');


global.allowed_ae_ids = [];
//allowed_ae_ids.push('ryeubi');

global.allowed_app_ids = [];
//allowed_app_ids.push('APP01');

global.usesemanticbroker    = '10.10.202.114';

global.uservi = '2a';

global.useCert = 'disable';