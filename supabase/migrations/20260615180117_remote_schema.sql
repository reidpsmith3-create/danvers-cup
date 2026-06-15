
  create table "public"."competition_results" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "competition_id" uuid not null,
    "team_id" uuid,
    "player_id" uuid,
    "points" numeric(6,2) not null default 0,
    "result_label" text,
    "is_official" boolean not null default false,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );



  create table "public"."match_holes" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "match_id" uuid not null,
    "hole_number" integer not null,
    "winning_side" text not null default 'halved'::text,
    "team_a_score" integer,
    "team_b_score" integer,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


CREATE UNIQUE INDEX competition_results_pkey ON public.competition_results USING btree (id);

CREATE UNIQUE INDEX match_holes_match_id_hole_number_key ON public.match_holes USING btree (match_id, hole_number);

CREATE UNIQUE INDEX match_holes_pkey ON public.match_holes USING btree (id);

alter table "public"."competition_results" add constraint "competition_results_pkey" PRIMARY KEY using index "competition_results_pkey";

alter table "public"."match_holes" add constraint "match_holes_pkey" PRIMARY KEY using index "match_holes_pkey";

alter table "public"."competition_results" add constraint "competition_results_competition_id_fkey" FOREIGN KEY (competition_id) REFERENCES public.competitions(id) ON DELETE CASCADE not valid;

alter table "public"."competition_results" validate constraint "competition_results_competition_id_fkey";

alter table "public"."competition_results" add constraint "competition_results_player_id_fkey" FOREIGN KEY (player_id) REFERENCES public.players(id) ON DELETE SET NULL not valid;

alter table "public"."competition_results" validate constraint "competition_results_player_id_fkey";

alter table "public"."competition_results" add constraint "competition_results_team_id_fkey" FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE SET NULL not valid;

alter table "public"."competition_results" validate constraint "competition_results_team_id_fkey";

alter table "public"."match_holes" add constraint "match_holes_match_id_fkey" FOREIGN KEY (match_id) REFERENCES public.matches(id) ON DELETE CASCADE not valid;

alter table "public"."match_holes" validate constraint "match_holes_match_id_fkey";

alter table "public"."match_holes" add constraint "match_holes_match_id_hole_number_key" UNIQUE using index "match_holes_match_id_hole_number_key";

alter table "public"."match_holes" add constraint "match_holes_winning_side_check" CHECK ((winning_side = ANY (ARRAY['team_a'::text, 'team_b'::text, 'halved'::text]))) not valid;

alter table "public"."match_holes" validate constraint "match_holes_winning_side_check";

grant delete on table "public"."competition_results" to "anon";

grant insert on table "public"."competition_results" to "anon";

grant references on table "public"."competition_results" to "anon";

grant select on table "public"."competition_results" to "anon";

grant trigger on table "public"."competition_results" to "anon";

grant truncate on table "public"."competition_results" to "anon";

grant update on table "public"."competition_results" to "anon";

grant delete on table "public"."competition_results" to "authenticated";

grant insert on table "public"."competition_results" to "authenticated";

grant references on table "public"."competition_results" to "authenticated";

grant select on table "public"."competition_results" to "authenticated";

grant trigger on table "public"."competition_results" to "authenticated";

grant truncate on table "public"."competition_results" to "authenticated";

grant update on table "public"."competition_results" to "authenticated";

grant delete on table "public"."competition_results" to "service_role";

grant insert on table "public"."competition_results" to "service_role";

grant references on table "public"."competition_results" to "service_role";

grant select on table "public"."competition_results" to "service_role";

grant trigger on table "public"."competition_results" to "service_role";

grant truncate on table "public"."competition_results" to "service_role";

grant update on table "public"."competition_results" to "service_role";

grant delete on table "public"."match_holes" to "anon";

grant insert on table "public"."match_holes" to "anon";

grant references on table "public"."match_holes" to "anon";

grant select on table "public"."match_holes" to "anon";

grant trigger on table "public"."match_holes" to "anon";

grant truncate on table "public"."match_holes" to "anon";

grant update on table "public"."match_holes" to "anon";

grant delete on table "public"."match_holes" to "authenticated";

grant insert on table "public"."match_holes" to "authenticated";

grant references on table "public"."match_holes" to "authenticated";

grant select on table "public"."match_holes" to "authenticated";

grant trigger on table "public"."match_holes" to "authenticated";

grant truncate on table "public"."match_holes" to "authenticated";

grant update on table "public"."match_holes" to "authenticated";

grant delete on table "public"."match_holes" to "service_role";

grant insert on table "public"."match_holes" to "service_role";

grant references on table "public"."match_holes" to "service_role";

grant select on table "public"."match_holes" to "service_role";

grant trigger on table "public"."match_holes" to "service_role";

grant truncate on table "public"."match_holes" to "service_role";

grant update on table "public"."match_holes" to "service_role";


