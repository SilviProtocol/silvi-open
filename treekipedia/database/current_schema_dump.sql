--
-- PostgreSQL database dump
--

\restrict h6aKhRJbKnFrhJ7yphuwoPz37LUDzi13yV9aB73lOa3G6XvaM41ZYslXeFhanVQ

-- Dumped from database version 14.19 (Ubuntu 14.19-0ubuntu0.22.04.1)
-- Dumped by pg_dump version 14.19 (Ubuntu 14.19-0ubuntu0.22.04.1)

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
-- Name: postgis; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;


--
-- Name: EXTENSION postgis; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION postgis IS 'PostGIS geometry and geography spatial types and functions';


--
-- Name: get_sponsorship_status(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_sponsorship_status(tx_hash text) RETURNS TABLE(transaction_hash text, status character varying, total_amount numeric, wallet_address text, chain text, payment_timestamp timestamp with time zone, species_count bigint, completed_count bigint)
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.transaction_hash,
    s.status,
    s.total_amount,
    s.wallet_address,
    s.chain,
    s.payment_timestamp,
    COUNT(si.id) AS species_count,
    COUNT(CASE WHEN si.research_status = 'completed' THEN 1 END) AS completed_count
  FROM 
    sponsorships s
  LEFT JOIN 
    sponsorship_items si ON s.id = si.sponsorship_id
  WHERE 
    s.transaction_hash = tx_hash
  GROUP BY 
    s.id, s.transaction_hash, s.status, s.total_amount, s.wallet_address, s.chain, s.payment_timestamp;
END;
$$;


--
-- Name: FUNCTION get_sponsorship_status(tx_hash text); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.get_sponsorship_status(tx_hash text) IS 'Returns detailed status for a sponsorship by transaction hash';


--
-- Name: migrate_legacy_to_ai_fields(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.migrate_legacy_to_ai_fields() RETURNS void
    LANGUAGE plpgsql
    AS $$ BEGIN UPDATE species SET general_description_ai = general_description WHERE general_description IS NOT NULL AND (general_description_ai IS NULL OR general_description_ai = ''); UPDATE species SET habitat_ai = habitat WHERE habitat IS NOT NULL AND (habitat_ai IS NULL OR habitat_ai = ''); UPDATE species SET ecological_function_ai = ecological_function WHERE ecological_function IS NOT NULL AND (ecological_function_ai IS NULL OR ecological_function_ai = ''); END; $$;


--
-- Name: update_species_research_queue_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_species_research_queue_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
   NEW.updated_at = NOW(); 
   RETURN NEW;
END;
$$;


--
-- Name: update_species_sponsorship_status(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_species_sponsorship_status() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- If the research status is changed to 'completed'
  IF NEW.research_status = 'completed' AND OLD.research_status != 'completed' THEN
    -- Get the sponsorship record to access wallet_address and timestamp
    DECLARE
      sp_record RECORD;
    BEGIN
      SELECT * INTO sp_record FROM sponsorships WHERE id = NEW.sponsorship_id;
      
      -- Update the species table to show it's been sponsored
      UPDATE species 
      SET sponsored = TRUE, 
          sponsored_by = sp_record.wallet_address,
          sponsored_at = sp_record.payment_timestamp
      WHERE taxon_id = NEW.taxon_id;
    END;
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: FUNCTION update_species_sponsorship_status(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.update_species_sponsorship_status() IS 'Updates species table when research for a sponsored species is completed';


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


--
-- Name: update_user_points(); Type: FUNCTION; Schema: public; Owner: -
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


--
-- Name: FUNCTION update_user_points(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.update_user_points() IS 'Updates users table when a new NFT is inserted';


--
-- Name: global_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.global_id_seq
    START WITH 0
    INCREMENT BY 1
    MINVALUE 0
    NO MAXVALUE
    CACHE 1;


--
-- Name: SEQUENCE global_id_seq; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON SEQUENCE public.global_id_seq IS 'Generates unique global_id values for contreebution_nfts';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: contreebution_nfts; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: TABLE contreebution_nfts; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.contreebution_nfts IS 'Tracks all Contreebution NFTs minted for users';


--
-- Name: COLUMN contreebution_nfts.global_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.contreebution_nfts.global_id IS 'Unique sequential identifier for the NFT';


--
-- Name: COLUMN contreebution_nfts.taxon_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.contreebution_nfts.taxon_id IS 'References treekipedia.species.taxon_id';


--
-- Name: COLUMN contreebution_nfts.wallet_address; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.contreebution_nfts.wallet_address IS 'Wallet address of the NFT recipient';


--
-- Name: COLUMN contreebution_nfts.points; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.contreebution_nfts.points IS 'Points awarded for this contribution, default is 2';


--
-- Name: COLUMN contreebution_nfts.ipfs_cid; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.contreebution_nfts.ipfs_cid IS 'IPFS CID of the NFT metadata';


--
-- Name: COLUMN contreebution_nfts.transaction_hash; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.contreebution_nfts.transaction_hash IS 'Blockchain transaction hash from minting';


--
-- Name: COLUMN contreebution_nfts.metadata; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.contreebution_nfts.metadata IS 'Additional JSON metadata for the NFT';


--
-- Name: contreebution_nfts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.contreebution_nfts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: contreebution_nfts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.contreebution_nfts_id_seq OWNED BY public.contreebution_nfts.id;


--
-- Name: countries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.countries (
    gid integer NOT NULL,
    featurecla character varying(15),
    scalerank smallint,
    labelrank smallint,
    sovereignt character varying(32),
    sov_a3 character varying(3),
    adm0_dif smallint,
    level smallint,
    type character varying(17),
    tlc character varying(1),
    admin character varying(35),
    adm0_a3 character varying(3),
    geou_dif smallint,
    geounit character varying(35),
    gu_a3 character varying(3),
    su_dif smallint,
    subunit character varying(35),
    su_a3 character varying(3),
    brk_diff smallint,
    name character varying(25),
    name_long character varying(35),
    brk_a3 character varying(3),
    brk_name character varying(32),
    brk_group character varying(17),
    abbrev character varying(13),
    postal character varying(4),
    formal_en character varying(52),
    formal_fr character varying(35),
    name_ciawf character varying(45),
    note_adm0 character varying(16),
    note_brk character varying(51),
    name_sort character varying(35),
    name_alt character varying(14),
    mapcolor7 smallint,
    mapcolor8 smallint,
    mapcolor9 smallint,
    mapcolor13 smallint,
    pop_est double precision,
    pop_rank smallint,
    pop_year smallint,
    gdp_md integer,
    gdp_year smallint,
    economy character varying(26),
    income_grp character varying(23),
    fips_10 character varying(3),
    iso_a2 character varying(5),
    iso_a2_eh character varying(3),
    iso_a3 character varying(3),
    iso_a3_eh character varying(3),
    iso_n3 character varying(3),
    iso_n3_eh character varying(3),
    un_a3 character varying(4),
    wb_a2 character varying(3),
    wb_a3 character varying(3),
    woe_id integer,
    woe_id_eh integer,
    woe_note character varying(167),
    adm0_iso character varying(3),
    adm0_diff character varying(1),
    adm0_tlc character varying(3),
    adm0_a3_us character varying(3),
    adm0_a3_fr character varying(3),
    adm0_a3_ru character varying(3),
    adm0_a3_es character varying(3),
    adm0_a3_cn character varying(3),
    adm0_a3_tw character varying(3),
    adm0_a3_in character varying(3),
    adm0_a3_np character varying(3),
    adm0_a3_pk character varying(3),
    adm0_a3_de character varying(3),
    adm0_a3_gb character varying(3),
    adm0_a3_br character varying(3),
    adm0_a3_il character varying(3),
    adm0_a3_ps character varying(3),
    adm0_a3_sa character varying(3),
    adm0_a3_eg character varying(3),
    adm0_a3_ma character varying(3),
    adm0_a3_pt character varying(3),
    adm0_a3_ar character varying(3),
    adm0_a3_jp character varying(3),
    adm0_a3_ko character varying(3),
    adm0_a3_vn character varying(3),
    adm0_a3_tr character varying(3),
    adm0_a3_id character varying(3),
    adm0_a3_pl character varying(3),
    adm0_a3_gr character varying(3),
    adm0_a3_it character varying(3),
    adm0_a3_nl character varying(3),
    adm0_a3_se character varying(3),
    adm0_a3_bd character varying(3),
    adm0_a3_ua character varying(3),
    adm0_a3_un smallint,
    adm0_a3_wb smallint,
    continent character varying(23),
    region_un character varying(10),
    subregion character varying(25),
    region_wb character varying(26),
    name_len smallint,
    long_len smallint,
    abbrev_len smallint,
    tiny smallint,
    homepart smallint,
    min_zoom double precision,
    min_label double precision,
    max_label double precision,
    label_x double precision,
    label_y double precision,
    ne_id double precision,
    wikidataid character varying(8),
    name_ar character varying(72),
    name_bn character varying(125),
    name_de character varying(46),
    name_en character varying(44),
    name_es character varying(44),
    name_fa character varying(65),
    name_fr character varying(54),
    name_el character varying(75),
    name_he character varying(78),
    name_hi character varying(123),
    name_hu character varying(41),
    name_id character varying(46),
    name_it character varying(44),
    name_ja character varying(63),
    name_ko character varying(47),
    name_nl character varying(46),
    name_pl character varying(47),
    name_pt character varying(43),
    name_ru character varying(86),
    name_sv character varying(42),
    name_tr character varying(42),
    name_uk character varying(91),
    name_ur character varying(67),
    name_vi character varying(56),
    name_zh character varying(33),
    name_zht character varying(33),
    fclass_iso character varying(24),
    tlc_diff character varying(1),
    fclass_tlc character varying(18),
    fclass_us character varying(30),
    fclass_fr character varying(15),
    fclass_ru character varying(14),
    fclass_es character varying(12),
    fclass_cn character varying(24),
    fclass_tw character varying(15),
    fclass_in character varying(14),
    fclass_np character varying(24),
    fclass_pk character varying(15),
    fclass_de character varying(15),
    fclass_gb character varying(15),
    fclass_br character varying(12),
    fclass_il character varying(15),
    fclass_ps character varying(15),
    fclass_sa character varying(15),
    fclass_eg character varying(24),
    fclass_ma character varying(24),
    fclass_pt character varying(15),
    fclass_ar character varying(12),
    fclass_jp character varying(15),
    fclass_ko character varying(15),
    fclass_vn character varying(12),
    fclass_tr character varying(15),
    fclass_id character varying(24),
    fclass_pl character varying(15),
    fclass_gr character varying(12),
    fclass_it character varying(15),
    fclass_nl character varying(15),
    fclass_se character varying(15),
    fclass_bd character varying(24),
    fclass_ua character varying(12),
    geom public.geometry(MultiPolygon,4326)
);


--
-- Name: countries_gid_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.countries_gid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: countries_gid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.countries_gid_seq OWNED BY public.countries.gid;


--
-- Name: ecoregion_assignments_backup; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ecoregion_assignments_backup (
    geohash_l7 character varying(7),
    eco_id integer,
    eco_name character varying(150),
    biome_name character varying(254),
    realm character varying(254)
);


--
-- Name: ecoregion_assignments_preserve; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ecoregion_assignments_preserve (
    geohash_l7 character varying(7),
    eco_id integer,
    eco_name character varying(150),
    biome_name character varying(254),
    realm character varying(254)
);


--
-- Name: ecoregions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ecoregions (
    ogc_fid integer NOT NULL,
    objectid numeric(32,10),
    eco_name character varying(150),
    biome_num numeric(32,10),
    biome_name character varying(254),
    realm character varying(254),
    eco_biome_ character varying(254),
    nnh numeric(11,0),
    eco_id numeric(11,0),
    shape_leng numeric(32,10),
    shape_area numeric(32,10),
    nnh_name character varying(64),
    color character varying(7),
    color_bio character varying(7),
    color_nnh character varying(7),
    license character varying(64),
    geom public.geometry(MultiPolygon,4326)
);


--
-- Name: ecoregions_ogc_fid_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ecoregions_ogc_fid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ecoregions_ogc_fid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ecoregions_ogc_fid_seq OWNED BY public.ecoregions.ogc_fid;


--
-- Name: geohash_species_tiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.geohash_species_tiles (
    geohash_l7 character varying(7) NOT NULL,
    species_data jsonb NOT NULL,
    total_occurrences integer,
    species_count integer,
    datetime timestamp without time zone,
    geometry public.geometry(Polygon,4326),
    center_point public.geography(Point,4326),
    data_source character varying(100),
    processing_date timestamp without time zone,
    observation_start_date date,
    observation_end_date date,
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    eco_id integer,
    eco_name character varying(150),
    biome_name character varying(254),
    realm character varying(254)
);


--
-- Name: geohash_species_tiles_v7_backup; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.geohash_species_tiles_v7_backup (
    geohash_l7 character varying(7),
    species_data jsonb,
    total_occurrences integer,
    species_count integer,
    datetime timestamp without time zone,
    geometry public.geometry(Polygon,4326),
    center_point public.geography(Point,4326),
    data_source character varying(100),
    processing_date timestamp without time zone,
    observation_start_date date,
    observation_end_date date,
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    eco_id integer,
    eco_name character varying(150),
    biome_name character varying(254),
    realm character varying(254)
);


--
-- Name: geohash_taxon_id_mapping; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.geohash_taxon_id_mapping (
    species_scientific_name text,
    subspecies text,
    join_key text,
    geohash_taxon_id text NOT NULL,
    taxon_full text
);


--
-- Name: images; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.images (
    id integer NOT NULL,
    taxon_id text NOT NULL,
    image_url text NOT NULL,
    license text,
    photographer text,
    page_url text,
    source text DEFAULT 'Wikimedia Commons'::text,
    is_primary boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: TABLE images; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.images IS 'Stores image URLs and metadata for tree species with proper attribution';


--
-- Name: COLUMN images.taxon_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.images.taxon_id IS 'Reference to species.taxon_id';


--
-- Name: COLUMN images.image_url; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.images.image_url IS 'Full URL to the image file';


--
-- Name: COLUMN images.license; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.images.license IS 'Creative Commons or other license (e.g., CC-BY-SA-3.0)';


--
-- Name: COLUMN images.photographer; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.images.photographer IS 'Attribution text for photographer (may contain HTML)';


--
-- Name: COLUMN images.page_url; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.images.page_url IS 'Original source page URL for the image';


--
-- Name: COLUMN images.source; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.images.source IS 'Data source (e.g., Wikimedia Commons)';


--
-- Name: COLUMN images.is_primary; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.images.is_primary IS 'Whether this is the primary/default image for the species';


--
-- Name: images_backup; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.images_backup (
    id integer,
    taxon_id text,
    image_url text,
    license text,
    photographer text,
    page_url text,
    source text,
    is_primary boolean,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


--
-- Name: images_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.images_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: images_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.images_id_seq OWNED BY public.images.id;


--
-- Name: researched_species_preserve; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.researched_species_preserve (
    taxon_id text,
    species character varying(500),
    family character varying(500),
    genus character varying(500),
    subspecies text,
    specific_epithet character varying(500),
    accepted_scientific_name text,
    synonyms text,
    common_name text,
    common_countries text,
    countries_introduced text,
    countries_invasive text,
    countries_native text,
    class character varying(500),
    taxonomic_order character varying(500),
    ecoregions text,
    biomes text,
    forest_type text,
    wetland_type text,
    urban_setting text,
    associated_species text,
    successional_stage character varying(500),
    tolerances text,
    forest_layers text,
    climate_change_vulnerability character varying(500),
    national_conservation_status text,
    verification_status character varying(500),
    threats text,
    timber_value text,
    non_timber_products text,
    cultivars text,
    nutritional_caloric_value text,
    cultivation_details text,
    associated_media text,
    default_image character varying(500),
    total_occurrences integer,
    allometric_models text,
    allometric_curve text,
    reference_list text,
    data_sources text,
    ipfs_cid character varying(500),
    last_updated_date timestamp without time zone,
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    species_scientific_name character varying(500),
    researched boolean,
    conservation_status_ai character varying(500),
    conservation_status_human character varying(500),
    general_description_ai text,
    general_description_human text,
    ecological_function_ai text,
    ecological_function_human text,
    habitat_ai text,
    habitat_human text,
    elevation_ranges_ai text,
    elevation_ranges_human text,
    compatible_soil_types_ai text,
    compatible_soil_types_human text,
    native_adapted_habitats_ai text,
    native_adapted_habitats_human text,
    agroforestry_use_cases_ai text,
    agroforestry_use_cases_human text,
    growth_form_ai character varying(500),
    growth_form_human character varying(500),
    leaf_type_ai character varying(500),
    leaf_type_human character varying(500),
    deciduous_evergreen_ai character varying(500),
    deciduous_evergreen_human character varying(500),
    flower_color_ai character varying(500),
    flower_color_human character varying(500),
    fruit_type_ai character varying(500),
    fruit_type_human character varying(500),
    bark_characteristics_ai text,
    bark_characteristics_human text,
    maximum_height_ai numeric(10,2),
    maximum_height_human numeric(10,2),
    maximum_diameter_ai numeric(10,2),
    maximum_diameter_human numeric(10,2),
    lifespan_ai character varying(500),
    lifespan_human character varying(500),
    maximum_tree_age_ai integer,
    maximum_tree_age_human integer,
    stewardship_best_practices_ai text,
    stewardship_best_practices_human text,
    planting_recipes_ai text,
    planting_recipes_human text,
    pruning_maintenance_ai text,
    pruning_maintenance_human text,
    disease_pest_management_ai text,
    disease_pest_management_human text,
    fire_management_ai text,
    fire_management_human text,
    cultural_significance_ai text,
    cultural_significance_human text,
    sponsored boolean,
    sponsored_by text,
    sponsored_at timestamp with time zone,
    bioregions text,
    commercial_species text,
    soil_texture_all text,
    soil_texture_dominant text,
    soil_texture_prefered text,
    soil_texture_tolerated text,
    ph_all text,
    ph_dominant text,
    ph_prefered text,
    ph_tolerated text,
    oc_all text,
    oc_dominant text,
    oc_prefered text,
    oc_tolerated text,
    present_intact_forest text,
    "functional_ecosystem_groups.x" text,
    "functional_ecosystem_groups.y" text,
    vegetationtype text,
    legacy_taxon_id text,
    taxon_id_new text
);


--
-- Name: species; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.species (
    species_scientific_name character varying(500),
    taxon_full text,
    family character varying(500),
    genus character varying(500),
    common_name text,
    common_countries text,
    accepted_scientific_name text,
    taxon_id text,
    class character varying(500),
    taxonomic_order character varying(500),
    ecoregions text,
    biomes text,
    general_description_human text,
    ecological_function_human text,
    elevation_ranges_human text,
    compatible_soil_types_human text,
    comercialspecies_upper text,
    default_image character varying(500),
    habitat_human text,
    total_occurrences text,
    specific_epithet character varying(500),
    conservation_status_ai character varying(500),
    general_description_ai text,
    ecological_function_ai text,
    elevation_ranges_ai text,
    compatible_soil_types_ai text,
    habitat_ai text,
    synonyms text,
    forest_type text,
    wetland_type text,
    urban_setting text,
    climate_change_vulnerability character varying(500),
    associated_species text,
    native_adapted_habitats_ai text,
    native_adapted_habitats_human text,
    agroforestry_use_cases_ai text,
    agroforestry_use_cases_human text,
    successional_stage character varying(500),
    tolerances text,
    forest_layers text,
    growth_form_ai character varying(500),
    growth_form_human character varying(500),
    leaf_type_ai character varying(500),
    leaf_type_human character varying(500),
    deciduous_evergreen_ai character varying(500),
    deciduous_evergreen_human character varying(500),
    flower_color_ai character varying(500),
    flower_color_human character varying(500),
    fruit_type_ai character varying(500),
    fruit_type_human character varying(500),
    bark_characteristics_ai text,
    bark_characteristics_human text,
    maximum_height_ai text,
    maximum_height_human text,
    maximum_diameter_ai text,
    maximum_diameter_human text,
    lifespan_ai character varying(500),
    lifespan_human character varying(500),
    maximum_tree_age_ai text,
    maximum_tree_age_human text,
    allometric_models text,
    allometric_curve text,
    national_conservation_status text,
    verification_status character varying(500),
    threats text,
    timber_value text,
    non_timber_products text,
    cultural_significance_ai text,
    cultural_significance_human text,
    cultivars text,
    nutritional_caloric_value text,
    cultivation_details text,
    stewardship_best_practices_ai text,
    stewardship_best_practices_human text,
    planting_recipes_ai text,
    planting_recipes_human text,
    pruning_maintenance_ai text,
    pruning_maintenance_human text,
    disease_pest_management_ai text,
    disease_pest_management_human text,
    fire_management_ai text,
    fire_management_human text,
    reference_list text,
    data_sources text,
    ipfs_cid character varying(500),
    last_updated_date text,
    researched text,
    associated_media text,
    bioregions text,
    conservation_status_human character varying(500),
    soil_texture_all text,
    soil_texture_dominant text,
    soil_texture_prefered text,
    soil_texture_tolerated text,
    ph_all text,
    ph_dominant text,
    ph_prefered text,
    ph_tolerated text,
    oc_all text,
    oc_dominant text,
    oc_prefered text,
    oc_tolerated text,
    countries_native text,
    countries_invasive text,
    countries_introduced text,
    present_intact_forest text,
    functional_ecosystem_groups text,
    vegetationtype text,
    comercialspecies_lower text,
    taxon_id_new text,
    subspecies text
);


--
-- Name: species_backup_20250420_065358; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.species_backup_20250420_065358 (
    taxon_id text,
    species character varying(500),
    family character varying(500),
    genus character varying(500),
    subspecies text,
    specific_epithet character varying(500),
    accepted_scientific_name text,
    synonyms text,
    common_name text,
    common_countries text,
    countries_introduced text,
    countries_invasive text,
    countries_native text,
    class character varying(500),
    taxonomic_order character varying(500),
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
    successional_stage character varying(500),
    tolerances text,
    forest_layers text,
    growth_form character varying(500),
    leaf_type character varying(500),
    deciduous_evergreen character varying(500),
    flower_color character varying(500),
    fruit_type character varying(500),
    bark_characteristics text,
    maximum_height numeric(10,2),
    maximum_diameter numeric(10,2),
    lifespan character varying(500),
    maximum_tree_age integer,
    conservation_status character varying(500),
    climate_change_vulnerability character varying(500),
    national_conservation_status text,
    verification_status character varying(500),
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
    default_image character varying(500),
    total_occurrences integer,
    allometric_models text,
    allometric_curve text,
    reference_list text,
    data_sources text,
    ipfs_cid character varying(500),
    last_updated_date timestamp without time zone,
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    species_scientific_name character varying(500),
    researched boolean,
    conservation_status_ai character varying(500),
    conservation_status_human character varying(500),
    general_description_ai text,
    general_description_human text,
    ecological_function_ai text,
    ecological_function_human text,
    habitat_ai text,
    habitat_human text,
    elevation_ranges_ai text,
    elevation_ranges_human text,
    compatible_soil_types_ai text,
    compatible_soil_types_human text,
    native_adapted_habitats_ai text,
    native_adapted_habitats_human text,
    agroforestry_use_cases_ai text,
    agroforestry_use_cases_human text,
    growth_form_ai character varying(500),
    growth_form_human character varying(500),
    leaf_type_ai character varying(500),
    leaf_type_human character varying(500),
    deciduous_evergreen_ai character varying(500),
    deciduous_evergreen_human character varying(500),
    flower_color_ai character varying(500),
    flower_color_human character varying(500),
    fruit_type_ai character varying(500),
    fruit_type_human character varying(500),
    bark_characteristics_ai text,
    bark_characteristics_human text,
    maximum_height_ai numeric(10,2),
    maximum_height_human numeric(10,2),
    maximum_diameter_ai numeric(10,2),
    maximum_diameter_human numeric(10,2),
    lifespan_ai character varying(500),
    lifespan_human character varying(500),
    maximum_tree_age_ai integer,
    maximum_tree_age_human integer,
    stewardship_best_practices_ai text,
    stewardship_best_practices_human text,
    planting_recipes_ai text,
    planting_recipes_human text,
    pruning_maintenance_ai text,
    pruning_maintenance_human text,
    disease_pest_management_ai text,
    disease_pest_management_human text,
    fire_management_ai text,
    fire_management_human text,
    cultural_significance_ai text,
    cultural_significance_human text
);


--
-- Name: species_import_temp; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.species_import_temp (
    species_scientific_name character varying(500),
    family character varying(500),
    genus character varying(500),
    subspecies text,
    common_name text,
    common_countries text,
    accepted_scientific_name text,
    taxon_id text,
    class character varying(500),
    taxonomic_order character varying(500),
    ecoregions text,
    biomes text,
    general_description_human text,
    ecological_function_human text,
    elevation_ranges_human text,
    compatible_soil_types_human text,
    "ComercialSpecies" text,
    default_image character varying(500),
    habitat_human text,
    total_occurrences integer,
    specific_epithet character varying(500),
    conservation_status_ai character varying(500),
    general_description_ai text,
    ecological_function_ai text,
    elevation_ranges_ai text,
    compatible_soil_types_ai text,
    habitat_ai text,
    synonyms text,
    forest_type text,
    wetland_type text,
    urban_setting text,
    climate_change_vulnerability character varying(500),
    associated_species text,
    native_adapted_habitats_ai text,
    native_adapted_habitats_human text,
    agroforestry_use_cases_ai text,
    agroforestry_use_cases_human text,
    successional_stage character varying(500),
    tolerances text,
    forest_layers text,
    growth_form_ai character varying(500),
    growth_form_human character varying(500),
    leaf_type_ai character varying(500),
    leaf_type_human character varying(500),
    deciduous_evergreen_ai character varying(500),
    deciduous_evergreen_human character varying(500),
    flower_color_ai character varying(500),
    flower_color_human character varying(500),
    fruit_type_ai character varying(500),
    fruit_type_human character varying(500),
    bark_characteristics_ai text,
    bark_characteristics_human text,
    maximum_height_ai numeric(10,2),
    maximum_height_human numeric(10,2),
    maximum_diameter_ai numeric(10,2),
    maximum_diameter_human numeric(10,2),
    lifespan_ai character varying(500),
    lifespan_human character varying(500),
    maximum_tree_age_ai integer,
    maximum_tree_age_human integer,
    allometric_models text,
    allometric_curve text,
    national_conservation_status text,
    verification_status character varying(500),
    threats text,
    timber_value text,
    non_timber_products text,
    cultural_significance_ai text,
    cultural_significance_human text,
    cultivars text,
    nutritional_caloric_value text,
    cultivation_details text,
    stewardship_best_practices_ai text,
    stewardship_best_practices_human text,
    planting_recipes_ai text,
    planting_recipes_human text,
    pruning_maintenance_ai text,
    pruning_maintenance_human text,
    disease_pest_management_ai text,
    disease_pest_management_human text,
    fire_management_ai text,
    fire_management_human text,
    reference_list text,
    data_sources text,
    ipfs_cid character varying(500),
    last_updated_date timestamp without time zone,
    researched boolean,
    associated_media text,
    bioregions text,
    conservation_status_human character varying(500),
    "Soil_texture_all" text,
    "Soil_texture_dominant" text,
    "Soil_texture_prefered" text,
    "Soil_texture_tolerated" text,
    "pH_all" text,
    "pH_dominant" text,
    "pH_prefered" text,
    "pH_tolerated" text,
    "OC_all" text,
    "OC_dominant" text,
    "OC_prefered" text,
    "OC_tolerated" text,
    countries_native text,
    countries_invasive text,
    countries_introduced text,
    "Present_Intact_Forest" text,
    "functional_ecosystem_groups.x" text,
    "functional_ecosystem_groups.y" text,
    "vegetationType" text,
    "comercialSpecies" text
);


--
-- Name: species_research_queue; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.species_research_queue (
    taxon_id character varying(255) NOT NULL,
    species_scientific_name character varying(255) NOT NULL,
    wallet_address character varying(255) NOT NULL,
    transaction_hash character varying(255) NOT NULL,
    chain character varying(50) NOT NULL,
    research_status character varying(50) DEFAULT 'queued'::character varying NOT NULL,
    error_message text,
    retry_count integer DEFAULT 0,
    added_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: species_taxon_id_backup; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.species_taxon_id_backup (
    taxon_id text,
    species_scientific_name character varying(500)
);


--
-- Name: species_v7_backup; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.species_v7_backup (
    taxon_id text,
    species character varying(500),
    family character varying(500),
    genus character varying(500),
    subspecies text,
    specific_epithet character varying(500),
    accepted_scientific_name text,
    synonyms text,
    common_name text,
    common_countries text,
    countries_introduced text,
    countries_invasive text,
    countries_native text,
    class character varying(500),
    taxonomic_order character varying(500),
    ecoregions text,
    biomes text,
    forest_type text,
    wetland_type text,
    urban_setting text,
    associated_species text,
    successional_stage character varying(500),
    tolerances text,
    forest_layers text,
    climate_change_vulnerability character varying(500),
    national_conservation_status text,
    verification_status character varying(500),
    threats text,
    timber_value text,
    non_timber_products text,
    cultivars text,
    nutritional_caloric_value text,
    cultivation_details text,
    associated_media text,
    default_image character varying(500),
    total_occurrences integer,
    allometric_models text,
    allometric_curve text,
    reference_list text,
    data_sources text,
    ipfs_cid character varying(500),
    last_updated_date timestamp without time zone,
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    species_scientific_name character varying(500),
    researched boolean,
    conservation_status_ai character varying(500),
    conservation_status_human character varying(500),
    general_description_ai text,
    general_description_human text,
    ecological_function_ai text,
    ecological_function_human text,
    habitat_ai text,
    habitat_human text,
    elevation_ranges_ai text,
    elevation_ranges_human text,
    compatible_soil_types_ai text,
    compatible_soil_types_human text,
    native_adapted_habitats_ai text,
    native_adapted_habitats_human text,
    agroforestry_use_cases_ai text,
    agroforestry_use_cases_human text,
    growth_form_ai character varying(500),
    growth_form_human character varying(500),
    leaf_type_ai character varying(500),
    leaf_type_human character varying(500),
    deciduous_evergreen_ai character varying(500),
    deciduous_evergreen_human character varying(500),
    flower_color_ai character varying(500),
    flower_color_human character varying(500),
    fruit_type_ai character varying(500),
    fruit_type_human character varying(500),
    bark_characteristics_ai text,
    bark_characteristics_human text,
    maximum_height_ai numeric(10,2),
    maximum_height_human numeric(10,2),
    maximum_diameter_ai numeric(10,2),
    maximum_diameter_human numeric(10,2),
    lifespan_ai character varying(500),
    lifespan_human character varying(500),
    maximum_tree_age_ai integer,
    maximum_tree_age_human integer,
    stewardship_best_practices_ai text,
    stewardship_best_practices_human text,
    planting_recipes_ai text,
    planting_recipes_human text,
    pruning_maintenance_ai text,
    pruning_maintenance_human text,
    disease_pest_management_ai text,
    disease_pest_management_human text,
    fire_management_ai text,
    fire_management_human text,
    cultural_significance_ai text,
    cultural_significance_human text,
    sponsored boolean,
    sponsored_by text,
    sponsored_at timestamp with time zone,
    bioregions text,
    commercial_species text,
    soil_texture_all text,
    soil_texture_dominant text,
    soil_texture_prefered text,
    soil_texture_tolerated text,
    ph_all text,
    ph_dominant text,
    ph_prefered text,
    ph_tolerated text,
    oc_all text,
    oc_dominant text,
    oc_prefered text,
    oc_tolerated text,
    present_intact_forest text,
    "functional_ecosystem_groups.x" text,
    "functional_ecosystem_groups.y" text,
    vegetationtype text,
    legacy_taxon_id text,
    taxon_id_new text
);


--
-- Name: species_v8; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.species_v8 (
    taxon_id text NOT NULL,
    species character varying(500),
    family character varying(500),
    genus character varying(500),
    subspecies text,
    specific_epithet character varying(500),
    accepted_scientific_name text,
    synonyms text,
    common_name text,
    common_countries text,
    countries_introduced text,
    countries_invasive text,
    countries_native text,
    class character varying(500),
    taxonomic_order character varying(500),
    ecoregions text,
    biomes text,
    forest_type text,
    wetland_type text,
    urban_setting text,
    associated_species text,
    successional_stage character varying(500),
    tolerances text,
    forest_layers text,
    climate_change_vulnerability character varying(500),
    national_conservation_status text,
    verification_status character varying(500),
    threats text,
    timber_value text,
    non_timber_products text,
    cultivars text,
    nutritional_caloric_value text,
    cultivation_details text,
    associated_media text,
    default_image character varying(500),
    total_occurrences integer,
    allometric_models text,
    allometric_curve text,
    reference_list text,
    data_sources text,
    ipfs_cid character varying(500),
    last_updated_date timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    species_scientific_name character varying(500),
    researched boolean DEFAULT false,
    conservation_status_ai character varying(500),
    conservation_status_human character varying(500),
    general_description_ai text,
    general_description_human text,
    ecological_function_ai text,
    ecological_function_human text,
    habitat_ai text,
    habitat_human text,
    elevation_ranges_ai text,
    elevation_ranges_human text,
    compatible_soil_types_ai text,
    compatible_soil_types_human text,
    native_adapted_habitats_ai text,
    native_adapted_habitats_human text,
    agroforestry_use_cases_ai text,
    agroforestry_use_cases_human text,
    growth_form_ai character varying(500),
    growth_form_human character varying(500),
    leaf_type_ai character varying(500),
    leaf_type_human character varying(500),
    deciduous_evergreen_ai character varying(500),
    deciduous_evergreen_human character varying(500),
    flower_color_ai character varying(500),
    flower_color_human character varying(500),
    fruit_type_ai character varying(500),
    fruit_type_human character varying(500),
    bark_characteristics_ai text,
    bark_characteristics_human text,
    maximum_height_ai numeric(10,2),
    maximum_height_human numeric(10,2),
    maximum_diameter_ai numeric(10,2),
    maximum_diameter_human numeric(10,2),
    lifespan_ai character varying(500),
    lifespan_human character varying(500),
    maximum_tree_age_ai integer,
    maximum_tree_age_human integer,
    stewardship_best_practices_ai text,
    stewardship_best_practices_human text,
    planting_recipes_ai text,
    planting_recipes_human text,
    pruning_maintenance_ai text,
    pruning_maintenance_human text,
    disease_pest_management_ai text,
    disease_pest_management_human text,
    fire_management_ai text,
    fire_management_human text,
    cultural_significance_ai text,
    cultural_significance_human text,
    sponsored boolean DEFAULT false,
    sponsored_by text,
    sponsored_at timestamp with time zone,
    bioregions text,
    commercial_species text,
    soil_texture_all text,
    soil_texture_dominant text,
    soil_texture_prefered text,
    soil_texture_tolerated text,
    ph_all text,
    ph_dominant text,
    ph_prefered text,
    ph_tolerated text,
    oc_all text,
    oc_dominant text,
    oc_prefered text,
    oc_tolerated text,
    present_intact_forest text,
    "functional_ecosystem_groups.x" text,
    "functional_ecosystem_groups.y" text,
    vegetationtype text
);


--
-- Name: sponsorship_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sponsorship_items (
    id integer NOT NULL,
    sponsorship_id integer NOT NULL,
    taxon_id text NOT NULL,
    amount numeric DEFAULT 3 NOT NULL,
    research_status character varying(50) DEFAULT 'pending'::character varying,
    nft_token_id bigint,
    ipfs_cid text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: TABLE sponsorship_items; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.sponsorship_items IS 'Individual species funded through sponsorship transactions';


--
-- Name: sponsorship_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sponsorship_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sponsorship_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sponsorship_items_id_seq OWNED BY public.sponsorship_items.id;


--
-- Name: sponsorships; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sponsorships (
    id integer NOT NULL,
    wallet_address text NOT NULL,
    chain text NOT NULL,
    transaction_hash text,
    total_amount numeric NOT NULL,
    payment_timestamp timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    status character varying(50) DEFAULT 'pending'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: TABLE sponsorships; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.sponsorships IS 'Records of payment transactions for species research sponsorship';


--
-- Name: sponsorship_summary; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.sponsorship_summary AS
 SELECT s.id AS sponsorship_id,
    s.wallet_address,
    s.chain,
    s.transaction_hash,
    s.total_amount,
    s.payment_timestamp,
    s.status AS payment_status,
    count(si.id) AS species_count,
    sum(
        CASE
            WHEN ((si.research_status)::text = 'completed'::text) THEN 1
            ELSE 0
        END) AS completed_count,
    array_agg(si.taxon_id) AS taxon_ids
   FROM (public.sponsorships s
     LEFT JOIN public.sponsorship_items si ON ((s.id = si.sponsorship_id)))
  GROUP BY s.id, s.wallet_address, s.chain, s.transaction_hash, s.total_amount, s.payment_timestamp, s.status;


--
-- Name: VIEW sponsorship_summary; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.sponsorship_summary IS 'Provides a summary view of all sponsorships with species counts';


--
-- Name: sponsorships_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sponsorships_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sponsorships_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sponsorships_id_seq OWNED BY public.sponsorships.id;


--
-- Name: taxon_id_direct_mapping; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.taxon_id_direct_mapping (
    old_taxon_id text,
    new_taxon_id text,
    species_scientific_name text
);


--
-- Name: taxon_id_final_mapping; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.taxon_id_final_mapping (
    old_taxon_id text NOT NULL,
    new_taxon_id text,
    species_scientific_name text
);


--
-- Name: taxon_id_mapping; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.taxon_id_mapping (
    species_scientific_name text,
    subspecies text,
    taxon_full text,
    taxon_id_new_corrected text,
    taxon_id_new text
);


--
-- Name: taxon_mapping_new_to_final; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.taxon_mapping_new_to_final (
    new_taxon_id character varying(255) NOT NULL,
    final_taxon_id character varying(255)
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: TABLE users; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.users IS 'Stores user information and their total accumulated points';


--
-- Name: COLUMN users.wallet_address; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.users.wallet_address IS 'Unique blockchain wallet address of the user';


--
-- Name: COLUMN users.total_points; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.users.total_points IS 'Total points accumulated by the user across all contributions';


--
-- Name: COLUMN users.contribution_count; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.users.contribution_count IS 'Total number of contributions made by the user';


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: contreebution_nfts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contreebution_nfts ALTER COLUMN id SET DEFAULT nextval('public.contreebution_nfts_id_seq'::regclass);


--
-- Name: countries gid; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.countries ALTER COLUMN gid SET DEFAULT nextval('public.countries_gid_seq'::regclass);


--
-- Name: ecoregions ogc_fid; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ecoregions ALTER COLUMN ogc_fid SET DEFAULT nextval('public.ecoregions_ogc_fid_seq'::regclass);


--
-- Name: images id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.images ALTER COLUMN id SET DEFAULT nextval('public.images_id_seq'::regclass);


--
-- Name: sponsorship_items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sponsorship_items ALTER COLUMN id SET DEFAULT nextval('public.sponsorship_items_id_seq'::regclass);


--
-- Name: sponsorships id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sponsorships ALTER COLUMN id SET DEFAULT nextval('public.sponsorships_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: contreebution_nfts contreebution_nfts_global_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contreebution_nfts
    ADD CONSTRAINT contreebution_nfts_global_id_key UNIQUE (global_id);


--
-- Name: contreebution_nfts contreebution_nfts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contreebution_nfts
    ADD CONSTRAINT contreebution_nfts_pkey PRIMARY KEY (id);


--
-- Name: countries countries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.countries
    ADD CONSTRAINT countries_pkey PRIMARY KEY (gid);


--
-- Name: ecoregions ecoregions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ecoregions
    ADD CONSTRAINT ecoregions_pkey PRIMARY KEY (ogc_fid);


--
-- Name: geohash_taxon_id_mapping geohash_taxon_id_mapping_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.geohash_taxon_id_mapping
    ADD CONSTRAINT geohash_taxon_id_mapping_pkey PRIMARY KEY (geohash_taxon_id);


--
-- Name: images images_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.images
    ADD CONSTRAINT images_pkey PRIMARY KEY (id);


--
-- Name: species_research_queue species_research_queue_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.species_research_queue
    ADD CONSTRAINT species_research_queue_pkey PRIMARY KEY (taxon_id);


--
-- Name: sponsorship_items sponsorship_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sponsorship_items
    ADD CONSTRAINT sponsorship_items_pkey PRIMARY KEY (id);


--
-- Name: sponsorship_items sponsorship_items_sponsorship_id_taxon_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sponsorship_items
    ADD CONSTRAINT sponsorship_items_sponsorship_id_taxon_id_key UNIQUE (sponsorship_id, taxon_id);


--
-- Name: sponsorships sponsorships_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sponsorships
    ADD CONSTRAINT sponsorships_pkey PRIMARY KEY (id);


--
-- Name: sponsorships sponsorships_transaction_hash_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sponsorships
    ADD CONSTRAINT sponsorships_transaction_hash_key UNIQUE (transaction_hash);


--
-- Name: taxon_id_final_mapping taxon_id_final_mapping_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.taxon_id_final_mapping
    ADD CONSTRAINT taxon_id_final_mapping_pkey PRIMARY KEY (old_taxon_id);


--
-- Name: taxon_mapping_new_to_final taxon_mapping_new_to_final_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.taxon_mapping_new_to_final
    ADD CONSTRAINT taxon_mapping_new_to_final_pkey PRIMARY KEY (new_taxon_id);


--
-- Name: users unique_wallet_address; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT unique_wallet_address UNIQUE (wallet_address);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_wallet_address_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_wallet_address_key UNIQUE (wallet_address);


--
-- Name: countries_geom_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX countries_geom_idx ON public.countries USING gist (geom);


--
-- Name: ecoregions_geom_geom_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ecoregions_geom_geom_idx ON public.ecoregions USING gist (geom);


--
-- Name: idx_contreebution_nfts_taxon_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contreebution_nfts_taxon_id ON public.contreebution_nfts USING btree (taxon_id);


--
-- Name: idx_contreebution_nfts_wallet_address; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contreebution_nfts_wallet_address ON public.contreebution_nfts USING btree (wallet_address);


--
-- Name: idx_direct_mapping_old; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_direct_mapping_old ON public.taxon_id_direct_mapping USING btree (old_taxon_id);


--
-- Name: idx_ecoregions_biome_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ecoregions_biome_name ON public.ecoregions USING btree (biome_name);


--
-- Name: idx_ecoregions_eco_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ecoregions_eco_id ON public.ecoregions USING btree (eco_id);


--
-- Name: idx_ecoregions_eco_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ecoregions_eco_name ON public.ecoregions USING btree (eco_name);


--
-- Name: idx_ecoregions_realm; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ecoregions_realm ON public.ecoregions USING btree (realm);


--
-- Name: idx_final_mapping_new; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_final_mapping_new ON public.taxon_id_final_mapping USING btree (new_taxon_id);


--
-- Name: idx_geohash_l7; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_geohash_l7 ON public.geohash_species_tiles USING btree (geohash_l7);


--
-- Name: idx_images_primary; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_images_primary ON public.images USING btree (is_primary) WHERE (is_primary = true);


--
-- Name: idx_images_source; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_images_source ON public.images USING btree (source);


--
-- Name: idx_images_taxon_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_images_taxon_id ON public.images USING btree (taxon_id);


--
-- Name: idx_images_unique_primary_per_species; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_images_unique_primary_per_species ON public.images USING btree (taxon_id) WHERE (is_primary = true);


--
-- Name: idx_research_queue_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_research_queue_status ON public.species_research_queue USING btree (research_status);


--
-- Name: idx_research_queue_wallet; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_research_queue_wallet ON public.species_research_queue USING btree (wallet_address);


--
-- Name: idx_species_scientific_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_species_scientific_name ON public.species USING btree (species_scientific_name);


--
-- Name: idx_species_taxon_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_species_taxon_id ON public.species USING btree (taxon_id);


--
-- Name: idx_sponsorship_items_sponsorship_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sponsorship_items_sponsorship_id ON public.sponsorship_items USING btree (sponsorship_id);


--
-- Name: idx_sponsorship_items_taxon_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sponsorship_items_taxon_id ON public.sponsorship_items USING btree (taxon_id);


--
-- Name: idx_sponsorships_transaction_hash; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sponsorships_transaction_hash ON public.sponsorships USING btree (transaction_hash);


--
-- Name: idx_sponsorships_wallet_address; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sponsorships_wallet_address ON public.sponsorships USING btree (wallet_address);


--
-- Name: idx_users_wallet_address; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_wallet_address ON public.users USING btree (wallet_address);


--
-- Name: species_v8_accepted_scientific_name_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX species_v8_accepted_scientific_name_idx ON public.species_v8 USING btree (accepted_scientific_name);


--
-- Name: species_v8_common_name_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX species_v8_common_name_idx ON public.species_v8 USING btree (common_name);


--
-- Name: species_v8_researched_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX species_v8_researched_idx ON public.species_v8 USING btree (researched);


--
-- Name: species_v8_species_scientific_name_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX species_v8_species_scientific_name_idx ON public.species_v8 USING btree (species_scientific_name);


--
-- Name: species_v8_taxon_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX species_v8_taxon_id_idx ON public.species_v8 USING btree (taxon_id);


--
-- Name: sponsorship_items trigger_update_species_sponsorship; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_species_sponsorship AFTER UPDATE ON public.sponsorship_items FOR EACH ROW EXECUTE FUNCTION public.update_species_sponsorship_status();


--
-- Name: contreebution_nfts trigger_update_user_points; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_user_points AFTER INSERT ON public.contreebution_nfts FOR EACH ROW EXECUTE FUNCTION public.update_user_points();


--
-- Name: species_research_queue update_species_research_queue_timestamp; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_species_research_queue_timestamp BEFORE UPDATE ON public.species_research_queue FOR EACH ROW EXECUTE FUNCTION public.update_species_research_queue_updated_at();


--
-- Name: sponsorship_items sponsorship_items_sponsorship_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sponsorship_items
    ADD CONSTRAINT sponsorship_items_sponsorship_id_fkey FOREIGN KEY (sponsorship_id) REFERENCES public.sponsorships(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict h6aKhRJbKnFrhJ7yphuwoPz37LUDzi13yV9aB73lOa3G6XvaM41ZYslXeFhanVQ

