# Misconfigured Dockerfile with security issues
FROM ubuntu:latest

# Running as root (no USER instruction)
# Using latest tag instead of specific version

# Hardcoded secret
ENV API_KEY="sk-1234567890abcdefghijklmnop"

# Installing packages without cleaning cache
RUN apt-get update && \
    apt-get install -y curl wget

# Exposing unnecessary ports
EXPOSE 22 3306 5432

# No healthcheck defined
COPY app.py /app/

# Using ADD instead of COPY for local files
ADD config.json /app/

CMD ["python", "/app/app.py"]
