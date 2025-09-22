-- Admin kullanıcısı oluşturma script'i
-- Bu script'i Supabase SQL Editor'da çalıştırın

-- 1. Admin kullanıcısı oluştur (auth.users tablosuna)
-- NOT: Bu kısmı Supabase Dashboard > Authentication > Users'dan manuel olarak yapın
-- Email: admin@votesitem.com
-- Password: Admin123! (güçlü bir şifre kullanın)

-- 2. Admin kullanıcısını admin_users tablosuna ekle
DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Admin kullanıcısının ID'sini al
    SELECT id INTO admin_user_id FROM auth.users WHERE email = 'admin@votesitem.com' LIMIT 1;
    
    IF admin_user_id IS NOT NULL THEN
        -- Admin kullanıcısını admin_users tablosuna ekle
        INSERT INTO admin_users (user_id, username, role, permissions, is_active)
        VALUES (
            admin_user_id,
            'admin',
            'super_admin',
            '["all"]'::jsonb,
            true
        )
        ON CONFLICT (user_id) DO UPDATE SET
            role = 'super_admin',
            permissions = '["all"]'::jsonb,
            is_active = true,
            updated_at = NOW();
        
        RAISE NOTICE 'Admin user created successfully!';
    ELSE
        RAISE NOTICE 'Admin user not found in auth.users. Please create the user first in Supabase Dashboard > Authentication > Users';
    END IF;
END $$;

-- 3. Test banner oluştur
INSERT INTO banners (
    title,
    description,
    image_url,
    target_url,
    position,
    size,
    start_date,
    end_date,
    is_active,
    max_impressions,
    cost_per_impression,
    total_budget
) VALUES (
    'Test Banner',
    'Bu bir test bannerıdır',
    'https://via.placeholder.com/728x90/7c3aed/ffffff?text=Test+Banner',
    'https://example.com',
    'top',
    '728x90',
    NOW(),
    NOW() + INTERVAL '30 days',
    true,
    10000,
    0.01,
    100.00
) ON CONFLICT DO NOTHING;

-- 4. Test haber oluştur
INSERT INTO news (
    title,
    content,
    excerpt,
    status,
    published_at
) VALUES (
    'Hoş Geldiniz!',
    '<h1>MineVote Admin Paneline Hoş Geldiniz!</h1><p>Bu admin paneli ile sitenizi yönetebilirsiniz.</p>',
    'Admin paneline hoş geldiniz mesajı',
    'published',
    NOW()
) ON CONFLICT DO NOTHING;

-- 5. Sosyal medya hesapları ekle
INSERT INTO social_accounts (platform, username, url, is_active) VALUES
    ('discord', 'minevote', 'https://discord.gg/minevote', true),
    ('twitter', 'minevote', 'https://twitter.com/minevote', true),
    ('youtube', 'minevote', 'https://youtube.com/@minevote', true)
ON CONFLICT DO NOTHING;

-- 6. Sonuçları kontrol et
SELECT 
    'Admin Users' as table_name,
    COUNT(*) as count
FROM admin_users
UNION ALL
SELECT 
    'Banners' as table_name,
    COUNT(*) as count
FROM banners
UNION ALL
SELECT 
    'News' as table_name,
    COUNT(*) as count
FROM news
UNION ALL
SELECT 
    'Social Accounts' as table_name,
    COUNT(*) as count
FROM social_accounts;
