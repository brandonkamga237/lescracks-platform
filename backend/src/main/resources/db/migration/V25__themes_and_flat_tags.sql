-- The 67 categories become 9 themes, and tags stop belonging to a category.
--
-- Themes are what the blog filters on and what members pick as interests: a short list people
-- can scan. Tags are free words on an article, unique by name: "API" was stored three times,
-- once per category, and about 2,000 seeded tags were never used by any article.

-- 1. The themes. "Développement web" and "Cybersécurité" already exist and are kept.
INSERT INTO categories (name, slug, description)
SELECT t.name, t.slug, t.description
FROM (VALUES
    ('Développement web', 'developpement-web', 'Sites et applications web, du navigateur au serveur qui les sert.'),
    ('Backend & bases de données', 'backend-bases-de-donnees', 'Les services, les API et les données qui font tourner une application.'),
    ('Mobile', 'mobile', 'Applications Android, iOS et multiplateformes.'),
    ('Data & IA', 'data-ia', 'Données, apprentissage automatique et intelligence artificielle.'),
    ('DevOps & Cloud', 'devops-cloud', 'Livrer, déployer et faire tourner un logiciel en production.'),
    ('Cybersécurité', 'cybersecurite', 'Protéger les systèmes, les données et les identités.'),
    ('Architecture & qualité', 'architecture-qualite', 'Concevoir un logiciel qui tient dans le temps : architecture, patterns, tests et performance.'),
    ('Fondamentaux & langages', 'fondamentaux-langages', 'Algorithmique, langages et fonctionnement de la machine.'),
    ('Carrière tech', 'carriere-tech', 'Trouver sa place, progresser et travailler avec les autres.')
) AS t (name, slug, description)
WHERE NOT EXISTS (SELECT 1 FROM categories c WHERE lower(c.name) = lower(t.name));

UPDATE categories c SET description = t.description
FROM (VALUES
    ('Développement web', 'developpement-web', 'Sites et applications web, du navigateur au serveur qui les sert.'),
    ('Backend & bases de données', 'backend-bases-de-donnees', 'Les services, les API et les données qui font tourner une application.'),
    ('Mobile', 'mobile', 'Applications Android, iOS et multiplateformes.'),
    ('Data & IA', 'data-ia', 'Données, apprentissage automatique et intelligence artificielle.'),
    ('DevOps & Cloud', 'devops-cloud', 'Livrer, déployer et faire tourner un logiciel en production.'),
    ('Cybersécurité', 'cybersecurite', 'Protéger les systèmes, les données et les identités.'),
    ('Architecture & qualité', 'architecture-qualite', 'Concevoir un logiciel qui tient dans le temps : architecture, patterns, tests et performance.'),
    ('Fondamentaux & langages', 'fondamentaux-langages', 'Algorithmique, langages et fonctionnement de la machine.'),
    ('Carrière tech', 'carriere-tech', 'Trouver sa place, progresser et travailler avec les autres.')
) AS t (name, slug, description)
WHERE lower(c.name) = lower(t.name);

-- 2. Where each old category goes. One that an admin added later, and is not in the list,
--    lands in "Fondamentaux & langages" rather than being lost.
CREATE TEMPORARY TABLE theme_of (category VARCHAR(80) PRIMARY KEY, theme VARCHAR(80) NOT NULL);
INSERT INTO theme_of (category, theme) VALUES
    ('Frontend', 'Développement web'),
    ('JavaScript', 'Développement web'),
    ('TypeScript', 'Développement web'),
    ('Node.js', 'Développement web'),
    ('PHP', 'Développement web'),
    ('Ruby', 'Développement web'),
    ('Développement web', 'Développement web'),
    ('WebAssembly', 'Développement web'),
    ('UX/UI Design', 'Développement web'),
    ('Backend', 'Backend & bases de données'),
    ('Conception d''API', 'Backend & bases de données'),
    ('Java', 'Backend & bases de données'),
    ('Spring', 'Backend & bases de données'),
    ('Go', 'Backend & bases de données'),
    ('C# & .NET', 'Backend & bases de données'),
    ('Base de données', 'Backend & bases de données'),
    ('Cache', 'Backend & bases de données'),
    ('Messagerie & streaming', 'Backend & bases de données'),
    ('Moteurs de recherche', 'Backend & bases de données'),
    ('Développement mobile', 'Mobile'),
    ('Kotlin', 'Mobile'),
    ('Data Science', 'Data & IA'),
    ('Big Data', 'Data & IA'),
    ('Intelligence artificielle', 'Data & IA'),
    ('MLOps', 'Data & IA'),
    ('Mathématiques pour développeurs', 'Data & IA'),
    ('DevOps', 'DevOps & Cloud'),
    ('Docker', 'DevOps & Cloud'),
    ('Kubernetes', 'DevOps & Cloud'),
    ('CI/CD', 'DevOps & Cloud'),
    ('Cloud', 'DevOps & Cloud'),
    ('Infrastructure as Code', 'DevOps & Cloud'),
    ('Linux', 'DevOps & Cloud'),
    ('Observabilité', 'DevOps & Cloud'),
    ('SRE', 'DevOps & Cloud'),
    ('Réseaux', 'DevOps & Cloud'),
    ('Git', 'DevOps & Cloud'),
    ('GitHub', 'DevOps & Cloud'),
    ('Cybersécurité', 'Cybersécurité'),
    ('Cryptographie', 'Cybersécurité'),
    ('Identité & accès', 'Cybersécurité'),
    ('Blockchain', 'Cybersécurité'),
    ('Architecture logicielle', 'Architecture & qualité'),
    ('Design Patterns', 'Architecture & qualité'),
    ('Systèmes distribués', 'Architecture & qualité'),
    ('Concurrence & parallélisme', 'Architecture & qualité'),
    ('Performance', 'Architecture & qualité'),
    ('Qualité logicielle', 'Architecture & qualité'),
    ('Tests', 'Architecture & qualité'),
    ('Outils du développeur', 'Architecture & qualité'),
    ('Algorithmique', 'Fondamentaux & langages'),
    ('Programmation', 'Fondamentaux & langages'),
    ('Python', 'Fondamentaux & langages'),
    ('C & C++', 'Fondamentaux & langages'),
    ('Rust', 'Fondamentaux & langages'),
    ('Programmation système', 'Fondamentaux & langages'),
    ('Systèmes d''exploitation', 'Fondamentaux & langages'),
    ('Compilateurs & interpréteurs', 'Fondamentaux & langages'),
    ('IoT & Embarqué', 'Fondamentaux & langages'),
    ('Jeux vidéo', 'Fondamentaux & langages'),
    ('Projets from scratch', 'Fondamentaux & langages'),
    ('Open source', 'Fondamentaux & langages'),
    ('Carrières tech', 'Carrière tech'),
    ('Soft skills', 'Carrière tech'),
    ('Entrepreneuriat tech', 'Carrière tech'),
    ('Gestion de projet', 'Carrière tech'),
    ('Automatisation & no-code', 'Carrière tech');

CREATE TEMPORARY TABLE category_theme AS
SELECT c.id AS category_id, th.id AS theme_id
FROM categories c
LEFT JOIN theme_of m ON lower(m.category) = lower(c.name)
JOIN categories th ON lower(th.name) = lower(COALESCE(m.theme, 'Fondamentaux & langages'))
WHERE lower(c.name) NOT IN (lower('Développement web'), lower('Backend & bases de données'), lower('Mobile'), lower('Data & IA'), lower('DevOps & Cloud'), lower('Cybersécurité'), lower('Architecture & qualité'), lower('Fondamentaux & langages'), lower('Carrière tech'));

-- 3. Articles and member interests move to their theme.
UPDATE resources r SET category_id = ct.theme_id
FROM category_theme ct WHERE r.category_id = ct.category_id;

INSERT INTO user_interests (user_id, category_id)
SELECT DISTINCT ui.user_id, ct.theme_id
FROM user_interests ui JOIN category_theme ct ON ct.category_id = ui.category_id
ON CONFLICT DO NOTHING;

DELETE FROM user_interests WHERE category_id IN (SELECT category_id FROM category_theme);

-- 4. Tags: keep only those an article uses, merge the ones that share a name, then detach them
--    from categories. Done before the old categories go, since tags cascade from them.
DELETE FROM tags t WHERE NOT EXISTS (SELECT 1 FROM resource_tags rt WHERE rt.tag_id = t.id);

CREATE TEMPORARY TABLE tag_keeper AS
SELECT t.id AS tag_id, first_value(t.id) OVER (PARTITION BY lower(t.name) ORDER BY t.id) AS keeper_id
FROM tags t;

INSERT INTO resource_tags (resource_id, tag_id)
SELECT rt.resource_id, k.keeper_id
FROM resource_tags rt JOIN tag_keeper k ON k.tag_id = rt.tag_id
WHERE k.tag_id <> k.keeper_id
ON CONFLICT DO NOTHING;

DELETE FROM tags WHERE id IN (SELECT tag_id FROM tag_keeper WHERE tag_id <> keeper_id);

ALTER TABLE tags DROP CONSTRAINT tags_name_per_category_unique;
ALTER TABLE tags DROP COLUMN category_id;
CREATE UNIQUE INDEX tags_name_unique ON tags (lower(name));

-- 5. The old categories, now empty.
DELETE FROM categories WHERE id IN (SELECT category_id FROM category_theme);
