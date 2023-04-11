create table placedetails (
    place_id text primary key NOT NULL,
    created_at timestamptz DEFAULT now(),
    name text NOT NULL,
    url text,
    lat float8,
    long float8,
    formatted_address text,
    dine_in boolean,
    takeout boolean,
    serves_breakfast boolean,
    serves_lunch boolean,
    serves_dinner boolean,
    country_long text,
    country_short text,
    vicinity text,
    types text,
    price_level int2,
    rating float4,
    user_ratings_total int2,
    business_status text
);

create table reviews (
    id integer primary key generated always as identity,
    created_at timestamptz DEFAULT now(),
    place_id text references placedetails (place_id) on delete cascade NOT NULL,
    author_name text,
    time timestamp NOT NULL,
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
    place_id text references placedetails (place_id) on delete cascade NOT NULL,
    height int4,
    width int4,
    photo_reference text NOT NULL 
);

create table groups (
    id text primary key,
    created_at timestamptz DEFAULT now(),
    min_match int2 NOT NULL,
    category text NOT NULL,
    lat float8 NOT NULL,
    long float8 NOT NULL,
    radius int2 NOT NULL,
    cur_fetch int2 NOT NULL, -- number of times fetched for this query (due to next_page_token)
    match text
);

create table groupplaces ( -- store nearby places for a given group to prevent multiple queries
    created_at timestamptz DEFAULT now(),
    group_id text references groups (id) on delete cascade NOT NULL,
    place_id text references placedetails (place_id) on delete cascade NOT NULL,
    PRIMARY KEY(group_id, place_id)
);

create table grouplikes (
    id integer primary key generated always as identity,
    created_at timestamptz DEFAULT now(),
    group_id text references groups (id) on delete cascade NOT NULL,
    place_id text references placedetails (place_id) on delete cascade NOT NULL
);

 -- create table matches (
--     group_id te
-- )