FROM golang:1.24.2
LABEL authors="katagiri"

WORKDIR /backend

COPY . .

RUN go mod download

RUN go mod tidy

RUN go build -o application ./cmd/service/main.go

EXPOSE 8080

CMD ["./app"]
