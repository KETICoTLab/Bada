/**
 * Copyright © 2017 Jeremy Custenborder (jcustenborder@gmail.com)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.github.jcustenborder.kafka.connect.influxdb;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.jcustenborder.kafka.connect.utils.VersionUtil;
import org.apache.kafka.clients.producer.KafkaProducer;
import org.apache.kafka.clients.producer.Producer;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.apache.kafka.connect.data.Schema;
import org.apache.kafka.connect.data.SchemaBuilder;
import org.apache.kafka.connect.sink.SinkRecord;
import org.apache.kafka.connect.sink.SinkTask;
import org.influxdb.InfluxDB;

import org.influxdb.dto.BatchPoints;
import org.influxdb.dto.Point;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;


import org.w3c.dom.ranges.RangeException;
import redis.clients.jedis.Jedis;
import redis.clients.jedis.JedisPool;
import redis.clients.jedis.JedisPoolConfig;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.Map;
import java.util.Properties;

public class InfluxDBSinkTask extends SinkTask {
  private static final Logger log = LoggerFactory.getLogger(com.github.jcustenborder.kafka.connect.influxdb.InfluxDBSinkTask.class);
  InfluxDBSinkConnectorConfig config;
  InfluxDBFactory factory = new InfluxDBFactoryImpl();
  InfluxDB influxDB;
  ObjectMapper objectMapper = new ObjectMapper();

  JedisPoolConfig jedisPoolConfig = new JedisPoolConfig();
  JedisPool pool;
  Jedis jedis;


  /*
   * For Kafka Produce
   */
  Properties props = new Properties();
  Producer<String, String> producer;

  @Override
  public String version() {
    return VersionUtil.version(this.getClass());
  }

  @Override
  public void start(Map<String, String> settings) {
    this.config = new InfluxDBSinkConnectorConfig(settings);
    this.influxDB = this.factory.create(this.config);

    this.pool = new JedisPool(this.jedisPoolConfig, this.config.redisUrl, this.config.redisPort, 3000);
    this.jedis = this.pool.getResource(); //thread, db pool처럼 필요할 때마다 getResource()로 받아서 쓰고 다 쓰면 close로 닫아야 한다.s


    this.props.put("bootstrap.servers", String.format("%s:%s", this.config.kafkaUrl, this.config.kafkaPort));
    this.props.put("acks", "all");
    this.props.put("retries", 0);
    this.props.put("batch.size", 16384);
    this.props.put("linger.ms", 1);
    this.props.put("buffer.memory", 33554432);
    this.props.put("key.serializer", "org.apache.kafka.common.serialization.StringSerializer");
    this.props.put("value.serializer", "org.apache.kafka.common.serialization.StringSerializer");
    this.producer = new KafkaProducer<String, String>(this.props);
  }

  static final Schema TAG_OPTIONAL_SCHEMA = SchemaBuilder.map(Schema.STRING_SCHEMA, Schema.STRING_SCHEMA).optional().build();

  public static boolean isNumeric(String s) {
    try {
      Double.parseDouble(s);
      System.out.println(Double.parseDouble(s));
      return true;
    } catch (NumberFormatException e) {
      return false;
    }
  }
  @Override
  public void put(Collection<SinkRecord> records) {
    if (null == records || records.isEmpty()) {
      return;
    }
    Map<PointKey, Map<String, Object>> builders = new HashMap<>(records.size());
    for (SinkRecord record : records) {

      //Sink Record Parsing
      Map<String, Object> conJson = (Map<String, Object>) record.value();
      String recordKey = record.key().toString();
      String[] pi = recordKey.split("/");
      String ae = pi[2], cnt = pi[3];
      String measurement = ae;

      Boolean errorFlag = false;


      final Map<String, String> tags = new HashMap<String, String>();
      tags.put("Container", cnt);
      final long time = record.timestamp();
      PointKey key = PointKey.of(measurement, time, tags);
      PointKey errorKey = PointKey.of("error", time, tags);

      String path = String.format("/%s/%s", ae, cnt);
      Map<String, String> dataModel = new HashMap<>();
      String dm = jedis.hget("datamodel", path);  //{\"field1\":\"string\",\"field2\":\"float\"}
      ArrayList<String> fieldKeys = new ArrayList<String>(conJson.keySet());

      if (dm == null) {
        // type Float, String으로 자동 추론
        Map<String, Object> fields = builders.computeIfAbsent(key, pointKey -> new HashMap<>(100));
        for (String fieldKey : fieldKeys) {
          Object o = conJson.get(fieldKey);
          String dataType = o.getClass().getSimpleName();

          String fieldName = String.format("%s.%s.%s", ae, cnt, fieldKey);
          // if (dataType.equals("Byte") || dataType.equals("Short") || dataType.equals("Integer") || dataType.equals("Long") || dataType.equals("Double") || dataType.equals("Float")) {
          if (isNumeric(String.valueOf(o))) {
            fields.put(fieldName, Double.valueOf(String.valueOf(o)));
//            fields.put(fieldName, o);
          } else {
            fields.put(fieldName, String.valueOf(o));
          }
        }
      } else {
        dm = dm.replaceAll("[{}\"]", "");
        String[] splitdm = dm.split(",");
        for (String s1 : splitdm) {
          String[] keyValue = s1.split(":");
          dataModel.put(keyValue[0], keyValue[1]);
        }
        
        ArrayList<String> dmKeySet = new ArrayList<String>(dataModel.keySet());

        if (fieldKeys.equals(dmKeySet)) { // 데이터 KeySet이 모델과 같은 경우
          Map<String, Object> fields = builders.computeIfAbsent(key, pointKey -> new HashMap<>(100));
          //유효성 검증 (valueof로 형변환 안되는 경우)
          for (String fieldKey : fieldKeys) {
            Object o = conJson.get(fieldKey);
            Object dmO = dataModel.get(fieldKey);
            String fieldName = String.format("%s.%s.%s", ae, cnt, fieldKey);
            try {
              if (dmO.equals("string")) {
                fields.put(fieldName, String.valueOf(o));
              } else if (dmO.equals("float")) {
                fields.put(fieldName, Double.valueOf(String.valueOf(o)));
              } else if (dmO.equals("integer")) {
                fields.put(fieldName, Long.valueOf(String.valueOf(o)));
              } else if (dmO.equals("boolean")) {
                fields.put(fieldName, Boolean.valueOf(String.valueOf(o)));
              }
            } catch (NumberFormatException | RangeException e) {
              builders.remove(key);
              Map<String, Object> errfields = builders.computeIfAbsent(errorKey, pointKey -> new HashMap<>(100));
              // 데이터의 타입이 모델과 다른 경우
              errfields.put("ApplicationEntity", ae);
              errfields.put("record", conJson.toString());
              errfields.put("datamodel", dataModel.toString());
              errfields.put("errorMessage", "The data type is different from the model.");
              errorFlag = true;
            }
          }


        } else {
          fieldKeys.retainAll(dmKeySet); // dmKeyset과 fieldKeys와의 교집합만을 남겨둠
          if (fieldKeys.equals(dmKeySet)) { // 데이터의 KeySet이 데이터 모델보다 더 많은 경우
            Map<String, Object> fields = builders.computeIfAbsent(key, pointKey -> new HashMap<>(100));
            // 유효성 검증
            for (String fieldKey : fieldKeys) {
              Object o = conJson.get(fieldKey);
              Object dmO = dataModel.get(fieldKey);
              String fieldName = String.format("%s.%s.%s", ae, cnt, fieldKey);
              try {
                if (dmO.equals("string")) {
                  fields.put(fieldName, String.valueOf(o));
                } else if (dmO.equals("float")) {
                  fields.put(fieldName, Double.valueOf(String.valueOf(o)));
                } else if (dmO.equals("integer")) {
                  fields.put(fieldName, Long.valueOf(String.valueOf(o)));
                } else if (dmO.equals("boolean")) {
                  fields.put(fieldName, Boolean.valueOf(String.valueOf(o)));
                }
              } catch (NumberFormatException | RangeException e) {
                builders.remove(key);
                Map<String, Object> errfields = builders.computeIfAbsent(errorKey, pointKey -> new HashMap<>(100));
                // 데이터의 타입이 모델과 다른 경우
                errfields.put("ApplicationEntity", ae);
                errfields.put("record", conJson.toString());
                errfields.put("datamodel", dataModel.toString());
                errfields.put("errorMessage", "The data type is different from the model.");
                errorFlag = true;
              }
            }

          } else { // 데이터의 KeySet이 데이터 모델보다 더 적은 경우
            Map<String, Object> errfields = builders.computeIfAbsent(errorKey, pointKey -> new HashMap<>(100));
            errfields.put("ApplicationEntity", ae);
            errfields.put("record", conJson.toString());
            errfields.put("datamodel", dataModel.toString());
            errfields.put("errorMessage", "The data field is different from the model.");
            errorFlag = true;
          }
        }
      }

      if (!errorFlag) {
        // Produce Kafka Data
        String kafkaTopic = String.format("refine.%s.%s", ae, cnt);
        Map<String, Object> kafkaData = new HashMap<>();
        kafkaData = conJson;
        kafkaData.put("APPLICATIONENTITY", ae);
        kafkaData.put("CONTAINER", cnt);
        try {
          this.producer.send(new ProducerRecord<String, String>(kafkaTopic, recordKey, objectMapper.writeValueAsString(kafkaData))); //topic, data
          log.info("Message sent successfully" + kafkaData);
        } catch (Exception e) {
          log.error("Kafka Produce Exception : " + e);
        }
      }


    }


    BatchPoints.Builder batchBuilder = BatchPoints.database(this.config.database).consistency(this.config.consistencyLevel);
    for (Map.Entry<PointKey, Map<String, Object>> values : builders.entrySet()) {
      final Point.Builder builder = Point.measurement(values.getKey().measurement);
      builder.time(values.getKey().time, this.config.precision);
      if (null != values.getKey().tags || values.getKey().tags.isEmpty()) {
        builder.tag(values.getKey().tags);
      }
      builder.fields(values.getValue());
      builder.addField("APPLICATIONENTITY", values.getKey().measurement);
      builder.addField("CONTAINER", values.getKey().tags.get("Container"));
      Point point = builder.build();
      if (log.isTraceEnabled()) {
        log.trace("put() - Adding point {}", point.toString());
      }
      batchBuilder.point(point);
    }
    BatchPoints batch = batchBuilder.build();
    try {
      this.influxDB.write(batch);
    } catch (Exception e) {
      log.error(String.valueOf(e));

      BatchPoints.Builder errbatchBuilder = BatchPoints.database(this.config.database).consistency(this.config.consistencyLevel);
      final Point.Builder builder = Point.measurement("error");
      builder.time(System.currentTimeMillis(), this.config.precision);
      builder.addField("errorMessage", String.valueOf(e));
      Point point = builder.build();
      errbatchBuilder.point(point);
      BatchPoints errbatch = errbatchBuilder.build();
      if (log.isTraceEnabled()) {
        log.trace("put() - Adding point {}", point.toString());
      }
      try {
        this.influxDB.write(errbatch);
      } catch (Exception err) {
        log.error(String.valueOf(err));
      }

    }

  }


  @Override
  public void stop() {
    if (null != this.influxDB) {
      log.info("stop() - Closing InfluxDB client.");
      this.influxDB.close();
    }
    if (null != this.jedis) {
      log.info("stop() - Closing Jedis client.");
      this.jedis.close();
    }
    this.pool.close();
    if (null != this.producer) {
      log.info("stop() - Closing Kafka Producer.");
      this.producer.close();
    }
  }
}
