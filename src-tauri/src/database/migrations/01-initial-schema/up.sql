CREATE TABLE connections
  (
     id          TEXT NOT NULL,
     dialect     VARCHAR(255) NOT NULL,
     mode        VARCHAR(255) NOT NULL,
     credentials VARCHAR(1024) NOT NULL,
     SCHEMA      VARCHAR(255) NOT NULL,
     NAME        VARCHAR(255) NOT NULL,
     color       VARCHAR(255) NOT NULL
  ) 
