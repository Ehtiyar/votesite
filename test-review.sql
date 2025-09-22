-- Test review ekleme script'i
-- Bu script'i Supabase SQL Editor'da çalıştırın

-- 1. Önce bir test sunucusu oluştur (eğer yoksa)
INSERT INTO servers (
  name, 
  description, 
  invite_link, 
  ip_address, 
  game_version, 
  category, 
  owner_id,
  vote_count,
  member_count
) 
SELECT 
  'Test Server',
  'Bu bir test sunucusudur',
  'test.server.com',
  'test.server.com',
  '1.20.1',
  'Survival',
  (SELECT id FROM auth.users LIMIT 1),
  0,
  0
WHERE NOT EXISTS (
  SELECT 1 FROM servers WHERE invite_link = 'test.server.com'
);

-- 2. Test review'ları ekle (eğer yoksa)
INSERT INTO server_reviews (
  user_id,
  server_id,
  rating,
  comment
) 
SELECT 
  (SELECT id FROM auth.users LIMIT 1),
  (SELECT id FROM servers WHERE invite_link = 'test.server.com' LIMIT 1),
  5,
  'Harika bir sunucu! Çok eğlenceli.'
WHERE NOT EXISTS (
  SELECT 1 FROM server_reviews 
  WHERE user_id = (SELECT id FROM auth.users LIMIT 1)
  AND server_id = (SELECT id FROM servers WHERE invite_link = 'test.server.com' LIMIT 1)
);

-- 3. Sonuçları kontrol et
SELECT 
  s.name as server_name,
  COUNT(sr.id) as review_count,
  AVG(sr.rating) as average_rating
FROM servers s
LEFT JOIN server_reviews sr ON s.id = sr.server_id
WHERE s.invite_link = 'test.server.com'
GROUP BY s.id, s.name;

-- 4. Review'ları listele
SELECT 
  sr.rating,
  sr.comment,
  sr.created_at,
  p.username
FROM server_reviews sr
LEFT JOIN profiles p ON sr.user_id = p.id
WHERE sr.server_id = (SELECT id FROM servers WHERE invite_link = 'test.server.com' LIMIT 1)
ORDER BY sr.created_at DESC;
