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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: species; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.species (
    taxon_id text NOT NULL,
    species character varying(100),
    family character varying(100),
    genus character varying(100),
    subspecies text,
    common_name text,
    accepted_scientific_name text,
    common_countries text,
    class character varying(100),
    taxonomic_order character varying(100),
    ecoregions text,
    biomes text,
    conservation_status character varying(50),
    general_description text,
    associated_media text,
    ecological_function text,
    elevation_ranges text,
    compatible_soil_types text,
    default_image character varying(255),
    habitat text,
    total_occurrences integer,
    specific_epithet character varying(100),
    synonyms text,
    bioregions text,
    countries_introduced text,
    countries_invasive text,
    countries_native text,
    forest_type text,
    wetland_type text,
    urban_setting text,
    climate_change_vulnerability character varying(50),
    associated_species text,
    native_adapted_habitats text,
    agroforestry_use_cases text,
    successional_stage character varying(50),
    tolerances text,
    forest_layers text,
    growth_form character varying(50),
    leaf_type character varying(50),
    deciduous_evergreen character varying(20),
    flower_color character varying(50),
    fruit_type character varying(50),
    bark_characteristics text,
    maximum_height numeric(10,2),
    maximum_diameter numeric(10,2),
    lifespan character varying(50),
    maximum_tree_age integer,
    allometric_models text,
    allometric_curve text,
    national_conservation_status text,
    verification_status character varying(20),
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
    reference_list text,
    data_sources text,
    ipfs_cid character varying(100),
    last_updated_date timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.species OWNER TO postgres;

--
-- Name: species species_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.species
    ADD CONSTRAINT species_pkey PRIMARY KEY (taxon_id);


--
-- PostgreSQL database dump complete
--

