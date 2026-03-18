CREATE DATABASE IF NOT EXISTS clickhouse_sample;

-- Small table with hand-crafted data
CREATE TABLE IF NOT EXISTS clickhouse_sample.employees
(
    id UInt32,
    first_name String,
    last_name String,
    email String,
    department String,
    salary Float64,
    hire_date Date,
    is_active UInt8 DEFAULT 1
)
ENGINE = MergeTree()
ORDER BY id;

INSERT INTO clickhouse_sample.employees (id, first_name, last_name, email, department, salary, hire_date, is_active) VALUES
(1, 'Alice', 'Johnson', 'alice@example.com', 'Engineering', 95000, '2020-01-15', 1),
(2, 'Bob', 'Smith', 'bob@example.com', 'Engineering', 88000, '2019-06-20', 1),
(3, 'Carol', 'Williams', 'carol@example.com', 'Marketing', 72000, '2021-03-10', 1),
(4, 'David', 'Brown', 'david@example.com', 'Sales', 68000, '2018-11-05', 1),
(5, 'Eve', 'Davis', 'eve@example.com', 'Engineering', 102000, '2017-08-22', 1),
(6, 'Frank', 'Miller', 'frank@example.com', 'HR', 65000, '2022-01-03', 1),
(7, 'Grace', 'Wilson', 'grace@example.com', 'Marketing', 78000, '2020-09-14', 0),
(8, 'Henry', 'Moore', 'henry@example.com', 'Sales', 71000, '2019-04-28', 1),
(9, 'Ivy', 'Taylor', 'ivy@example.com', 'Engineering', 97000, '2021-07-19', 1),
(10, 'Jack', 'Anderson', 'jack@example.com', 'HR', 62000, '2023-02-01', 1);

-- Large table: 100k rows generated via ClickHouse array functions
CREATE TABLE IF NOT EXISTS clickhouse_sample.web_analytics
(
    id UInt64,
    session_id UUID,
    user_id UInt32,
    page_url String,
    referrer String,
    browser String,
    os String,
    country String,
    city String,
    duration_ms UInt32,
    is_bounce UInt8,
    event_time DateTime,
    revenue Float64
)
ENGINE = MergeTree()
ORDER BY (event_time, user_id)
PARTITION BY toYYYYMM(event_time);

INSERT INTO clickhouse_sample.web_analytics
SELECT
    number AS id,
    generateUUIDv4() AS session_id,
    rand() % 5000 + 1 AS user_id,
    arrayElement(
        ['/home', '/products', '/about', '/contact', '/blog', '/pricing', '/docs', '/login', '/signup', '/dashboard', '/settings', '/profile', '/cart', '/checkout', '/search'],
        (rand() % 15) + 1
    ) AS page_url,
    arrayElement(
        ['https://google.com', 'https://twitter.com', 'https://github.com', 'direct', 'https://reddit.com', 'https://hn.news', 'https://linkedin.com', ''],
        (rand() % 8) + 1
    ) AS referrer,
    arrayElement(
        ['Chrome', 'Firefox', 'Safari', 'Edge', 'Opera', 'Brave'],
        (rand() % 6) + 1
    ) AS browser,
    arrayElement(
        ['Windows', 'macOS', 'Linux', 'iOS', 'Android'],
        (rand() % 5) + 1
    ) AS os,
    arrayElement(
        ['US', 'UK', 'DE', 'FR', 'JP', 'BR', 'IN', 'CA', 'AU', 'NL'],
        (rand() % 10) + 1
    ) AS country,
    arrayElement(
        ['New York', 'London', 'Berlin', 'Paris', 'Tokyo', 'Sao Paulo', 'Mumbai', 'Toronto', 'Sydney', 'Amsterdam'],
        (rand() % 10) + 1
    ) AS city,
    rand() % 300000 AS duration_ms,
    if(rand() % 100 < 35, 1, 0) AS is_bounce,
    toDateTime('2024-01-01 00:00:00') + toIntervalSecond(rand() % (365 * 86400)) AS event_time,
    if(rand() % 100 < 15, round((rand() % 50000) / 100, 2), 0) AS revenue
FROM numbers(100000);

-- Events table with varied types
CREATE TABLE IF NOT EXISTS clickhouse_sample.events
(
    event_id UUID DEFAULT generateUUIDv4(),
    event_type String,
    user_id UInt32,
    event_time DateTime DEFAULT now(),
    properties String
)
ENGINE = MergeTree()
ORDER BY (event_type, event_time);

INSERT INTO clickhouse_sample.events (event_type, user_id, properties) VALUES
('login', 1, '{"browser": "Chrome"}'),
('page_view', 1, '{"page": "/dashboard"}'),
('login', 2, '{"browser": "Firefox"}'),
('click', 3, '{"button": "signup"}'),
('login', 4, '{"browser": "Safari"}'),
('page_view', 2, '{"page": "/settings"}'),
('logout', 1, '{}'),
('login', 5, '{"browser": "Chrome"}'),
('page_view', 5, '{"page": "/profile"}'),
('click', 1, '{"button": "export"}');

-- View
CREATE VIEW IF NOT EXISTS clickhouse_sample.active_employees AS
SELECT id, first_name, last_name, department, salary
FROM clickhouse_sample.employees
WHERE is_active = 1;
