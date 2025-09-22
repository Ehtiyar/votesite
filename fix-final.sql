-- Final fix script - Güvenli ve basit
-- Bu script'i Supabase SQL Editor'da çalıştırın

-- 1. update_updated_at_column fonksiyonunu oluştur
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 2. Servers tablosuna eksik sütunları ekle (güvenli şekilde)
DO $$
BEGIN
    -- discord_link sütunu
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'servers' AND column_name = 'discord_link') THEN
        ALTER TABLE servers ADD COLUMN discord_link TEXT;
        RAISE NOTICE 'discord_link column added';
    END IF;
    
    -- website_link sütunu
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'servers' AND column_name = 'website_link') THEN
        ALTER TABLE servers ADD COLUMN website_link TEXT;
        RAISE NOTICE 'website_link column added';
    END IF;
    
    -- banner_url sütunu
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'servers' AND column_name = 'banner_url') THEN
        ALTER TABLE servers ADD COLUMN banner_url TEXT;
        RAISE NOTICE 'banner_url column added';
    END IF;
    
    -- detailed_description sütunu
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'servers' AND column_name = 'detailed_description') THEN
        ALTER TABLE servers ADD COLUMN detailed_description TEXT;
        RAISE NOTICE 'detailed_description column added';
    END IF;
    
    -- gamemodes sütunu
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'servers' AND column_name = 'gamemodes') THEN
        ALTER TABLE servers ADD COLUMN gamemodes TEXT[];
        RAISE NOTICE 'gamemodes column added';
    END IF;
    
    -- supported_versions sütunu
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'servers' AND column_name = 'supported_versions') THEN
        ALTER TABLE servers ADD COLUMN supported_versions TEXT[];
        RAISE NOTICE 'supported_versions column added';
    END IF;
    
    -- votifier_key sütunu
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'servers' AND column_name = 'votifier_key') THEN
        ALTER TABLE servers ADD COLUMN votifier_key TEXT;
        RAISE NOTICE 'votifier_key column added';
    END IF;
    
    -- votifier_port sütunu
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'servers' AND column_name = 'votifier_port') THEN
        ALTER TABLE servers ADD COLUMN votifier_port INTEGER DEFAULT 8192;
        RAISE NOTICE 'votifier_port column added';
    END IF;
    
    -- ip_address sütunu
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'servers' AND column_name = 'ip_address') THEN
        ALTER TABLE servers ADD COLUMN ip_address TEXT;
        RAISE NOTICE 'ip_address column added';
    END IF;
    
    -- server_port sütunu
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'servers' AND column_name = 'server_port') THEN
        ALTER TABLE servers ADD COLUMN server_port INTEGER DEFAULT 25565;
        RAISE NOTICE 'server_port column added';
    END IF;
    
    -- game_version sütunu
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'servers' AND column_name = 'game_version') THEN
        ALTER TABLE servers ADD COLUMN game_version TEXT DEFAULT '1.20.1';
        RAISE NOTICE 'game_version column added';
    END IF;
    
    -- category sütunu
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'servers' AND column_name = 'category') THEN
        ALTER TABLE servers ADD COLUMN category TEXT DEFAULT 'Survival';
        RAISE NOTICE 'category column added';
    END IF;
    
    -- owner_id sütunu
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'servers' AND column_name = 'owner_id') THEN
        ALTER TABLE servers ADD COLUMN owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        RAISE NOTICE 'owner_id column added';
    END IF;
    
    -- vote_count sütunu
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'servers' AND column_name = 'vote_count') THEN
        ALTER TABLE servers ADD COLUMN vote_count INTEGER DEFAULT 0;
        RAISE NOTICE 'vote_count column added';
    END IF;
    
    -- member_count sütunu
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'servers' AND column_name = 'member_count') THEN
        ALTER TABLE servers ADD COLUMN member_count INTEGER DEFAULT 0;
        RAISE NOTICE 'member_count column added';
    END IF;
    
    -- uptime sütunu
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'servers' AND column_name = 'uptime') THEN
        ALTER TABLE servers ADD COLUMN uptime INTEGER DEFAULT 99;
        RAISE NOTICE 'uptime column added';
    END IF;
    
    -- country sütunu
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'servers' AND column_name = 'country') THEN
        ALTER TABLE servers ADD COLUMN country TEXT DEFAULT 'Turkey';
        RAISE NOTICE 'country column added';
    END IF;
    
    -- created_at sütunu
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'servers' AND column_name = 'created_at') THEN
        ALTER TABLE servers ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'created_at column added';
    END IF;
    
    -- updated_at sütunu
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'servers' AND column_name = 'updated_at') THEN
        ALTER TABLE servers ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'updated_at column added';
    END IF;
END $$;

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
