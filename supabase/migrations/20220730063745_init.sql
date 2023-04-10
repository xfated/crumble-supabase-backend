create table placedetails (
    place_id text primary key,
    created_at timestamptz DEFAULT now(),
    name text,
    url text,
    lat float8,
    long float8,
    formatted_address text,
    dine_in boolean,
    takeout boolean,
    serves_breakfast boolean,
    serves_lunch boolean,
    serves_dinner boolean
);

create table reviews (
    id integer primary key generated always as identity,
    created_at timestamptz DEFAULT now(),
    place_id text references placedetails (place_id) on delete cascade,
    author_name text,
    time timestamp,
    rating int2,
    relative_time_description text,
    profile_photo_url text,
    language text,
    original_language text,
    text text
);

create table photos (
    id integer primary key generated always as identity,
    created_at timestamptz DEFAULT now(),
    place_id text references placedetails (place_id) on delete cascade,
    height int4,
    width int4,
    photo_reference text  
);

create table groups (
    id text primary key,
    created_at timestamptz DEFAULT now(),
    min_match int2,
    match text
);

-- create table matches (
--     group_id te
-- )