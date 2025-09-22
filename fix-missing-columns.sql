-- Fix missing columns and tables
-- Bu script'i Supabase SQL Editor'da çalıştırın

-- 0. Önce update_updated_at_column fonksiyonunu oluştur
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 1. Servers tablosuna eksik sütunları ekle
DO $$ 
BEGIN
    -- discord_link sütunu yoksa ekle
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'servers' AND column_name = 'discord_link'
    ) THEN
        ALTER TABLE servers ADD COLUMN discord_link TEXT;
        RAISE NOTICE 'discord_link column added to servers table';
    END IF;

    -- website_link sütunu yoksa ekle
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'servers' AND column_name = 'website_link'
    ) THEN
        ALTER TABLE servers ADD COLUMN website_link TEXT;
        RAISE NOTICE 'website_link column added to servers table';
    END IF;

    -- banner_url sütunu yoksa ekle
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'servers' AND column_name = 'banner_url'
    ) THEN
        ALTER TABLE servers ADD COLUMN banner_url TEXT;
        RAISE NOTICE 'banner_url column added to servers table';
    END IF;

    -- detailed_description sütunu yoksa ekle
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'servers' AND column_name = 'detailed_description'
    ) THEN
        ALTER TABLE servers ADD COLUMN detailed_description TEXT;
        RAISE NOTICE 'detailed_description column added to servers table';
    END IF;

    -- gamemodes sütunu yoksa ekle
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'servers' AND column_name = 'gamemodes'
    ) THEN
        ALTER TABLE servers ADD COLUMN gamemodes TEXT[];
        RAISE NOTICE 'gamemodes column added to servers table';
    END IF;

    -- supported_versions sütunu yoksa ekle
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'servers' AND column_name = 'supported_versions'
    ) THEN
        ALTER TABLE servers ADD COLUMN supported_versions TEXT[];
        RAISE NOTICE 'supported_versions column added to servers table';
    END IF;

    -- votifier_key sütunu yoksa ekle
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'servers' AND column_name = 'votifier_key'
    ) THEN
        ALTER TABLE servers ADD COLUMN votifier_key TEXT;
        RAISE NOTICE 'votifier_key column added to servers table';
    END IF;

    -- votifier_port sütunu yoksa ekle
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'servers' AND column_name = 'votifier_port'
    ) THEN
        ALTER TABLE servers ADD COLUMN votifier_port INTEGER DEFAULT 8192;
        RAISE NOTICE 'votifier_port column added to servers table';
    END IF;

    -- ip_address sütunu yoksa ekle
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'servers' AND column_name = 'ip_address'
    ) THEN
        ALTER TABLE servers ADD COLUMN ip_address TEXT;
        -- Mevcut invite_link değerlerini ip_address'e kopyala
        UPDATE servers SET ip_address = invite_link WHERE ip_address IS NULL;
        RAISE NOTICE 'ip_address column added to servers table';
    END IF;

    -- server_port sütunu yoksa ekle
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'servers' AND column_name = 'server_port'
    ) THEN
        ALTER TABLE servers ADD COLUMN server_port INTEGER DEFAULT 25565;
        RAISE NOTICE 'server_port column added to servers table';
    END IF;

    -- game_version sütunu yoksa ekle
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'servers' AND column_name = 'game_version'
    ) THEN
        ALTER TABLE servers ADD COLUMN game_version TEXT DEFAULT '1.20.1';
        RAISE NOTICE 'game_version column added to servers table';
    END IF;

    -- category sütunu yoksa ekle
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'servers' AND column_name = 'category'
    ) THEN
        ALTER TABLE servers ADD COLUMN category TEXT DEFAULT 'Survival';
        RAISE NOTICE 'category column added to servers table';
    END IF;

    -- owner_id sütunu yoksa ekle
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'servers' AND column_name = 'owner_id'
    ) THEN
        ALTER TABLE servers ADD COLUMN owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        RAISE NOTICE 'owner_id column added to servers table';
    END IF;

    -- vote_count sütunu yoksa ekle
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'servers' AND column_name = 'vote_count'
    ) THEN
        ALTER TABLE servers ADD COLUMN vote_count INTEGER DEFAULT 0;
        RAISE NOTICE 'vote_count column added to servers table';
    END IF;

    -- member_count sütunu yoksa ekle
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'servers' AND column_name = 'member_count'
    ) THEN
        ALTER TABLE servers ADD COLUMN member_count INTEGER DEFAULT 0;
        RAISE NOTICE 'member_count column added to servers table';
    END IF;

    -- uptime sütunu yoksa ekle
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'servers' AND column_name = 'uptime'
    ) THEN
        ALTER TABLE servers ADD COLUMN uptime INTEGER DEFAULT 99;
        RAISE NOTICE 'uptime column added to servers table';
    END IF;

    -- country sütunu yoksa ekle
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'servers' AND column_name = 'country'
    ) THEN
        ALTER TABLE servers ADD COLUMN country TEXT DEFAULT 'Turkey';
        RAISE NOTICE 'country column added to servers table';
    END IF;

    -- created_at sütunu yoksa ekle
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'servers' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE servers ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'created_at column added to servers table';
    END IF;

    -- updated_at sütunu yoksa ekle
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'servers' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE servers ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'updated_at column added to servers table';
    END IF;
END $$;

-- 2. Server Reviews tablosunu oluştur (eğer yoksa)
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

-- 3. Server Reviews için RLS politikalarını oluştur
ALTER TABLE server_reviews ENABLE ROW LEVEL SECURITY;

-- Mevcut politikaları sil ve yeniden oluştur
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

-- 4. Server Reviews için trigger oluştur (eğer tablo varsa)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'server_reviews') THEN
        DROP TRIGGER IF EXISTS update_server_reviews_updated_at ON server_reviews;
        CREATE TRIGGER update_server_reviews_updated_at BEFORE UPDATE ON server_reviews
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Server reviews trigger created';
    END IF;
END $$;

-- 5. Servers tablosu için RLS politikalarını yeniden oluştur
ALTER TABLE servers ENABLE ROW LEVEL SECURITY;

-- Mevcut politikaları sil ve yeniden oluştur
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

-- 6. Servers tablosu için trigger oluştur (eğer tablo varsa)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'servers') THEN
        DROP TRIGGER IF EXISTS update_servers_updated_at ON servers;
        CREATE TRIGGER update_servers_updated_at BEFORE UPDATE ON servers
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Servers trigger created';
    END IF;
END $$;

-- 7. Index'leri oluştur (eğer sütunlar varsa)
DO $$
BEGIN
    -- Servers tablosu index'leri
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'servers') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'servers' AND column_name = 'owner_id') THEN
            CREATE INDEX IF NOT EXISTS idx_servers_owner_id ON servers(owner_id);
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'servers' AND column_name = 'category') THEN
            CREATE INDEX IF NOT EXISTS idx_servers_category ON servers(category);
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'servers' AND column_name = 'member_count') THEN
            CREATE INDEX IF NOT EXISTS idx_servers_member_count ON servers(member_count DESC);
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'servers' AND column_name = 'created_at') THEN
            CREATE INDEX IF NOT EXISTS idx_servers_created_at ON servers(created_at DESC);
        END IF;
        RAISE NOTICE 'Servers indexes created';
    END IF;

    -- Server reviews tablosu index'leri
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'server_reviews') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'server_reviews' AND column_name = 'server_id') THEN
            CREATE INDEX IF NOT EXISTS idx_server_reviews_server_id ON server_reviews(server_id);
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'server_reviews' AND column_name = 'user_id') THEN
            CREATE INDEX IF NOT EXISTS idx_server_reviews_user_id ON server_reviews(user_id);
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'server_reviews' AND column_name = 'created_at') THEN
            CREATE INDEX IF NOT EXISTS idx_server_reviews_created_at ON server_reviews(created_at DESC);
        END IF;
        RAISE NOTICE 'Server reviews indexes created';
    END IF;
END $$;

-- 8. Başarı mesajı
SELECT 'All missing columns and tables have been created successfully!' as message;
