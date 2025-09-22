-- Fix servers table - Add missing columns if they don't exist
-- Bu script'i Supabase SQL Editor'da çalıştırın

-- Önce mevcut servers tablosunun yapısını kontrol et
-- Eğer owner_id sütunu yoksa ekle
DO $$ 
BEGIN
    -- owner_id sütunu yoksa ekle
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'servers' AND column_name = 'owner_id'
    ) THEN
        ALTER TABLE servers ADD COLUMN owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;

    -- vote_count sütunu yoksa ekle
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'servers' AND column_name = 'vote_count'
    ) THEN
        ALTER TABLE servers ADD COLUMN vote_count INTEGER DEFAULT 0;
    END IF;

    -- member_count sütunu yoksa ekle
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'servers' AND column_name = 'member_count'
    ) THEN
        ALTER TABLE servers ADD COLUMN member_count INTEGER DEFAULT 0;
    END IF;

    -- uptime sütunu yoksa ekle
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'servers' AND column_name = 'uptime'
    ) THEN
        ALTER TABLE servers ADD COLUMN uptime INTEGER DEFAULT 99;
    END IF;

    -- country sütunu yoksa ekle
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'servers' AND column_name = 'country'
    ) THEN
        ALTER TABLE servers ADD COLUMN country TEXT DEFAULT 'Turkey';
    END IF;

    -- detailed_description sütunu yoksa ekle
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'servers' AND column_name = 'detailed_description'
    ) THEN
        ALTER TABLE servers ADD COLUMN detailed_description TEXT;
    END IF;

    -- banner_url sütunu yoksa ekle
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'servers' AND column_name = 'banner_url'
    ) THEN
        ALTER TABLE servers ADD COLUMN banner_url TEXT;
    END IF;

    -- discord_link sütunu yoksa ekle
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'servers' AND column_name = 'discord_link'
    ) THEN
        ALTER TABLE servers ADD COLUMN discord_link TEXT;
    END IF;

    -- website_link sütunu yoksa ekle
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'servers' AND column_name = 'website_link'
    ) THEN
        ALTER TABLE servers ADD COLUMN website_link TEXT;
    END IF;

    -- gamemodes sütunu yoksa ekle
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'servers' AND column_name = 'gamemodes'
    ) THEN
        ALTER TABLE servers ADD COLUMN gamemodes TEXT[];
    END IF;

    -- supported_versions sütunu yoksa ekle
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'servers' AND column_name = 'supported_versions'
    ) THEN
        ALTER TABLE servers ADD COLUMN supported_versions TEXT[];
    END IF;

    -- votifier_key sütunu yoksa ekle
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'servers' AND column_name = 'votifier_key'
    ) THEN
        ALTER TABLE servers ADD COLUMN votifier_key TEXT;
    END IF;

    -- votifier_port sütunu yoksa ekle
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'servers' AND column_name = 'votifier_port'
    ) THEN
        ALTER TABLE servers ADD COLUMN votifier_port INTEGER DEFAULT 8192;
    END IF;

    -- ip_address sütunu yoksa ekle (invite_link yerine)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'servers' AND column_name = 'ip_address'
    ) THEN
        ALTER TABLE servers ADD COLUMN ip_address TEXT;
        -- Mevcut invite_link değerlerini ip_address'e kopyala
        UPDATE servers SET ip_address = invite_link WHERE ip_address IS NULL;
    END IF;

    -- server_port sütunu yoksa ekle
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'servers' AND column_name = 'server_port'
    ) THEN
        ALTER TABLE servers ADD COLUMN server_port INTEGER DEFAULT 25565;
    END IF;

    -- game_version sütunu yoksa ekle
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'servers' AND column_name = 'game_version'
    ) THEN
        ALTER TABLE servers ADD COLUMN game_version TEXT DEFAULT '1.20.1';
    END IF;

    -- category sütunu yoksa ekle
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'servers' AND column_name = 'category'
    ) THEN
        ALTER TABLE servers ADD COLUMN category TEXT DEFAULT 'Survival';
    END IF;

    -- created_at sütunu yoksa ekle
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'servers' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE servers ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;

    -- updated_at sütunu yoksa ekle
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'servers' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE servers ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- RLS'yi etkinleştir (eğer etkin değilse)
ALTER TABLE servers ENABLE ROW LEVEL SECURITY;

-- RLS politikalarını yeniden oluştur (eğer yoksa)
DO $$
BEGIN
    -- Mevcut politikaları sil
    DROP POLICY IF EXISTS "Anyone can read servers" ON servers;
    DROP POLICY IF EXISTS "Authenticated users can insert servers" ON servers;
    DROP POLICY IF EXISTS "Users can update their own servers" ON servers;
    DROP POLICY IF EXISTS "Users can delete their own servers" ON servers;

    -- Yeni politikaları oluştur
    CREATE POLICY "Anyone can read servers" ON servers
        FOR SELECT USING (true);

    CREATE POLICY "Authenticated users can insert servers" ON servers
        FOR INSERT WITH CHECK (auth.role() = 'authenticated');

    CREATE POLICY "Users can update their own servers" ON servers
        FOR UPDATE USING (auth.uid() = owner_id);

    CREATE POLICY "Users can delete their own servers" ON servers
        FOR DELETE USING (auth.uid() = owner_id);
END $$;

-- Trigger'ı yeniden oluştur
DROP TRIGGER IF EXISTS update_servers_updated_at ON servers;
CREATE TRIGGER update_servers_updated_at BEFORE UPDATE ON servers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Index'leri ekle
CREATE INDEX IF NOT EXISTS idx_servers_owner_id ON servers(owner_id);
CREATE INDEX IF NOT EXISTS idx_servers_category ON servers(category);
CREATE INDEX IF NOT EXISTS idx_servers_member_count ON servers(member_count DESC);
CREATE INDEX IF NOT EXISTS idx_servers_created_at ON servers(created_at DESC);

-- Başarı mesajı
SELECT 'Servers table has been updated successfully!' as message;
