#!/bin/sh

openssl genrsa -out certs/ca.key 2048
openssl req -x509 -sha256 -new -nodes -key certs/ca.key -days 3650 -subj '/CN=root-ca' -out certs/ca.pem

openssl req -new -text -nodes -subj '/CN=localhost' -keyout certs/server.key -out certs/server.csr
openssl x509 -req -in certs/server.csr -CA certs/ca.pem -CAkey certs/ca.key -CAcreateserial -out certs/server.pem -days 365 -sha256
rm -rf certs/server.csr

openssl req -new -nodes -out certs/client.csr -keyout certs/client.key -subj "/CN=client"
openssl x509 -req -in certs/client.csr -CA certs/ca.pem -CAkey certs/ca.key -CAcreateserial -out certs/client.pem -days 365 -sha256
rm -rf certs/client.csr
