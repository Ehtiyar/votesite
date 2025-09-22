-- Server Management Schema
-- Bu script'i Supabase SQL Editor'da çalıştırın

-- 1. Servers tablosunu güncelle (yeni alanlar ekle)
ALTER TABLE servers ADD COLUMN IF NOT EXISTS ip VARCHAR(45);
ALTER TABLE servers ADD COLUMN IF NOT EXISTS port INTEGER DEFAULT 25565;
ALTER TABLE servers ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE servers ADD COLUMN IF NOT EXISTS categories TEXT[] DEFAULT '{}';
ALTER TABLE servers ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;
ALTER TABLE servers ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive', 'suspended', 'featured'));
ALTER TABLE servers ADD COLUMN IF NOT EXISTS current_players INTEGER DEFAULT 0;
ALTER TABLE servers ADD COLUMN IF NOT EXISTS max_players INTEGER DEFAULT 0;
ALTER TABLE servers ADD COLUMN IF NOT EXISTS motd TEXT;
ALTER TABLE servers ADD COLUMN IF NOT EXISTS version TEXT;
ALTER TABLE servers ADD COLUMN IF NOT EXISTS icon_url TEXT;
ALTER TABLE servers ADD COLUMN IF NOT EXISTS last_ping_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE servers ADD COLUMN IF NOT EXISTS next_ping_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE servers ADD COLUMN IF NOT EXISTS ping_frequency INTEGER DEFAULT 60; -- seconds
ALTER TABLE servers ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
ALTER TABLE servers ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE servers ADD COLUMN IF NOT EXISTS featured_until TIMESTAMP WITH TIME ZONE;
ALTER TABLE servers ADD COLUMN IF NOT EXISTS published_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE servers ADD COLUMN IF NOT EXISTS unpublished_at TIMESTAMP WITH TIME ZONE;

-- 2. Server reports tablosu
CREATE TABLE IF NOT EXISTS server_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  server_id UUID REFERENCES servers(id) ON DELETE CASCADE,
  reporter_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed')),
  admin_notes TEXT,
  resolved_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Server votes tablosu (gelişmiş)
CREATE TABLE IF NOT EXISTS server_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  server_id UUID REFERENCES servers(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  ip_address INET,
  user_agent TEXT,
  reward_points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(server_id, user_id, DATE(created_at)) -- One vote per day per user per server
);

-- 4. Server ping history tablosu
CREATE TABLE IF NOT EXISTS server_ping_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  server_id UUID REFERENCES servers(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('online', 'offline', 'error')),
  current_players INTEGER DEFAULT 0,
  max_players INTEGER DEFAULT 0,
  ping_ms INTEGER,
  motd TEXT,
  version TEXT,
  error_message TEXT,
  pinged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Server categories tablosu
CREATE TABLE IF NOT EXISTS server_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  color TEXT DEFAULT '#7c3aed',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Server tags tablosu
CREATE TABLE IF NOT EXISTS server_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#6b7280',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Server boost packages tablosu (mevcut)
CREATE TABLE IF NOT EXISTS server_boost_packages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  duration_days INTEGER NOT NULL,
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Server boosts tablosu (aktif boost'lar)
CREATE TABLE IF NOT EXISTS server_boosts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  server_id UUID REFERENCES servers(id) ON DELETE CASCADE,
  package_id UUID REFERENCES server_boost_packages(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Server monitoring settings tablosu
CREATE TABLE IF NOT EXISTS server_monitoring_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  server_id UUID REFERENCES servers(id) ON DELETE CASCADE,
  ping_frequency INTEGER DEFAULT 60, -- seconds
  alert_on_offline BOOLEAN DEFAULT true,
  alert_on_high_ping BOOLEAN DEFAULT true,
  high_ping_threshold INTEGER DEFAULT 1000, -- ms
  alert_emails TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS'yi etkinleştir
ALTER TABLE server_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE server_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE server_ping_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE server_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE server_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE server_boosts ENABLE ROW LEVEL SECURITY;
ALTER TABLE server_monitoring_settings ENABLE ROW LEVEL SECURITY;

-- RLS Politikaları

-- Server reports için RLS politikaları
CREATE POLICY "Users can create server reports" ON server_reports
  FOR INSERT WITH CHECK (
    auth.uid() = reporter_id
  );

CREATE POLICY "Users can read their own reports" ON server_reports
  FOR SELECT USING (
    auth.uid() = reporter_id OR
    EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.id = auth.uid() 
      AND au.is_active = true
    )
  );

CREATE POLICY "Admin users can manage all reports" ON server_reports
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.id = auth.uid() 
      AND au.is_active = true
    )
  );

-- Server votes için RLS politikaları
CREATE POLICY "Users can create votes" ON server_votes
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
  );

CREATE POLICY "Users can read their own votes" ON server_votes
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.id = auth.uid() 
      AND au.is_active = true
    )
  );

-- Server ping history için RLS politikaları
CREATE POLICY "Admin users can read ping history" ON server_ping_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.id = auth.uid() 
      AND au.is_active = true
    )
  );

-- Server categories için RLS politikaları
CREATE POLICY "Everyone can read active categories" ON server_categories
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admin users can manage categories" ON server_categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.id = auth.uid() 
      AND au.is_active = true
    )
  );

-- Server tags için RLS politikaları
CREATE POLICY "Everyone can read active tags" ON server_tags
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admin users can manage tags" ON server_tags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.id = auth.uid() 
      AND au.is_active = true
    )
  );

-- Server boosts için RLS politikaları
CREATE POLICY "Users can read their own boosts" ON server_boosts
  FOR SELECT USING (
    auth.uid() = owner_id OR
    EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.id = auth.uid() 
      AND au.is_active = true
    )
  );

CREATE POLICY "Users can create boosts" ON server_boosts
  FOR INSERT WITH CHECK (
    auth.uid() = owner_id
  );

-- Server monitoring settings için RLS politikaları
CREATE POLICY "Server owners can manage their monitoring settings" ON server_monitoring_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM servers s 
      WHERE s.id = server_monitoring_settings.server_id 
      AND s.owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.id = auth.uid() 
      AND au.is_active = true
    )
  );

-- Trigger'ları oluştur
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Updated_at trigger'ları
CREATE TRIGGER update_server_reports_updated_at BEFORE UPDATE ON server_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_server_categories_updated_at BEFORE UPDATE ON server_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_server_tags_updated_at BEFORE UPDATE ON server_tags
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_server_boost_packages_updated_at BEFORE UPDATE ON server_boost_packages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_server_monitoring_settings_updated_at BEFORE UPDATE ON server_monitoring_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Index'leri oluştur
CREATE INDEX IF NOT EXISTS idx_servers_owner_id ON servers(owner_id);
CREATE INDEX IF NOT EXISTS idx_servers_status ON servers(status);
CREATE INDEX IF NOT EXISTS idx_servers_is_featured ON servers(is_featured);
CREATE INDEX IF NOT EXISTS idx_servers_is_verified ON servers(is_verified);
CREATE INDEX IF NOT EXISTS idx_servers_next_ping_at ON servers(next_ping_at);
CREATE INDEX IF NOT EXISTS idx_servers_categories ON servers USING GIN(categories);
CREATE INDEX IF NOT EXISTS idx_servers_tags ON servers USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_server_reports_server_id ON server_reports(server_id);
CREATE INDEX IF NOT EXISTS idx_server_reports_reporter_id ON server_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_server_reports_status ON server_reports(status);
CREATE INDEX IF NOT EXISTS idx_server_reports_created_at ON server_reports(created_at);

CREATE INDEX IF NOT EXISTS idx_server_votes_server_id ON server_votes(server_id);
CREATE INDEX IF NOT EXISTS idx_server_votes_user_id ON server_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_server_votes_created_at ON server_votes(created_at);
CREATE INDEX IF NOT EXISTS idx_server_votes_ip_address ON server_votes(ip_address);

CREATE INDEX IF NOT EXISTS idx_server_ping_history_server_id ON server_ping_history(server_id);
CREATE INDEX IF NOT EXISTS idx_server_ping_history_pinged_at ON server_ping_history(pinged_at);
CREATE INDEX IF NOT EXISTS idx_server_ping_history_status ON server_ping_history(status);

CREATE INDEX IF NOT EXISTS idx_server_boosts_server_id ON server_boosts(server_id);
CREATE INDEX IF NOT EXISTS idx_server_boosts_owner_id ON server_boosts(owner_id);
CREATE INDEX IF NOT EXISTS idx_server_boosts_end_date ON server_boosts(end_date);
CREATE INDEX IF NOT EXISTS idx_server_boosts_is_active ON server_boosts(is_active);

-- Varsayılan server kategorileri
INSERT INTO server_categories (name, slug, description, icon, color, sort_order) VALUES
  ('Survival', 'survival', 'Klasik survival oyunu', '🌲', '#10b981', 1),
  ('Creative', 'creative', 'Yaratıcılık odaklı oyun', '🎨', '#8b5cf6', 2),
  ('PvP', 'pvp', 'Oyuncu vs Oyuncu savaş', '⚔️', '#ef4444', 3),
  ('SkyBlock', 'skyblock', 'Gökyüzünde hayatta kalma', '☁️', '#06b6d4', 4),
  ('Factions', 'factions', 'Faction tabanlı oyun', '🏰', '#f59e0b', 5),
  ('Prison', 'prison', 'Hapishane temalı oyun', '🔒', '#6b7280', 6),
  ('Minigames', 'minigames', 'Mini oyunlar', '🎮', '#ec4899', 7),
  ('Roleplay', 'roleplay', 'Rol yapma oyunu', '🎭', '#84cc16', 8),
  ('Anarchy', 'anarchy', 'Kuralsız oyun', '💀', '#dc2626', 9),
  ('Hardcore', 'hardcore', 'Zorlu oyun modu', '💀', '#7c2d12', 10)
ON CONFLICT (slug) DO NOTHING;

-- Varsayılan server etiketleri
INSERT INTO server_tags (name, slug, color) VALUES
  ('Vanilla', 'vanilla', '#fbbf24'),
  ('Modded', 'modded', '#8b5cf6'),
  ('Cracked', 'cracked', '#ef4444'),
  ('Premium', 'premium', '#10b981'),
  ('New', 'new', '#06b6d4'),
  ('Popular', 'popular', '#ec4899'),
  ('Staff', 'staff', '#f59e0b'),
  ('Community', 'community', '#84cc16'),
  ('Competitive', 'competitive', '#dc2626'),
  ('Casual', 'casual', '#6b7280')
ON CONFLICT (slug) DO NOTHING;

-- Varsayılan boost paketleri
INSERT INTO server_boost_packages (name, description, price, duration_days, features) VALUES
  ('Basic Boost', 'Temel sunucu boost paketi', 9.99, 7, '["featured_listing", "priority_support"]'::jsonb),
  ('Premium Boost', 'Premium sunucu boost paketi', 19.99, 14, '["featured_listing", "priority_support", "custom_banner", "analytics"]'::jsonb),
  ('Ultimate Boost', 'Ultimate sunucu boost paketi', 39.99, 30, '["featured_listing", "priority_support", "custom_banner", "analytics", "custom_domain", "api_access"]'::jsonb)
ON CONFLICT DO NOTHING;

-- Başarı mesajı
SELECT 'Server management schema has been created successfully!' as message;
