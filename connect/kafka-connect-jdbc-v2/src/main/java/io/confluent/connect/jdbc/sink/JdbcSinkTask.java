/*
 * Copyright 2018 Confluent Inc.
 *
 * Licensed under the Confluent Community License (the "License"); you may not use
 * this file except in compliance with the License.  You may obtain a copy of the
 * License at
 *
 * http://www.confluent.io/confluent-community-license
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OF ANY KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations under the License.
 */

package io.confluent.connect.jdbc.sink;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.kafka.clients.consumer.OffsetAndMetadata;
import org.apache.kafka.clients.producer.KafkaProducer;
import org.apache.kafka.clients.producer.Producer;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.apache.kafka.common.TopicPartition;
import org.apache.kafka.connect.errors.ConnectException;
import org.apache.kafka.connect.errors.RetriableException;
import org.apache.kafka.connect.sink.ErrantRecordReporter;
import org.apache.kafka.connect.sink.SinkRecord;
import org.apache.kafka.connect.sink.SinkTask;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.sql.SQLException;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;
import java.util.Properties;

import io.confluent.connect.jdbc.dialect.DatabaseDialect;
import io.confluent.connect.jdbc.dialect.DatabaseDialects;
import io.confluent.connect.jdbc.util.Version;

@SuppressWarnings("unchecked")
public class JdbcSinkTask extends SinkTask {
  private static final Logger log = LoggerFactory.getLogger(JdbcSinkTask.class);
  private final ObjectMapper objectMapper = new ObjectMapper();

  ErrantRecordReporter reporter;
  DatabaseDialect dialect;
  JdbcSinkConfig config;
  JdbcDbWriter writer;
  int remainingRetries;
  Properties kafkaProps = new Properties();
  Producer<String, String> producer;

  @Override
  public void start(final Map<String, String> props) {
    log.info("Starting JDBC Sink task");
    config = new JdbcSinkConfig(props);
    initWriter();
    remainingRetries = config.maxRetries;
    try {
      reporter = context.errantRecordReporter();
    } catch (NoSuchMethodError | NoClassDefFoundError e) {
      // Will occur in Connect runtimes earlier than 2.6
      reporter = null;
    }

    System.out.println(this.config.kafkaUrl);
    this.kafkaProps.put("bootstrap.servers", this.config.kafkaUrl);
    this.kafkaProps.put("acks", "all");
    this.kafkaProps.put("retries", 0);
    this.kafkaProps.put("batch.size", 16384);
    this.kafkaProps.put("linger.ms", 1);
    this.kafkaProps.put("buffer.memory", 33554432);
    String keySerializer = "org.apache.kafka.common.serialization.StringSerializer";
    String valueSerializer = "org.apache.kafka.common.serialization.StringSerializer";
    this.kafkaProps.put("key.serializer", keySerializer);
    this.kafkaProps.put("value.serializer", valueSerializer);
    try {
      this.producer = new KafkaProducer<String, String>(this.kafkaProps);
    } catch (Exception e) {
      System.out.println(e);
    }
  }

  void initWriter() {
    if (config.dialectName != null && !config.dialectName.trim().isEmpty()) {
      dialect = DatabaseDialects.create(config.dialectName, config);
    } else {
      dialect = DatabaseDialects.findBestFor(config.connectionUrl, config);
    }
    final DbStructure dbStructure = new DbStructure(dialect);
    log.info("Initializing writer using SQL dialect: {}", dialect.getClass().getSimpleName());
    writer = new JdbcDbWriter(config, dialect, dbStructure);
  }

  public static Map<String, Object> keyChangeLowerMap(Map<String, Object> param) {
    Iterator<String> iteratorKey = param.keySet().iterator();
    Map<String, Object> newMap = new HashMap<>();
    while (iteratorKey.hasNext()) {
      String key = iteratorKey.next();
      newMap.put(key.toLowerCase(), param.get(key));
    }
    return newMap;
  }

  public static Double checkDoubleType(Object o) {
    try {
      return Double.valueOf(String.valueOf(o));
    } catch (Exception e) {
      return 0.0;
    }
  }

  @Override
  public void put(Collection<SinkRecord> records) {
    if (records.isEmpty()) {
      return;
    }
    final SinkRecord first = records.iterator().next();
    Map<String, Object> conField = (Map<String, Object>) first.value();
    conField  = keyChangeLowerMap(conField);
    String recordKey = first.key().toString();
    String[] pi = recordKey.split("/");
    String ae = pi[2];
    String cnt = pi[3];

    // prod kafka
    Map<String, Object> kafkaProdData = new HashMap<>();
    kafkaProdData.put("latitude", checkDoubleType(conField.get("latitude")));
    kafkaProdData.put("longitude", checkDoubleType(conField.get("longitude")));
    kafkaProdData.put("altitude", checkDoubleType(conField.get("altitude")));
    kafkaProdData.put("applicationentity", ae);
    kafkaProdData.put("container", cnt);

    final int recordsCount = records.size();
    log.debug(
        "Received {} records. First record kafka coordinates:({}-{}-{}). Writing them to the "
        + "database...",
        recordsCount, first.topic(), first.kafkaPartition(), first.kafkaOffset()
    );
    try {
      writer.write(records);
      prodKafka("refine.spatial", kafkaProdData);
    } catch (TableAlterOrCreateException tace) {
      if (reporter != null) {
        unrollAndRetry(records);
      } else {
        throw tace;
      }
    } catch (SQLException sqle) {
      log.warn(
          "Write of {} records failed, remainingRetries={}",
          records.size(), remainingRetries, sqle);
      int totalExceptions = 0;
      for (Throwable e :sqle) {
        totalExceptions++;
      }
      SQLException sqlAllMessagesException = getAllMessagesException(sqle);
      if (remainingRetries > 0) {
        writer.closeQuietly();
        initWriter();
        remainingRetries--;
        context.timeout(config.retryBackoffMs);
        throw new RetriableException(sqlAllMessagesException);
      } else {
        if (reporter != null) {
          unrollAndRetry(records);
        } else {
          log.error(
              "Failing task after exhausting retries; "
                  + "encountered {} exceptions on last write attempt. "
                  + "For complete details on each exception, please enable DEBUG logging.",
              totalExceptions);
          int exceptionCount = 1;
          for (Throwable e : sqle) {
            log.debug("Exception {}:", exceptionCount++, e);
          }
          throw new ConnectException(sqlAllMessagesException);
        }
      }
    } catch (Exception e) {
      log.error("Kafka produce error : \n" + e);
    }
    remainingRetries = config.maxRetries;
  }

  private void unrollAndRetry(Collection<SinkRecord> records) {
    writer.closeQuietly();
    for (SinkRecord record : records) {
      try {
        writer.write(Collections.singletonList(record));
      } catch (TableAlterOrCreateException tace) {
        reporter.report(record, tace);
        writer.closeQuietly();
      } catch (SQLException sqle) {
        SQLException sqlAllMessagesException = getAllMessagesException(sqle);
        reporter.report(record, sqlAllMessagesException);
        writer.closeQuietly();
      }
    }
  }

  private void prodKafka(String topic, Map<String, Object> data) throws Exception {
    this.producer.send(new ProducerRecord<String, String>(topic, objectMapper.writeValueAsString(data)));
    log.info("Message sent to kafka successfully" + data);
  }

  private SQLException getAllMessagesException(SQLException sqle) {
    String sqleAllMessages = "Exception chain:" + System.lineSeparator();
    for (Throwable e : sqle) {
      sqleAllMessages += e + System.lineSeparator();
    }
    SQLException sqlAllMessagesException = new SQLException(sqleAllMessages);
    sqlAllMessagesException.setNextException(sqle);
    return sqlAllMessagesException;
  }

  @Override
  public void flush(Map<TopicPartition, OffsetAndMetadata> map) {
    // Not necessary
  }

  public void stop() {
    log.info("Stopping task");
    try {
      writer.closeQuietly();
    } finally {
      try {
        if (dialect != null) {
          dialect.close();
        }
      } catch (Throwable t) {
        log.warn("Error while closing the {} dialect: ", dialect.name(), t);
      } finally {
        dialect = null;
      }
    }
    if (null != this.producer) {
      log.info("stop() - Closing Kafka Producer.");
      this.producer.close();
    }
  }

  @Override
  public String version() {
    return Version.getVersion();
  }

}
