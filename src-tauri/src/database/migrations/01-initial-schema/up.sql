CREATE TABLE connections
  (
     id          TEXT NOT NULL PRIMARY KEY,
     dialect     VARCHAR(255) NOT NULL,
     mode        VARCHAR(255) NOT NULL,
     credentials VARCHAR(1024) NOT NULL,
     schema      VARCHAR(255) NOT NULL,
     name        VARCHAR(255) NOT NULL,
     color       VARCHAR(255) NOT NULL
  ) 
