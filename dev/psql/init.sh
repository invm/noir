#!/bin/sh

pg_restore -d dvdrental -1 /tmp/dvdrental.tar

# https://www.cherryservers.com/blog/how-to-configure-ssl-on-postgresql
# psql "sslmode=allow host=localhost user=postgres dbname=dvdrental"
# is ssl used query
# select datname, usename, ssl, client_addr from pg_stat_ssl inner join pg_stat_activity on pg_stat_ssl.pid = pg_stat_activity.pid;
