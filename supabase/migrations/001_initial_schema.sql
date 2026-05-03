-- bashgala initial schema

create extension if not exists "pgcrypto";

-- posts: single table for all content types
create table posts (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz default now() not null,
  updated_at      timestamptz default now() not null,
  type            text not null check (type in ('image', 'link', 'thought', 'post')),
  slug            text unique,
  title           text,
  body            text,
  synopsis        text,
  url             text,
  published       boolean default false not null,
  featured        boolean default false not null
);

-- images: related to posts, supports galleries
create table images (
  id              uuid primary key default gen_random_uuid(),
  post_id         uuid not null references posts(id) on delete cascade,
  url             text not null,
  caption         text,
  alt_text        text,
  sort_order      integer default 0 not null,
  created_at      timestamptz default now() not null
);

-- tags: Bash's personal index
create table tags (
  id              uuid primary key default gen_random_uuid(),
  name            text not null unique,
  slug            text not null unique
);

-- junction: posts ↔ tags
create table post_tags (
  post_id         uuid not null references posts(id) on delete cascade,
  tag_id          uuid not null references tags(id) on delete cascade,
  primary key (post_id, tag_id)
);

-- updated_at trigger
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger posts_updated_at
  before update on posts
  for each row execute function update_updated_at();

-- indexes for feed queries
create index posts_created_at_idx on posts(created_at desc) where published = true;
create index posts_type_idx on posts(type) where published = true;
create index images_post_id_idx on images(post_id);
create index post_tags_post_id_idx on post_tags(post_id);
create index post_tags_tag_id_idx on post_tags(tag_id);

-- RLS: public can read published posts
alter table posts enable row level security;
alter table images enable row level security;
alter table tags enable row level security;
alter table post_tags enable row level security;

create policy "public read published posts"
  on posts for select
  using (published = true);

create policy "public read images"
  on images for select
  using (true);

create policy "public read tags"
  on tags for select
  using (true);

create policy "public read post_tags"
  on post_tags for select
  using (true);

-- seed: Bash's initial tag taxonomy
insert into tags (name, slug) values
  ('fatherhood',       'fatherhood'),
  ('partnership',      'partnership'),
  ('men',              'men'),
  ('community',        'community'),
  ('helper-id',        'helper-id'),
  ('empathy-lab',      'empathy-lab'),
  ('provenance-label', 'provenance-label'),
  ('design',           'design'),
  ('ux',               'ux'),
  ('frameworks',       'frameworks'),
  ('bash',             'bash'),
  ('shelton',          'shelton'),
  ('ba',               'ba'),
  ('race',             'race'),
  ('mixed',            'mixed'),
  ('sketches',         'sketches'),
  ('writing',          'writing'),
  ('animation',        'animation'),
  ('visual',           'visual'),
  ('rural',            'rural'),
  ('georgia',          'georgia'),
  ('running',          'running'),
  ('japan',            'japan'),
  ('raw',              'raw'),
  ('unfinished',       'unfinished'),
  ('returning-to',     'returning-to'),
  ('urgent',           'urgent');
