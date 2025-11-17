docker exec -it postgres_container psql -U postgres -d postgres

#select * from game_sessions;

docker exec -it postgres_container psql -U postgres -d postgres -c "SELECT * FROM game_sessions;"
