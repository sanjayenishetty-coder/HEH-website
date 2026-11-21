-- 0001: initial schema (tables as first deployed). IF NOT EXISTS so it also records cleanly on a database that already has them.

CREATE TABLE IF NOT EXISTS counters (
  name  text PRIMARY KEY,
  value integer NOT NULL
);

CREATE TABLE IF NOT EXISTS events (
  id                serial PRIMARY KEY,
  slug              text NOT NULL UNIQUE,
  title             text NOT NULL,
  category          text NOT NULL DEFAULT 'spotlight' CHECK (category IN ('spotlight', 'workshop')),
  short_description text NOT NULL DEFAULT '',
  description       text NOT NULL DEFAULT '',
  summary           text NOT NULL DEFAULT '',          -- "About This Gathering" once the event is over
  event_date        date,
  start_time        time,
  end_time          time,
  venue_name        text NOT NULL DEFAULT '',
  venue_address     text NOT NULL DEFAULT '',
  map_url           text NOT NULL DEFAULT '',
  image_url         text NOT NULL DEFAULT '',
  members_only      boolean NOT NULL DEFAULT true,
  registration_open boolean NOT NULL DEFAULT true,
  agenda            jsonb NOT NULL DEFAULT '[]',        -- [{time, title, details}]
  speaker           jsonb,                              -- {name, designation, company, bio, photo_url}
  featured          jsonb,                              -- {name, designation, company, topic, photo_url}
  takeaways         jsonb NOT NULL DEFAULT '[]',        -- [{title, text}]
  photos            jsonb NOT NULL DEFAULT '[]',        -- [url]
  published         boolean NOT NULL DEFAULT true,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS events_date_idx ON events (event_date);

CREATE TABLE IF NOT EXISTS members (
  id                      serial PRIMARY KEY,
  slug                    text NOT NULL UNIQUE,
  member_code             text NOT NULL UNIQUE,         -- HEH membership ID used for event registration
  full_name               text NOT NULL,
  designation             text NOT NULL DEFAULT '',
  company                 text NOT NULL DEFAULT '',
  industry                text NOT NULL DEFAULT '',
  location                text NOT NULL DEFAULT 'Hyderabad, Telangana',
  photo_url               text NOT NULL DEFAULT '',
  company_image_url       text NOT NULL DEFAULT '',
  company_tagline         text NOT NULL DEFAULT '',
  bio                     text NOT NULL DEFAULT '',
  experience              text NOT NULL DEFAULT '',
  expertise               text NOT NULL DEFAULT '',
  passion                 text NOT NULL DEFAULT '',
  company_about           text NOT NULL DEFAULT '',
  products_services       text NOT NULL DEFAULT '',
  website                 text NOT NULL DEFAULT '',
  offers                  jsonb NOT NULL DEFAULT '[]',  -- [{title, text}]
  opportunities           jsonb NOT NULL DEFAULT '[]',  -- [text]
  collaboration_interests jsonb NOT NULL DEFAULT '[]',  -- [text]
  email                   text NOT NULL DEFAULT '',     -- private, admin only
  phone                   text NOT NULL DEFAULT '',     -- private, admin only
  status                  text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  sort_order              integer NOT NULL DEFAULT 0,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stories (
  id                serial PRIMARY KEY,
  slug              text NOT NULL UNIQUE,
  title             text NOT NULL,
  category          text NOT NULL DEFAULT 'Business Collaboration',
  summary           text NOT NULL DEFAULT '',
  body              text NOT NULL DEFAULT '',
  image_url         text NOT NULL DEFAULT '',
  members_involved  jsonb NOT NULL DEFAULT '[]',        -- [text]
  companies         jsonb NOT NULL DEFAULT '[]',        -- [text]
  business_category text NOT NULL DEFAULT '',
  featured          boolean NOT NULL DEFAULT false,
  published_on      date NOT NULL DEFAULT current_date,
  published         boolean NOT NULL DEFAULT true,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS membership_applications (
  id                   serial PRIMARY KEY,
  ref                  text NOT NULL UNIQUE,
  token                text NOT NULL,
  full_name            text NOT NULL,
  mobile               text NOT NULL,
  email                text NOT NULL,
  designation          text NOT NULL,
  linkedin             text NOT NULL DEFAULT '',
  company_name         text NOT NULL,
  business_category    text NOT NULL,
  year_established     integer NOT NULL,
  business_location    text NOT NULL,
  website              text NOT NULL DEFAULT '',
  turnover_range       text NOT NULL DEFAULT '',
  business_description text NOT NULL,
  status               text NOT NULL DEFAULT 'received'
                       CHECK (status IN ('received', 'under_review', 'interaction', 'approved', 'rejected')),
  admin_notes          text NOT NULL DEFAULT '',
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS enquiries (
  id           serial PRIMARY KEY,
  ref          text NOT NULL UNIQUE,
  token        text NOT NULL,
  full_name    text NOT NULL,
  mobile       text NOT NULL,
  email        text NOT NULL,
  company      text NOT NULL DEFAULT '',
  enquiry_type text NOT NULL,
  message      text NOT NULL,
  member_id    integer REFERENCES members (id) ON DELETE SET NULL,  -- set when sent from a member profile
  status       text NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'in_progress', 'closed')),
  admin_notes  text NOT NULL DEFAULT '',
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS event_registrations (
  id            serial PRIMARY KEY,
  ref           text NOT NULL UNIQUE,
  token         text NOT NULL,
  event_id      integer NOT NULL REFERENCES events (id) ON DELETE CASCADE,
  full_name     text NOT NULL,
  mobile        text NOT NULL,
  company       text NOT NULL,
  membership_id text NOT NULL,
  email         text NOT NULL DEFAULT '',
  status        text NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'attended')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS event_registrations_member_uniq
  ON event_registrations (event_id, lower(membership_id));
