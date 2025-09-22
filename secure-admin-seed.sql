-- Secure Admin User Creation Script
-- Bu script'i Supabase SQL Editor'da çalıştırın

-- NOT: Bu script sadece development/test için kullanılmalıdır
-- Production'da admin kullanıcıları güvenli bir şekilde oluşturulmalıdır

-- 1. Admin kullanıcısı oluştur (Argon2 hash ile)
-- NOT: Gerçek production'da password hash'i backend'de oluşturulmalıdır
-- Bu örnek bcrypt hash kullanıyor (test için)

-- Test admin kullanıcısı (password: Admin123!)
-- Bu hash'i backend'de Argon2 ile oluşturun
INSERT INTO admin_users (
  username,
  email,
  password_hash,
  role,
  permissions,
  is_active,
  is_locked,
  failed_attempts,
  twofa_enabled
) VALUES (
  'admin',
  'admin@votesitem.com',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8Kz8KzK', -- Admin123! (bcrypt)
  'super_admin',
  '["all"]'::jsonb,
  true,
  false,
  0,
  false
) ON CONFLICT (username) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role,
  permissions = EXCLUDED.permissions,
  is_active = EXCLUDED.is_active,
  is_locked = false,
  failed_attempts = 0,
  updated_at = NOW();

-- Test moderator kullanıcısı (password: Mod123!)
INSERT INTO admin_users (
  username,
  email,
  password_hash,
  role,
  permissions,
  is_active,
  is_locked,
  failed_attempts,
  twofa_enabled
) VALUES (
  'moderator',
  'mod@votesitem.com',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8Kz8KzL', -- Mod123! (bcrypt)
  'moderator',
  '["read", "moderate"]'::jsonb,
  true,
  false,
  0,
  false
) ON CONFLICT (username) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role,
  permissions = EXCLUDED.permissions,
  is_active = EXCLUDED.is_active,
  is_locked = false,
  failed_attempts = 0,
  updated_at = NOW();

-- Test editor kullanıcısı (password: Edit123!)
INSERT INTO admin_users (
  username,
  email,
  password_hash,
  role,
  permissions,
  is_active,
  is_locked,
  failed_attempts,
  twofa_enabled
) VALUES (
  'editor',
  'editor@votesitem.com',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8Kz8KzM', -- Edit123! (bcrypt)
  'editor',
  '["read", "write"]'::jsonb,
  true,
  false,
  0,
  false
) ON CONFLICT (username) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role,
  permissions = EXCLUDED.permissions,
  is_active = EXCLUDED.is_active,
  is_locked = false,
  failed_attempts = 0,
  updated_at = NOW();

-- Test banner oluştur
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
  total_budget,
  created_by
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
  100.00,
  (SELECT id FROM admin_users WHERE username = 'admin' LIMIT 1)
) ON CONFLICT DO NOTHING;

-- Test haber oluştur
INSERT INTO news (
  title,
  content,
  excerpt,
  status,
  published_at,
  author_id
) VALUES (
  'Hoş Geldiniz!',
  '<h1>MineVote Admin Paneline Hoş Geldiniz!</h1><p>Bu admin paneli ile sitenizi yönetebilirsiniz.</p>',
  'Admin paneline hoş geldiniz mesajı',
  'published',
  NOW(),
  (SELECT id FROM admin_users WHERE username = 'admin' LIMIT 1)
) ON CONFLICT DO NOTHING;

-- Sosyal medya hesapları ekle
INSERT INTO social_accounts (platform, username, url, is_active) VALUES
  ('discord', 'minevote', 'https://discord.gg/minevote', true),
  ('twitter', 'minevote', 'https://twitter.com/minevote', true),
  ('youtube', 'minevote', 'https://youtube.com/@minevote', true)
ON CONFLICT DO NOTHING;

-- Test auth attempt kaydı
INSERT INTO auth_attempts (username, ip_address, user_agent, success, failure_reason) VALUES
  ('admin', '127.0.0.1', 'Mozilla/5.0 (Test Browser)', true, NULL),
  ('hacker', '192.168.1.100', 'Mozilla/5.0 (Suspicious Browser)', false, 'Invalid username'),
  ('admin', '192.168.1.101', 'Mozilla/5.0 (Test Browser)', false, 'Invalid password')
ON CONFLICT DO NOTHING;

-- Test audit log kaydı
INSERT INTO audit_logs (user_id, action, resource_type, ip_address, user_agent) VALUES
  ((SELECT id FROM admin_users WHERE username = 'admin' LIMIT 1), 'login', 'admin_session', '127.0.0.1', 'Mozilla/5.0 (Test Browser)'),
  ((SELECT id FROM admin_users WHERE username = 'admin' LIMIT 1), 'create', 'banner', '127.0.0.1', 'Mozilla/5.0 (Test Browser)'),
  ((SELECT id FROM admin_users WHERE username = 'admin' LIMIT 1), 'create', 'news', '127.0.0.1', 'Mozilla/5.0 (Test Browser)')
ON CONFLICT DO NOTHING;

-- Sonuçları kontrol et
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
FROM social_accounts
UNION ALL
SELECT 
  'Auth Attempts' as table_name,
  COUNT(*) as count
FROM auth_attempts
UNION ALL
SELECT 
  'Audit Logs' as table_name,
  COUNT(*) as count
FROM audit_logs;

-- Admin kullanıcılarını listele
SELECT 
  username,
  email,
  role,
  is_active,
  is_locked,
  failed_attempts,
  twofa_enabled,
  created_at
FROM admin_users
ORDER BY created_at;
