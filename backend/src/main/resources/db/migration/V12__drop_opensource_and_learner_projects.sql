-- The Open Source showcase and the learner project gallery are removed from the product.
-- contributor_projects is the join table, so it goes before the two it references.

DROP TABLE IF EXISTS contributor_projects;
DROP TABLE IF EXISTS contributors;
DROP TABLE IF EXISTS open_source_projects;
DROP TABLE IF EXISTS learner_projects;
