FROM golang:1.21-alpine

RUN go install github.com/air-verse/air@latest

WORKDIR /app

COPY go.mod go.sum ./

COPY . .

EXPOSE 8080

CMD ["air", "-c", ".air.toml"]