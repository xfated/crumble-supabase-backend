create table version (
    id integer primary key generated always as identity,
    created_at timestamptz DEFAULT now(),
    version text 
);
alter table version
    enable row level security;
create policy "Can only read version"
    on version
    for select using ( true );

create table placedetails (
    place_id text primary key NOT NULL,
    created_at timestamptz DEFAULT now(),
    name text NOT NULL,
    url text,
    lat float8,
    long float8,
    formatted_address text,
    photo text,
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
    data_url text NOT NULL 
);

create table groups (
    id text primary key,
    created_at timestamptz DEFAULT now(),
    min_match int2 NOT NULL,
    category text NOT NULL,
    lat float8 NOT NULL,
    long float8 NOT NULL,
    radius int2 NOT NULL,
    next_page_token text,
    place_id text references placedetails (place_id)
);
-- Set 1 day TTL for groups
alter table groups
    enable row level security;
create policy "Groups are live for a day"
    on groups
    for select using (
        created_at > (current_timestamp - interval '1 day')
    );
create policy "Groups updatable by everyone" 
    on groups for update
    to authenticated, anon
    using ( true );
create policy "Allow insert access for groups" 
    on groups for insert
    to authenticated, anon
    with check ( true );

create table groupplaces ( -- store nearby places for a given group to prevent multiple queries
    created_at timestamptz DEFAULT now(),
    group_id text references groups (id) on delete cascade NOT NULL,
    place_id text references placedetails (place_id) on delete cascade NOT NULL,
    next_page_token text NOT NULL,
    PRIMARY KEY(group_id, place_id)
);
alter table groupplaces
    enable row level security;
create policy "Groupplaces are live for a day"
    on groupplaces
    for select using (
        created_at > (current_timestamp - interval '1 day')
    );
create policy "Allow insert access for groupplaces" 
    on groupplaces for insert
    to authenticated, anon
    with check ( true );
    
create table grouplikes (
    id integer primary key generated always as identity,
    created_at timestamptz DEFAULT now(),
    group_id text references groups (id) on delete cascade NOT NULL,
    place_id text references placedetails (place_id) on delete cascade NOT NULL
);
alter table grouplikes
    enable row level security;
create policy "Grouplikes are live for a day"
    on grouplikes
    for select using (
        created_at > (current_timestamp - interval '1 day')
    );
create policy "Allow insert access for grouplikes" 
    on grouplikes for insert
    to authenticated, anon
    with check ( true );