FROM golang:1.25.2
LABEL authors="katagiri"

WORKDIR /backend

COPY backend/cmd/service .

RUN go mod download

RUN go mod tidy

RUN go build -o app ./cmd/service/main.go

EXPOSE 8080

CMD ["./app"]
