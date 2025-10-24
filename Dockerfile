FROM golang:1.25.2
LABEL authors="katagiri"

WORKDIR /course_project

COPY . .

RUN go mod download

RUN go mod tidy

RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o app ./backend/cmd/service/main.go

EXPOSE 8080

CMD ["./app"]
