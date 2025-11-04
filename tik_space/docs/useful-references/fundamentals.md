# Fundamentals

Usefully commands:
```shell
rm ~/Library/Application\ Support/JetBrains/IntelliJIdea2024.1/options/other.xml
rm ~/Library/Preferences/com.apple.java.util.prefs.plist
rm ~/Library/Preferences/com.jetbrains.intellij.plist
```

Spring Boot - Kafka - Protobuf: (
link)[https://github.com/hal90210/spring-kafka-protobuf/tree/master/src/main/java/com/improving/springprotobuf]

Scalable System Implementation using RabbitMQ, Java, and
MySQL: [link](https://blog.devgenius.io/scalable-system-implementation-using-rabbitmq-java-and-mysql-2d5fe0fa182e)

USING POSTGRES AS A MESSAGE QUEUE: [link](https://www.javaadvent.com/2022/12/using-postgres-as-a-message-queue.html)

Spring Cloud Supported Versions: [link](https://github.com/spring-cloud/spring-cloud-release/wiki/Supported-Versions)

Microservice Implementation using Spring Cloud with Docker: Netflix
Stack: [link](https://blog.devgenius.io/microservice-implementation-using-spring-cloud-with-docker-netflix-stack-76a367a5cf05)

springboot-oauth2-with-keycloak-as-provider: [link](https://ravthiru.medium.com/springboot-oauth2-with-keycloak-as-provider-c31b2897e913)

An ELK stack from scratch with Docker [link](https://viblo.asia/p/an-elk-stack-from-scratch-with-docker-gGJ596zjKX2)

Distributed Tracing in Micoservices using Zipkin, Sleuth and ELK
Stack. [link](https://medium.com/swlh/distributed-tracing-in-micoservices-using-spring-zipkin-sleuth-and-elk-stack-5665c5fbecf)

spring-security-without-the-websecurityconfigureradapter. [link](https://spring.io/blog/2022/02/21/spring-security-without-the-websecurityconfigureradapter)

Scaling WebSockets in Spring
services: [link](https://medium.com/javarevisited/scaling-websockets-in-spring-services-27023f59868c)

Spring Boot with ReactJS using Gradle plugins: [link](https://www.youtube.com/watch?v=2GPvZEfzy8A)

Mixing Java & Python: [link](https://elib.dlr.de/59394/1/Mixing_Python_and_Java.pdf)

Integrating Oracle and
Kafka: [link](https://github.com/confluentinc/demo-scene/blob/master/oracle-and-kafka/demo_integrating_oracle_kafka.adoc)

Axon hotel demo: [link](https://github.com/AxonIQ/hotel-demo)

Bash-completion: https://velero.io/docs/v1.17/customize-installation/#optional-velero-cli-configurations

30000, 30001, 30002, 30008, 30080, 30081, 30082, 30227, 30296, 30304, 30390, 30391, 30443, 30645, 30681, 30687, 30709, 30710, 30711, 30800, 30801, 30802, 30803, 30880, 31022, 31081, 31082, 31090, 31100, 31148, 31217, 31275, 31317, 31442, 31495, 31505, 31533, 31543, 31632, 31646, 31886, 32063, 32088, 32153, 32205, 32285, 32308, 32309, 32502, 32546, 32622, 32670, 32749

velero install \
--provider aws \
--plugins velero/velero-plugin-for-aws:v1.9.0 \
--bucket velero-backup \
--secret-file ./credentials-velero \
--use-restic \
--backup-location-config region=minio,s3ForcePathStyle="true",s3Url=http://minio-service.minio:9000