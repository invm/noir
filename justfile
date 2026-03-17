project := file_name(justfile_directory())

# show this help
[private]
default:
    @just --list

# run the tauri app in dev mode
dev:
    pnpm tauri dev

# run vite dev server only (no tauri)
web:
    pnpm start

# --- databases ---

# extract mysql sample data (world-db)
setup-mysql:
    cd dev/mysql && unzip -o world-db.zip && mv world-db/world.sql . && rm -rf world-db

# extract psql sample data (dvdrental)
setup-psql:
    rm -rf dev/psql/dvdrental.tar && cd dev/psql && unzip -o dvdrental.zip

# extract mariadb sample data (nation)
setup-maria:
    rm -rf dev/mariadb/nation.sql && cd dev/mariadb && unzip -o nation.zip

# extract sqlite sample data (chinook)
setup-sqlite:
    cd dev/sqlite && unzip -o chinook.zip

# extract all sample databases
setup-all: setup-mysql setup-psql setup-maria setup-sqlite

# start mysql
mysql:
    docker compose up -d mysql
    @echo ""
    @echo "MySQL connection:"
    @echo "  host: localhost:3306  user: root  password: password  database: world"

# start psql
psql:
    docker compose up -d psql
    @echo ""
    @echo "PostgreSQL connection:"
    @echo "  host: localhost:5433  user: postgres  password: password  database: dvdrental"

# start mariadb
maria:
    docker compose up -d maria
    @echo ""
    @echo "MariaDB connection:"
    @echo "  host: localhost:3307  user: root  password: password  database: nation"

# start all databases
up:
    docker compose up -d

# exec into a container: just exec maria
exec svc:
    docker compose exec -it {{svc}} sh

# docker compose ps
ps:
    docker compose ps

# docker compose logs -f
logs *svc:
    docker compose logs -f {{svc}}

# stop all containers
down:
    docker compose down --remove-orphans

# stop and remove all volumes (prompts for confirmation)
[confirm("Warning: This will delete all database data. Continue?")]
nuke:
    docker compose down -v --remove-orphans

# generate dev certs
certs:
    cd dev && bash certs.sh
