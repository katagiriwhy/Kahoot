docker exec -it postgres_container psql -U postgres -d postgres

#select * from game_sessions;

docker exec -it postgres_container psql -U postgres -d postgres -c "SELECT * FROM questions;"
docker exec -it postgres_container psql -U postgres -d postgres -c "UPDATE quizzes SET time_limit = 10 where id = 2;"
