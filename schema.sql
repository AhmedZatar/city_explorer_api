DROP TABLE IF EXISTS locationtable;

CREATE TABLE IF NOT EXISTS locationtable (

    search_query VARCHAR(255),
    formatted_query VARCHAR(255),
    latitude VARCHAR(255),
    longitude VARCHAR(255)

);