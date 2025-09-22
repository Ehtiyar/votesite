-- Basit ve güvenli düzeltme script'i
-- Bu script'i Supabase SQL Editor'da çalıştırın

-- 1. update_updated_at_column fonksiyonunu oluştur
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 2. Servers tablosuna eksik sütunları ekle
ALTER TABLE servers ADD COLUMN IF NOT EXISTS discord_link TEXT;
ALTER TABLE servers ADD COLUMN IF NOT EXISTS website_link TEXT;
ALTER TABLE servers ADD COLUMN IF NOT EXISTS banner_url TEXT;
ALTER TABLE servers ADD COLUMN IF NOT EXISTS detailed_description TEXT;
ALTER TABLE servers ADD COLUMN IF NOT EXISTS gamemodes TEXT[];
ALTER TABLE servers ADD COLUMN IF NOT EXISTS supported_versions TEXT[];
ALTER TABLE servers ADD COLUMN IF NOT EXISTS votifier_key TEXT;
ALTER TABLE servers ADD COLUMN IF NOT EXISTS votifier_port INTEGER DEFAULT 8192;
ALTER TABLE servers ADD COLUMN IF NOT EXISTS ip_address TEXT;
ALTER TABLE servers ADD COLUMN IF NOT EXISTS server_port INTEGER DEFAULT 25565;
ALTER TABLE servers ADD COLUMN IF NOT EXISTS game_version TEXT DEFAULT '1.20.1';
ALTER TABLE servers ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Survival';
ALTER TABLE servers ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE servers ADD COLUMN IF NOT EXISTS vote_count INTEGER DEFAULT 0;
ALTER TABLE servers ADD COLUMN IF NOT EXISTS member_count INTEGER DEFAULT 0;
ALTER TABLE servers ADD COLUMN IF NOT EXISTS uptime INTEGER DEFAULT 99;
ALTER TABLE servers ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Turkey';
ALTER TABLE servers ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE servers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 3. Server Reviews tablosunu oluştur
CREATE TABLE IF NOT EXISTS server_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  server_id UUID REFERENCES servers(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, server_id)
);

-- 4. RLS'yi etkinleştir
ALTER TABLE servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE server_reviews ENABLE ROW LEVEL SECURITY;

-- 5. Servers için RLS politikaları
DROP POLICY IF EXISTS "Anyone can read servers" ON servers;
DROP POLICY IF EXISTS "Authenticated users can insert servers" ON servers;
DROP POLICY IF EXISTS "Users can update their own servers" ON servers;
DROP POLICY IF EXISTS "Users can delete their own servers" ON servers;

CREATE POLICY "Anyone can read servers" ON servers
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert servers" ON servers
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own servers" ON servers
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own servers" ON servers
  FOR DELETE USING (auth.uid() = owner_id);

-- 6. Server Reviews için RLS politikaları
DROP POLICY IF EXISTS "Anyone can read server reviews" ON server_reviews;
DROP POLICY IF EXISTS "Authenticated users can insert reviews" ON server_reviews;
DROP POLICY IF EXISTS "Users can update their own reviews" ON server_reviews;
DROP POLICY IF EXISTS "Users can delete their own reviews" ON server_reviews;

CREATE POLICY "Anyone can read server reviews" ON server_reviews
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert reviews" ON server_reviews
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own reviews" ON server_reviews
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews" ON server_reviews
  FOR DELETE USING (auth.uid() = user_id);

-- 7. Trigger'ları oluştur
DROP TRIGGER IF EXISTS update_servers_updated_at ON servers;
CREATE TRIGGER update_servers_updated_at BEFORE UPDATE ON servers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_server_reviews_updated_at ON server_reviews;
CREATE TRIGGER update_server_reviews_updated_at BEFORE UPDATE ON server_reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. Başarı mesajı
SELECT 'Database schema has been updated successfully!' as message;
