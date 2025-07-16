\c grottoce;

CREATE VIEW v_caver_roles AS
SELECT  
  c.id AS caver_id,  
  c.nickname,  
  c.name,  
  c.surname,  
  (c.mail_is_valid AND c.password IS NOT NULL AND c.password <> '') AS is_user,  
  CASE WHEN auth.id_caver IS NOT NULL THEN true ELSE false END as is_author,  
  CASE WHEN contrib.id_author IS NOT NULL THEN true ELSE false END as is_contributor  
FROM t_caver c  
LEFT JOIN (  
  SELECT DISTINCT id_caver  
  FROM j_document_caver_author  
) auth ON auth.id_caver = c.id  
LEFT JOIN (  
  SELECT DISTINCT id_author  
  FROM t_document  
) contrib ON contrib.id_author = c.id;