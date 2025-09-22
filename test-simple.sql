-- Basit test script'i
-- Bu script'i Supabase SQL Editor'da çalıştırın

-- 1. Mevcut sunucuları kontrol et
SELECT id, name, invite_link FROM servers LIMIT 5;

-- 2. Mevcut kullanıcıları kontrol et
SELECT id, email FROM auth.users LIMIT 5;

-- 3. Server reviews tablosunu kontrol et
SELECT COUNT(*) as review_count FROM server_reviews;

-- 4. Eğer hiç review yoksa, basit bir test review ekle
DO $$
DECLARE
    test_user_id UUID;
    test_server_id UUID;
BEGIN
    -- İlk kullanıcıyı al
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;
    
    -- İlk sunucuyu al
    SELECT id INTO test_server_id FROM servers LIMIT 1;
    
    -- Eğer kullanıcı ve sunucu varsa, test review ekle
    IF test_user_id IS NOT NULL AND test_server_id IS NOT NULL THEN
        -- Önce mevcut review'ı sil (eğer varsa)
        DELETE FROM server_reviews 
        WHERE user_id = test_user_id AND server_id = test_server_id;
        
        -- Yeni test review ekle
        INSERT INTO server_reviews (user_id, server_id, rating, comment)
        VALUES (test_user_id, test_server_id, 5, 'Test review - Bu bir test yorumudur!');
        
        RAISE NOTICE 'Test review added successfully!';
    ELSE
        RAISE NOTICE 'No users or servers found to create test review';
    END IF;
END $$;

-- 5. Sonuçları göster
SELECT 
    s.name as server_name,
    sr.rating,
    sr.comment,
    sr.created_at,
    u.email as user_email
FROM server_reviews sr
JOIN servers s ON sr.server_id = s.id
JOIN auth.users u ON sr.user_id = u.id
ORDER BY sr.created_at DESC
LIMIT 10;
