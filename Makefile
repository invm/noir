.DEFAULT_GOAL := up

up:
	@docker-compose up

down:
	@docker-compose down --remove-orphans --volumes

mysql:
	@docker-compose exec -it mysql bash

psql:
	@docker-compose exec -it psql bash

maria:
	@docker-compose exec -it maria bash
