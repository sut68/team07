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

CMD ["/app/goapp"]

# docker compose up -d --build
# docker exec -it capstone_backend ./goapp --seed   (ครั้งแรกเท่านั้น)
# docker compose down หยุดข้อมูลยังอยู๋
#docker compose down -v ถ้าจะหยุด + ลบข้อมูล DB
# docker compose up -d กลับมารันใหม่
