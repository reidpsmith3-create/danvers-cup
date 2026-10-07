alter table public.match_holes
  add column if not exists team_a_vegas_points integer,
  add column if not exists team_b_vegas_points integer,
  add column if not exists vegas_multiplier integer,
  add column if not exists team_a_flipped boolean,
  add column if not exists team_b_flipped boolean;
