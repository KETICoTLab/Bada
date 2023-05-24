# Platform Bada

## System Specification

### Version
 - Java 1.8
 - python 2,3
 - node 14.18 

### Client Side

- [VueJS](https://vuejs.org/)

  > Dependencies

  - [axios](http://vuejs.kr/update/2017/01/04/http-request-with-axios/)
  - [vue-router](https://router.vuejs.org/kr/)

- [EChartJS](https://ecomfe.github.io/echarts-doc/public/en/index.html)
- [Bootstrap](http://getbootstrap.com/)
- [socket.io-client](https://socket.io/docs/client-api/)
- [SASS](https://sass-lang.com/guide)

### Server Side

- NodeJS

  > Dependencies

  - [express](https://expressjs.com/ko/)
  - [body-parsor](https://www.npmjs.com/package/body-parser#bodyparserjsonoptions)
  - [bcrypt-nodejs](https://www.npmjs.com/package/mysql)
  - [mysql](https://www.npmjs.com/package/mysql)
  - [response-time](https://www.npmjs.com/package/response-time)
  - [socket.io](http://socket.io/)

- [JWT](http://jwt.io)

### Database

- Mysql (Use legacy authentication method)
- Redis
- influxdb (v.1.8)
- postgresql
- kafka (v.2.11-2.4.0)
- ksqldb (v.7.3.0) 
    > 7.3.2 버전으로 설치하면 restful api로 create ddl을 사용 할 수 없었음


### Start Project
  - Mysql setup
    - Mysql database create (database name : bada)
    - import bada.sql
  - influxDB setup
    - create measurement (database name : BADA_DATA)
  - run kafka
    - bin/zookeeper-server-start.sh -daemon config/zookeeper.properties
    - bin/kafka-server-start.sh -daemon config/server.properties
    - bin/connect-distributed.sh -daemon config/connect-distributed.properties
  - ksqldb setup
    - config/ksql-server.properties의 listeners port -> 8090 으로 변경
    - bin/ksql-server-start -daemon config/ksql-server.properties
  - run bada server
    - configuration/config.json에서 db 및 다른 플랫폼 주소 설정
    - cd server
    - npm i
    - node app.js
  - run bada client
    - cd client
    - npm i 
    - npm run dev

  
##  ~~Cotlab Site~~
~~http://203.253.128.166:7576~~
