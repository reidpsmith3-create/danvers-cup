


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."articles" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "season_id" "uuid",
    "title" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "excerpt" "text",
    "body" "text",
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "article_type" "text",
    "cover_image_url" "text",
    "published_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."articles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."competitions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "season_id" "uuid" NOT NULL,
    "round_id" "uuid",
    "name" "text" NOT NULL,
    "format" "text" NOT NULL,
    "scoring_basis" "text" DEFAULT 'gross'::"text" NOT NULL,
    "handicap_percent" numeric(5,2) DEFAULT 100 NOT NULL,
    "counts_for_individual_points" boolean DEFAULT true NOT NULL,
    "counts_for_team_points" boolean DEFAULT true NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "is_visible" boolean DEFAULT true NOT NULL,
    "settings" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."competitions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."course_holes" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "course_id" "uuid" NOT NULL,
    "hole_number" integer NOT NULL,
    "par" integer NOT NULL,
    "yardage" integer,
    "handicap_number" integer,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."course_holes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."courses" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "city" "text",
    "state" "text",
    "website_url" "text",
    "logo_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."courses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_players" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "group_id" "uuid" NOT NULL,
    "player_id" "uuid" NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."group_players" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."matches" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "competition_id" "uuid" NOT NULL,
    "group_id" "uuid",
    "team_a_name" "text",
    "team_b_name" "text",
    "team_a_player_ids" "uuid"[] DEFAULT '{}'::"uuid"[] NOT NULL,
    "team_b_player_ids" "uuid"[] DEFAULT '{}'::"uuid"[] NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."matches" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."media_albums" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "season_id" "uuid",
    "title" "text" NOT NULL,
    "description" "text",
    "cover_image_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."media_albums" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."media_items" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "album_id" "uuid",
    "season_id" "uuid",
    "player_id" "uuid",
    "round_id" "uuid",
    "competition_id" "uuid",
    "url" "text" NOT NULL,
    "caption" "text",
    "media_type" "text" DEFAULT 'image'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."media_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."players" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "full_name" "text" NOT NULL,
    "email" "text",
    "phone" "text",
    "photo_url" "text",
    "bio" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."players" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."round_groups" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "round_id" "uuid" NOT NULL,
    "group_number" integer NOT NULL,
    "name" "text",
    "scorekeeper_player_id" "uuid",
    "tee_time" time without time zone,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."round_groups" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rounds" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "season_id" "uuid" NOT NULL,
    "course_id" "uuid",
    "round_number" integer NOT NULL,
    "name" "text" NOT NULL,
    "round_date" "date",
    "tee_time" time without time zone,
    "status" "text" DEFAULT 'scheduled'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."rounds" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."scores" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "round_id" "uuid" NOT NULL,
    "player_id" "uuid" NOT NULL,
    "hole_number" integer NOT NULL,
    "gross_score" integer NOT NULL,
    "entered_by_player_id" "uuid",
    "updated_by_player_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."scores" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."season_players" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "season_id" "uuid" NOT NULL,
    "player_id" "uuid" NOT NULL,
    "handicap" numeric(5,2),
    "is_admin" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."season_players" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."seasons" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "year" integer NOT NULL,
    "name" "text" NOT NULL,
    "location" "text",
    "start_date" "date",
    "end_date" "date",
    "status" "text" DEFAULT 'upcoming'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."seasons" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."team_members" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "team_id" "uuid" NOT NULL,
    "player_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."team_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."teams" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "season_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "color" "text",
    "logo_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."teams" OWNER TO "postgres";


ALTER TABLE ONLY "public"."articles"
    ADD CONSTRAINT "articles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."articles"
    ADD CONSTRAINT "articles_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."competitions"
    ADD CONSTRAINT "competitions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."course_holes"
    ADD CONSTRAINT "course_holes_course_id_hole_number_key" UNIQUE ("course_id", "hole_number");



ALTER TABLE ONLY "public"."course_holes"
    ADD CONSTRAINT "course_holes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."courses"
    ADD CONSTRAINT "courses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."group_players"
    ADD CONSTRAINT "group_players_group_id_player_id_key" UNIQUE ("group_id", "player_id");



ALTER TABLE ONLY "public"."group_players"
    ADD CONSTRAINT "group_players_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."matches"
    ADD CONSTRAINT "matches_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."media_albums"
    ADD CONSTRAINT "media_albums_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."media_items"
    ADD CONSTRAINT "media_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."players"
    ADD CONSTRAINT "players_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."players"
    ADD CONSTRAINT "players_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."round_groups"
    ADD CONSTRAINT "round_groups_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."round_groups"
    ADD CONSTRAINT "round_groups_round_id_group_number_key" UNIQUE ("round_id", "group_number");



ALTER TABLE ONLY "public"."rounds"
    ADD CONSTRAINT "rounds_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rounds"
    ADD CONSTRAINT "rounds_season_id_round_number_key" UNIQUE ("season_id", "round_number");



ALTER TABLE ONLY "public"."scores"
    ADD CONSTRAINT "scores_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."scores"
    ADD CONSTRAINT "scores_round_id_player_id_hole_number_key" UNIQUE ("round_id", "player_id", "hole_number");



ALTER TABLE ONLY "public"."season_players"
    ADD CONSTRAINT "season_players_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."season_players"
    ADD CONSTRAINT "season_players_season_id_player_id_key" UNIQUE ("season_id", "player_id");



ALTER TABLE ONLY "public"."seasons"
    ADD CONSTRAINT "seasons_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."seasons"
    ADD CONSTRAINT "seasons_year_key" UNIQUE ("year");



ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_team_id_player_id_key" UNIQUE ("team_id", "player_id");



ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "teams_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_articles_season_id" ON "public"."articles" USING "btree" ("season_id");



CREATE INDEX "idx_competitions_season_id" ON "public"."competitions" USING "btree" ("season_id");



CREATE INDEX "idx_group_players_group_id" ON "public"."group_players" USING "btree" ("group_id");



CREATE INDEX "idx_media_items_season_id" ON "public"."media_items" USING "btree" ("season_id");



CREATE INDEX "idx_round_groups_round_id" ON "public"."round_groups" USING "btree" ("round_id");



CREATE INDEX "idx_rounds_season_id" ON "public"."rounds" USING "btree" ("season_id");



CREATE INDEX "idx_scores_player_id" ON "public"."scores" USING "btree" ("player_id");



CREATE INDEX "idx_scores_round_id" ON "public"."scores" USING "btree" ("round_id");



CREATE INDEX "idx_season_players_season_id" ON "public"."season_players" USING "btree" ("season_id");



CREATE INDEX "idx_team_members_team_id" ON "public"."team_members" USING "btree" ("team_id");



CREATE OR REPLACE TRIGGER "set_scores_updated_at" BEFORE UPDATE ON "public"."scores" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



ALTER TABLE ONLY "public"."articles"
    ADD CONSTRAINT "articles_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."competitions"
    ADD CONSTRAINT "competitions_round_id_fkey" FOREIGN KEY ("round_id") REFERENCES "public"."rounds"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."competitions"
    ADD CONSTRAINT "competitions_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."course_holes"
    ADD CONSTRAINT "course_holes_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."group_players"
    ADD CONSTRAINT "group_players_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."round_groups"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."group_players"
    ADD CONSTRAINT "group_players_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."matches"
    ADD CONSTRAINT "matches_competition_id_fkey" FOREIGN KEY ("competition_id") REFERENCES "public"."competitions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."matches"
    ADD CONSTRAINT "matches_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."round_groups"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."media_albums"
    ADD CONSTRAINT "media_albums_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."media_items"
    ADD CONSTRAINT "media_items_album_id_fkey" FOREIGN KEY ("album_id") REFERENCES "public"."media_albums"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."media_items"
    ADD CONSTRAINT "media_items_competition_id_fkey" FOREIGN KEY ("competition_id") REFERENCES "public"."competitions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."media_items"
    ADD CONSTRAINT "media_items_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."media_items"
    ADD CONSTRAINT "media_items_round_id_fkey" FOREIGN KEY ("round_id") REFERENCES "public"."rounds"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."media_items"
    ADD CONSTRAINT "media_items_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."round_groups"
    ADD CONSTRAINT "round_groups_round_id_fkey" FOREIGN KEY ("round_id") REFERENCES "public"."rounds"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."round_groups"
    ADD CONSTRAINT "round_groups_scorekeeper_player_id_fkey" FOREIGN KEY ("scorekeeper_player_id") REFERENCES "public"."players"("id");



ALTER TABLE ONLY "public"."rounds"
    ADD CONSTRAINT "rounds_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id");



ALTER TABLE ONLY "public"."rounds"
    ADD CONSTRAINT "rounds_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."scores"
    ADD CONSTRAINT "scores_entered_by_player_id_fkey" FOREIGN KEY ("entered_by_player_id") REFERENCES "public"."players"("id");



ALTER TABLE ONLY "public"."scores"
    ADD CONSTRAINT "scores_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."scores"
    ADD CONSTRAINT "scores_round_id_fkey" FOREIGN KEY ("round_id") REFERENCES "public"."rounds"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."scores"
    ADD CONSTRAINT "scores_updated_by_player_id_fkey" FOREIGN KEY ("updated_by_player_id") REFERENCES "public"."players"("id");



ALTER TABLE ONLY "public"."season_players"
    ADD CONSTRAINT "season_players_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."season_players"
    ADD CONSTRAINT "season_players_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "teams_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE CASCADE;





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






















































































































































GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";


















GRANT ALL ON TABLE "public"."articles" TO "anon";
GRANT ALL ON TABLE "public"."articles" TO "authenticated";
GRANT ALL ON TABLE "public"."articles" TO "service_role";



GRANT ALL ON TABLE "public"."competitions" TO "anon";
GRANT ALL ON TABLE "public"."competitions" TO "authenticated";
GRANT ALL ON TABLE "public"."competitions" TO "service_role";



GRANT ALL ON TABLE "public"."course_holes" TO "anon";
GRANT ALL ON TABLE "public"."course_holes" TO "authenticated";
GRANT ALL ON TABLE "public"."course_holes" TO "service_role";



GRANT ALL ON TABLE "public"."courses" TO "anon";
GRANT ALL ON TABLE "public"."courses" TO "authenticated";
GRANT ALL ON TABLE "public"."courses" TO "service_role";



GRANT ALL ON TABLE "public"."group_players" TO "anon";
GRANT ALL ON TABLE "public"."group_players" TO "authenticated";
GRANT ALL ON TABLE "public"."group_players" TO "service_role";



GRANT ALL ON TABLE "public"."matches" TO "anon";
GRANT ALL ON TABLE "public"."matches" TO "authenticated";
GRANT ALL ON TABLE "public"."matches" TO "service_role";



GRANT ALL ON TABLE "public"."media_albums" TO "anon";
GRANT ALL ON TABLE "public"."media_albums" TO "authenticated";
GRANT ALL ON TABLE "public"."media_albums" TO "service_role";



GRANT ALL ON TABLE "public"."media_items" TO "anon";
GRANT ALL ON TABLE "public"."media_items" TO "authenticated";
GRANT ALL ON TABLE "public"."media_items" TO "service_role";



GRANT ALL ON TABLE "public"."players" TO "anon";
GRANT ALL ON TABLE "public"."players" TO "authenticated";
GRANT ALL ON TABLE "public"."players" TO "service_role";



GRANT ALL ON TABLE "public"."round_groups" TO "anon";
GRANT ALL ON TABLE "public"."round_groups" TO "authenticated";
GRANT ALL ON TABLE "public"."round_groups" TO "service_role";



GRANT ALL ON TABLE "public"."rounds" TO "anon";
GRANT ALL ON TABLE "public"."rounds" TO "authenticated";
GRANT ALL ON TABLE "public"."rounds" TO "service_role";



GRANT ALL ON TABLE "public"."scores" TO "anon";
GRANT ALL ON TABLE "public"."scores" TO "authenticated";
GRANT ALL ON TABLE "public"."scores" TO "service_role";



GRANT ALL ON TABLE "public"."season_players" TO "anon";
GRANT ALL ON TABLE "public"."season_players" TO "authenticated";
GRANT ALL ON TABLE "public"."season_players" TO "service_role";



GRANT ALL ON TABLE "public"."seasons" TO "anon";
GRANT ALL ON TABLE "public"."seasons" TO "authenticated";
GRANT ALL ON TABLE "public"."seasons" TO "service_role";



GRANT ALL ON TABLE "public"."team_members" TO "anon";
GRANT ALL ON TABLE "public"."team_members" TO "authenticated";
GRANT ALL ON TABLE "public"."team_members" TO "service_role";



GRANT ALL ON TABLE "public"."teams" TO "anon";
GRANT ALL ON TABLE "public"."teams" TO "authenticated";
GRANT ALL ON TABLE "public"."teams" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































drop extension if exists "pg_net";


