-- Check current servers table structure
-- Bu script'i Supabase SQL Editor'da çalıştırın

-- Mevcut servers tablosunun yapısını göster
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'servers' 
ORDER BY ordinal_position;

-- Mevcut RLS politikalarını göster
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'servers';

-- Mevcut index'leri göster
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'servers';

-- Mevcut trigger'ları göster
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'servers';
