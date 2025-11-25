package main

import "backend/backend/internal/application"

func main() {
	a := application.NewApplication()

	a.Run()
}
