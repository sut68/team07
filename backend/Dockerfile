FROM golang:1.24-alpine AS builder

WORKDIR /app

RUN apk add --no-cache git

COPY go.mod go.sum ./
RUN go mod download

COPY . .

# Build Binary (CGO_ENABLED=0 คือ Build แบบ Static ไม่ต้องพึ่ง Library เครื่อง)
RUN CGO_ENABLED=0 GOOS=linux go build -o /goapp -ldflags "-s -w" ./main.go

FROM alpine:latest

WORKDIR /app

COPY --from=builder /goapp /app/goapp

RUN mkdir -p /app/uploads
RUN mkdir -p /app/chatsave

EXPOSE 8080

CMD ["/app/goapp"]