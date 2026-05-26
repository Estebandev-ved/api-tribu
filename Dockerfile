# Paso 1: Compilar la aplicación con Maven y Java 21
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
# Descargar dependencias para guardarlas en caché y acelerar futuras compilaciones
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn clean package -DskipTests

# Paso 2: Ejecutar la aplicación con una imagen ligera de Java 21
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app
COPY --from=build /app/target/api-tribu-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
