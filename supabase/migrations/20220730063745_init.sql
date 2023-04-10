create table reviews (
    id integer primary key generated always as identity,
    created_at timestamptz DEFAULT now(),
    place_id text,
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
    place_id text,
    height int4,
    width int4,
    photo_reference text  
);

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