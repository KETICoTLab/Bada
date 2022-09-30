const java = require("java");
const path = require("path");

const base_dir = "/home/cotlab/data-collection-platform/flink-1.14.3/";
java.classpath.push(
  path.join(base_dir, "flink-clients/target/flink-clients_2.11-1.14.3.jar")
);
java.classpath.push(
  path.join(base_dir, "flink-java/target/flink-java-1.14.3.jar")
);
java.classpath.push(
  path.join(base_dir, "flink-core/target/flink-core-1.14.3.jar")
);
java.classpath.push(
  path.join(
    base_dir,
    "flink-streaming-java/target/flink-streaming-java_2.11-1.14.3.jar"
  )
);
// const kafkaSource_builder = java.import("org.apache.flink");
let kafka_source = kafkaSource.builder();
