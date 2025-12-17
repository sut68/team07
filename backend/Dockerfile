FROM golang:1.24-alpine AS builder

WORKDIR /app

RUN apk add --no-cache git

COPY go.mod .
COPY go.sum .

RUN go mod download

COPY . .

# -ldflags "-s -w" ช่วยลดขนาดไฟล์ Binary
RUN CGO_ENABLED=0 go build -o /goapp -ldflags "-s -w" ./main.go

FROM alpine:latest

ENV GIN_MODE=release

WORKDIR /app

COPY --from=builder /goapp /app/goapp

RUN chmod +x /app/goapp

EXPOSE 8080

CMD ["/app/goapp", "--seed"]