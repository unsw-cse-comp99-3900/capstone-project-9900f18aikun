docker-compose down
docker-compose down --volumes --remove-orphans
docker-compose down --volumes
docker-compose down --rmi all
docker volume prune
docker image prune