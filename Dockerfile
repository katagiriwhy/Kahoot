FROM golang:1.24.9
LABEL authors="katagiri"

WORKDIR /backend

COPY backend/cmd/service .

RUN go mod download

RUN go mod tidy

RUN go build -o app ./cmd/service/main.go

EXPOSE 8080

CMD ["./app"]
