-- Supabase Database Schema for MineVote Platform
-- Bu script'i Supabase SQL Editor'da çalıştırın

-- 1. News Articles Table
CREATE TABLE IF NOT EXISTS news_articles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  author TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Banner Ads Table
CREATE TABLE IF NOT EXISTS banner_ads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  link_url TEXT,
  position TEXT NOT NULL DEFAULT 'top-left',
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. User Profiles Table (if not exists)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  minecraft_nick TEXT,
  discord_username TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Servers Table (update existing)
ALTER TABLE servers ADD COLUMN IF NOT EXISTS detailed_description TEXT;
ALTER TABLE servers ADD COLUMN IF NOT EXISTS banner_url TEXT;
ALTER TABLE servers ADD COLUMN IF NOT EXISTS discord_link TEXT;
ALTER TABLE servers ADD COLUMN IF NOT EXISTS website_link TEXT;
ALTER TABLE servers ADD COLUMN IF NOT EXISTS gamemodes TEXT[];
ALTER TABLE servers ADD COLUMN IF NOT EXISTS supported_versions TEXT[];
ALTER TABLE servers ADD COLUMN IF NOT EXISTS uptime INTEGER DEFAULT 99;
ALTER TABLE servers ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Turkey';

-- 5. User Favorites Table
CREATE TABLE IF NOT EXISTS user_favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  server_id UUID REFERENCES servers(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, server_id)
);

-- 6. Payment Transactions Table
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'TRY',
  payment_method TEXT NOT NULL,
  transaction_id TEXT UNIQUE,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. User Balance Table
CREATE TABLE IF NOT EXISTS user_balance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  balance DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE news_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE banner_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_balance ENABLE ROW LEVEL SECURITY;

-- News Articles Policies
CREATE POLICY "Anyone can read news articles" ON news_articles
  FOR SELECT USING (true);

CREATE POLICY "Only authenticated users can insert news" ON news_articles
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Only authenticated users can update news" ON news_articles
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Banner Ads Policies
CREATE POLICY "Anyone can read active banner ads" ON banner_ads
  FOR SELECT USING (is_active = true);

CREATE POLICY "Only authenticated users can manage banner ads" ON banner_ads
  FOR ALL USING (auth.role() = 'authenticated');

-- Profiles Policies
CREATE POLICY "Users can view all profiles" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- User Favorites Policies
CREATE POLICY "Users can manage their own favorites" ON user_favorites
  FOR ALL USING (auth.uid() = user_id);

-- Payment Transactions Policies
CREATE POLICY "Users can view their own transactions" ON payment_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions" ON payment_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User Balance Policies
CREATE POLICY "Users can view their own balance" ON user_balance
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own balance" ON user_balance
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own balance" ON user_balance
  FOR UPDATE USING (auth.uid() = user_id);

-- 9. Functions and Triggers

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_news_articles_updated_at BEFORE UPDATE ON news_articles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_banner_ads_updated_at BEFORE UPDATE ON banner_ads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_transactions_updated_at BEFORE UPDATE ON payment_transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_balance_updated_at BEFORE UPDATE ON user_balance
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'username', NEW.email);
  
  INSERT INTO public.user_balance (user_id, balance)
  VALUES (NEW.id, 0.00);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 10. Sample Data

-- Insert sample news articles
INSERT INTO news_articles (title, content, excerpt, author, category, image_url) VALUES
('Minecraft 1.21 Güncellemesi Geldi!', 'Minecraft''ın en yeni güncellemesi olan 1.21 sürümü resmi olarak yayınlandı. Bu güncelleme ile birlikte...', 'Minecraft 1.21 güncellemesi ile yeni özellikler ve iyileştirmeler geldi.', 'Admin', 'updates', 'https://via.placeholder.com/400x200'),
('En Popüler Minecraft Sunucuları', 'Bu ay en çok oy alan Minecraft sunucularını sizler için derledik...', 'En popüler Minecraft sunucularını keşfedin.', 'Admin', 'servers', 'https://via.placeholder.com/400x200'),
('Minecraft Topluluğu Etkinlikleri', 'Bu ay düzenlenecek Minecraft topluluk etkinlikleri hakkında bilgiler...', 'Minecraft topluluğu etkinliklerini takip edin.', 'Admin', 'events', 'https://via.placeholder.com/400x200');

-- Insert sample banner ads
INSERT INTO banner_ads (title, description, image_url, link_url, position, is_active) VALUES
('KALİTENİN ADRESİ', 'En kaliteli Minecraft sunucuları', 'https://via.placeholder.com/728x90/DC2626/FFFFFF', 'https://oyna.colombus.com.tr', 'top-left', true),
('TRPLUGIN', 'Plugin al/sat platformu', 'https://via.placeholder.com/728x90/1F2937/10B981', 'https://trplugin.com', 'top-right', true),
('MACESTIER', '1.16.5-1.20.6 TOWNY sunucusu', 'https://via.placeholder.com/728x90/EA580C/FFFFFF', 'https://macestier.com', 'middle-left', true);

-- 11. Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_news_articles_category ON news_articles(category);
CREATE INDEX IF NOT EXISTS idx_news_articles_created_at ON news_articles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_banner_ads_position ON banner_ads(position);
CREATE INDEX IF NOT EXISTS idx_banner_ads_active ON banner_ads(is_active);
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_server_id ON user_favorites(server_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
