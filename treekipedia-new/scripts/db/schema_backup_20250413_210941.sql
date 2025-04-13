--
-- PostgreSQL database dump
--

-- Dumped from database version 14.17 (Ubuntu 14.17-0ubuntu0.22.04.1)
-- Dumped by pg_dump version 14.17 (Ubuntu 14.17-0ubuntu0.22.04.1)

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

--
-- Name: update_user_points(); Type: FUNCTION; Schema: public; Owner: tree_user
--

CREATE FUNCTION public.update_user_points() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  INSERT INTO public.users (wallet_address, total_points, contribution_count, last_contribution_at)
  VALUES (NEW.wallet_address, NEW.points, 1, CURRENT_TIMESTAMP)
  ON CONFLICT (wallet_address) 
  DO UPDATE SET 
    total_points = users.total_points + NEW.points,
    contribution_count = users.contribution_count + 1,
    last_contribution_at = CURRENT_TIMESTAMP,
    updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_user_points() OWNER TO tree_user;

--
-- Name: FUNCTION update_user_points(); Type: COMMENT; Schema: public; Owner: tree_user
--

COMMENT ON FUNCTION public.update_user_points() IS 'Updates users table when a new NFT is inserted';


--
-- Name: global_id_seq; Type: SEQUENCE; Schema: public; Owner: tree_user
--

CREATE SEQUENCE public.global_id_seq
    START WITH 0
    INCREMENT BY 1
    MINVALUE 0
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.global_id_seq OWNER TO tree_user;

--
-- Name: SEQUENCE global_id_seq; Type: COMMENT; Schema: public; Owner: tree_user
--

COMMENT ON SEQUENCE public.global_id_seq IS 'Generates unique global_id values for contreebution_nfts';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: contreebution_nfts; Type: TABLE; Schema: public; Owner: tree_user
--

CREATE TABLE public.contreebution_nfts (
    id integer NOT NULL,
    global_id bigint DEFAULT nextval('public.global_id_seq'::regclass) NOT NULL,
    taxon_id text NOT NULL,
    wallet_address text NOT NULL,
    points integer DEFAULT 2,
    ipfs_cid text,
    transaction_hash text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.contreebution_nfts OWNER TO tree_user;

--
-- Name: TABLE contreebution_nfts; Type: COMMENT; Schema: public; Owner: tree_user
--

COMMENT ON TABLE public.contreebution_nfts IS 'Tracks all Contreebution NFTs minted for users';


--
-- Name: COLUMN contreebution_nfts.global_id; Type: COMMENT; Schema: public; Owner: tree_user
--

COMMENT ON COLUMN public.contreebution_nfts.global_id IS 'Unique sequential identifier for the NFT';


--
-- Name: COLUMN contreebution_nfts.taxon_id; Type: COMMENT; Schema: public; Owner: tree_user
--

COMMENT ON COLUMN public.contreebution_nfts.taxon_id IS 'References treekipedia.species.taxon_id';


--
-- Name: COLUMN contreebution_nfts.wallet_address; Type: COMMENT; Schema: public; Owner: tree_user
--

COMMENT ON COLUMN public.contreebution_nfts.wallet_address IS 'Wallet address of the NFT recipient';


--
-- Name: COLUMN contreebution_nfts.points; Type: COMMENT; Schema: public; Owner: tree_user
--

COMMENT ON COLUMN public.contreebution_nfts.points IS 'Points awarded for this contribution, default is 2';


--
-- Name: COLUMN contreebution_nfts.ipfs_cid; Type: COMMENT; Schema: public; Owner: tree_user
--

COMMENT ON COLUMN public.contreebution_nfts.ipfs_cid IS 'IPFS CID of the NFT metadata';


--
-- Name: COLUMN contreebution_nfts.transaction_hash; Type: COMMENT; Schema: public; Owner: tree_user
--

COMMENT ON COLUMN public.contreebution_nfts.transaction_hash IS 'Blockchain transaction hash from minting';


--
-- Name: COLUMN contreebution_nfts.metadata; Type: COMMENT; Schema: public; Owner: tree_user
--

COMMENT ON COLUMN public.contreebution_nfts.metadata IS 'Additional JSON metadata for the NFT';


--
-- Name: contreebution_nfts_id_seq; Type: SEQUENCE; Schema: public; Owner: tree_user
--

CREATE SEQUENCE public.contreebution_nfts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.contreebution_nfts_id_seq OWNER TO tree_user;

--
-- Name: contreebution_nfts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: tree_user
--

ALTER SEQUENCE public.contreebution_nfts_id_seq OWNED BY public.contreebution_nfts.id;


--
-- Name: species; Type: TABLE; Schema: public; Owner: tree_user
--

CREATE TABLE public.species (
    taxon_id text NOT NULL,
    species character varying(300),
    family character varying(300),
    genus character varying(300),
    subspecies text,
    specific_epithet character varying(300),
    accepted_scientific_name text,
    synonyms text,
    common_name text,
    common_countries text,
    countries_introduced text,
    countries_invasive text,
    countries_native text,
    class character varying(300),
    taxonomic_order character varying(300),
    ecoregions text,
    biomes text,
    habitat text,
    forest_type text,
    wetland_type text,
    urban_setting text,
    elevation_ranges text,
    compatible_soil_types text,
    associated_species text,
    native_adapted_habitats text,
    agroforestry_use_cases text,
    successional_stage character varying(300),
    tolerances text,
    forest_layers text,
    growth_form character varying(300),
    leaf_type character varying(300),
    deciduous_evergreen character varying(300),
    flower_color character varying(300),
    fruit_type character varying(300),
    bark_characteristics text,
    maximum_height numeric(10,2),
    maximum_diameter numeric(10,2),
    lifespan character varying(300),
    maximum_tree_age integer,
    conservation_status character varying(300),
    climate_change_vulnerability character varying(300),
    national_conservation_status text,
    verification_status character varying(300),
    threats text,
    timber_value text,
    non_timber_products text,
    cultural_significance text,
    cultivars text,
    nutritional_caloric_value text,
    cultivation_details text,
    stewardship_best_practices text,
    planting_recipes text,
    pruning_maintenance text,
    disease_pest_management text,
    fire_management text,
    general_description text,
    associated_media text,
    ecological_function text,
    default_image character varying(300),
    total_occurrences integer,
    allometric_models text,
    allometric_curve text,
    reference_list text,
    data_sources text,
    ipfs_cid character varying(300),
    last_updated_date timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.species OWNER TO tree_user;

--
-- Name: TABLE species; Type: COMMENT; Schema: public; Owner: tree_user
--

COMMENT ON TABLE public.species IS 'Contains comprehensive tree species data';


--
-- Name: users; Type: TABLE; Schema: public; Owner: tree_user
--

CREATE TABLE public.users (
    id integer NOT NULL,
    wallet_address text NOT NULL,
    total_points integer DEFAULT 0,
    first_contribution_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    last_contribution_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    contribution_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    display_name text
);


ALTER TABLE public.users OWNER TO tree_user;

--
-- Name: TABLE users; Type: COMMENT; Schema: public; Owner: tree_user
--

COMMENT ON TABLE public.users IS 'Stores user information and their total accumulated points';


--
-- Name: COLUMN users.wallet_address; Type: COMMENT; Schema: public; Owner: tree_user
--

COMMENT ON COLUMN public.users.wallet_address IS 'Unique blockchain wallet address of the user';


--
-- Name: COLUMN users.total_points; Type: COMMENT; Schema: public; Owner: tree_user
--

COMMENT ON COLUMN public.users.total_points IS 'Total points accumulated by the user across all contributions';


--
-- Name: COLUMN users.contribution_count; Type: COMMENT; Schema: public; Owner: tree_user
--

COMMENT ON COLUMN public.users.contribution_count IS 'Total number of contributions made by the user';


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: tree_user
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO tree_user;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: tree_user
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: contreebution_nfts id; Type: DEFAULT; Schema: public; Owner: tree_user
--

ALTER TABLE ONLY public.contreebution_nfts ALTER COLUMN id SET DEFAULT nextval('public.contreebution_nfts_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: tree_user
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: contreebution_nfts contreebution_nfts_global_id_key; Type: CONSTRAINT; Schema: public; Owner: tree_user
--

ALTER TABLE ONLY public.contreebution_nfts
    ADD CONSTRAINT contreebution_nfts_global_id_key UNIQUE (global_id);


--
-- Name: contreebution_nfts contreebution_nfts_pkey; Type: CONSTRAINT; Schema: public; Owner: tree_user
--

ALTER TABLE ONLY public.contreebution_nfts
    ADD CONSTRAINT contreebution_nfts_pkey PRIMARY KEY (id);


--
-- Name: species species_pkey; Type: CONSTRAINT; Schema: public; Owner: tree_user
--

ALTER TABLE ONLY public.species
    ADD CONSTRAINT species_pkey PRIMARY KEY (taxon_id);


--
-- Name: users unique_wallet_address; Type: CONSTRAINT; Schema: public; Owner: tree_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT unique_wallet_address UNIQUE (wallet_address);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: tree_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_wallet_address_key; Type: CONSTRAINT; Schema: public; Owner: tree_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_wallet_address_key UNIQUE (wallet_address);


--
-- Name: idx_contreebution_nfts_taxon_id; Type: INDEX; Schema: public; Owner: tree_user
--

CREATE INDEX idx_contreebution_nfts_taxon_id ON public.contreebution_nfts USING btree (taxon_id);


--
-- Name: idx_contreebution_nfts_wallet_address; Type: INDEX; Schema: public; Owner: tree_user
--

CREATE INDEX idx_contreebution_nfts_wallet_address ON public.contreebution_nfts USING btree (wallet_address);


--
-- Name: idx_species_accepted_scientific_name; Type: INDEX; Schema: public; Owner: tree_user
--

CREATE INDEX idx_species_accepted_scientific_name ON public.species USING btree (accepted_scientific_name);


--
-- Name: idx_species_common_name; Type: INDEX; Schema: public; Owner: tree_user
--

CREATE INDEX idx_species_common_name ON public.species USING btree (common_name);


--
-- Name: idx_species_taxon_id; Type: INDEX; Schema: public; Owner: tree_user
--

CREATE INDEX idx_species_taxon_id ON public.species USING btree (taxon_id);


--
-- Name: idx_users_wallet_address; Type: INDEX; Schema: public; Owner: tree_user
--

CREATE INDEX idx_users_wallet_address ON public.users USING btree (wallet_address);


--
-- Name: contreebution_nfts trigger_update_user_points; Type: TRIGGER; Schema: public; Owner: tree_user
--

CREATE TRIGGER trigger_update_user_points AFTER INSERT ON public.contreebution_nfts FOR EACH ROW EXECUTE FUNCTION public.update_user_points();


--
-- PostgreSQL database dump complete
--

