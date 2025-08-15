-- Update L-Carnitine for Men article
UPDATE articles
SET content_markdown = REPLACE(content_markdown, '/product/l-carnitine-bixirun', '/product/l-9fe2ee2e')
WHERE title LIKE '%L-Карнитин для мужчин%';
 
-- Update L-Carnitine for Women article
UPDATE articles
SET content_markdown = REPLACE(content_markdown, '/product/l-carnitine-bixirun', '/product/l-9fe2ee2e')
WHERE title LIKE '%L-Карнитин для женщин%'; 