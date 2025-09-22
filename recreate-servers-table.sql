-- Recreate servers table with correct structure
-- Bu script'i Supabase SQL Editor'da çalıştırın

-- Önce mevcut servers tablosunu yedekle (eğer veri varsa)
-- CREATE TABLE servers_backup AS SELECT * FROM servers;

-- Mevcut servers tablosunu sil
DROP TABLE IF EXISTS servers CASCADE;

-- Servers tablosunu yeniden oluştur
CREATE TABLE servers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  invite_link TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  server_port INTEGER DEFAULT 25565,
  game_version TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Survival',
  detailed_description TEXT,
  banner_url TEXT,
  discord_link TEXT,
  website_link TEXT,
  gamemodes TEXT[],
  supported_versions TEXT[],
  votifier_key TEXT,
  votifier_port INTEGER DEFAULT 8192,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  vote_count INTEGER DEFAULT 0,
  member_count INTEGER DEFAULT 0,
  uptime INTEGER DEFAULT 99,
  country TEXT DEFAULT 'Turkey',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS'yi etkinleştir
ALTER TABLE servers ENABLE ROW LEVEL SECURITY;

-- RLS politikalarını oluştur
CREATE POLICY "Anyone can read servers" ON servers
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert servers" ON servers
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own servers" ON servers
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own servers" ON servers
  FOR DELETE USING (auth.uid() = owner_id);

-- Trigger'ı oluştur
CREATE TRIGGER update_servers_updated_at BEFORE UPDATE ON servers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Index'leri oluştur
CREATE INDEX idx_servers_owner_id ON servers(owner_id);
CREATE INDEX idx_servers_category ON servers(category);
CREATE INDEX idx_servers_member_count ON servers(member_count DESC);
CREATE INDEX idx_servers_created_at ON servers(created_at DESC);

-- Örnek veri ekle (test için)
INSERT INTO servers (
  name, 
  description, 
  invite_link, 
  ip_address, 
  game_version, 
  category,
  detailed_description,
  votifier_key
) VALUES 
(
  'Test Server 1',
  'Bu bir test sunucusudur',
  'test1.example.com:25565',
  'test1.example.com',
  '1.20.1',
  'Survival',
  'Bu sunucu test amaçlı oluşturulmuştur. Survival oyun modunda çalışmaktadır.',
  'test-key-1'
),
(
  'Test Server 2',
  'PvP test sunucusu',
  'test2.example.com:25565',
  'test2.example.com',
  '1.20.1',
  'PvP',
  'PvP odaklı test sunucusu. Arena savaşları ve takım savaşları mevcuttur.',
  'test-key-2'
);

-- Başarı mesajı
SELECT 'Servers table has been recreated successfully!' as message;
