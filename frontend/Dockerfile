FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_API_URL
ARG VITE_LOCAL_API_URL
ARG VITE_CLOUDINARY_CLOUD_NAME
ARG VITE_CLOUDINARY_UPLOAD_PRESET
ARG VITE_DEMO_MODE
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY nginx-entrypoint.sh /docker-entrypoint.d/40-certs.sh

# Generate self-signed placeholder TLS certs (stored in a separate dir —
# /docker-entrypoint.d/40-certs.sh copies them to /etc/nginx/certs/ on
# startup if no custom certs have been mounted there).
# Override at runtime by mounting real mkcert certs as a volume.
RUN apk add --no-cache openssl && \
    mkdir -p /etc/nginx/certs-placeholder && \
    openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
      -keyout /etc/nginx/certs-placeholder/cert-key.pem \
      -out /etc/nginx/certs-placeholder/cert.pem \
      -subj "/C=PH/O=BarangayOS/CN=localhost" && \
    chmod +x /docker-entrypoint.d/40-certs.sh

EXPOSE 80 443
CMD ["nginx", "-g", "daemon off;"]
