alter table public.matches
  add column if not exists win_points_override numeric,
  add column if not exists tie_points_override numeric;

comment on column public.matches.win_points_override is
  'Optional per-match Cup points awarded to the winning side. Null uses competition settings.';

comment on column public.matches.tie_points_override is
  'Optional per-match Cup points awarded to each side on a tie. Null uses competition settings.';
