
FROM maven:3.9.8-amazoncorretto-21 AS build
WORKDIR /app
COPY pom.xml .
#COPY ../.env .
COPY src ./src

RUN mvn clean package -DskipTests -Dmaven.test.skip=true

#Stage 2: create image
FROM amazoncorretto:21.0.4
WORKDIR /app
EXPOSE 8080
COPY --from=build /app/target/*jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]
