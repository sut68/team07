FROM golang:1.24 AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

# Build Binary (CGO_ENABLED=0 คือ Build แบบ Static ไม่ต้องพึ่ง Library เครื่อง)
RUN CGO_ENABLED=1 GOOS=linux go build -o /goapp ./main.go

FROM debian:bookworm-slim

WORKDIR /app

# ลง CA-Certificates เผื่อต้องยิง HTTPS ไปข้างนอก (SendGrid/Database)
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*

COPY --from=builder /goapp /app/goapp

# Create necessary directories
RUN mkdir -p /app/lib /app/controller/filter/data /app/uploads

# Copy AI Model assets and Libraries
COPY --from=builder /app/lib /app/lib
COPY --from=builder /app/controller/filter/data /app/controller/filter/data

EXPOSE 8080

CMD ["/app/goapp"]