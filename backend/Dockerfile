# ============================================================
# MediCare Backend – Multi-Stage Dockerfile for Cloud Deployment
# Supported by Render, Railway, AWS ECS, Fly.io, etc.
# ============================================================

# ------------------------------------------------------------
# Stage 1: Build Application with Maven & JDK 21
# ------------------------------------------------------------
FROM maven:3.9.9-eclipse-temurin-21-alpine AS builder

WORKDIR /app

# Cache dependencies first for faster rebuilds
COPY backend/pom.xml .
RUN mvn dependency:go-offline -B

# Copy application source and build executable JAR
COPY backend/src ./src
RUN mvn clean package -DskipTests -B

# ------------------------------------------------------------
# Stage 2: Production JRE Runtime
# ------------------------------------------------------------
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Run as dedicated non-root user for cloud security best practices
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy compiled JAR from builder stage
COPY --from=builder /app/target/backend-0.0.1-SNAPSHOT.jar app.jar

RUN chown -R appuser:appgroup /app
USER appuser

# Render sets PORT dynamically (default: 8080)
ENV PORT=8080
EXPOSE 8080

# Container healthcheck targeting the public /api/health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=45s --retries=3 \
  CMD wget -q --spider http://localhost:${PORT}/api/health || exit 1

ENTRYPOINT ["sh", "-c", "java -Dserver.port=${PORT} -jar app.jar"]
