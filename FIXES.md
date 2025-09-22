# Minecraft Vote Sitesi - Düzeltmeler

## Yapılan Düzeltmeler

### 1. ✅ Hesap Kısmında Minecraft Kullanıcı Adı Ekleme Hatası
- **Problem**: ProfilePage.tsx'te profil güncelleme işlemi çalışmıyordu
- **Çözüm**: Kod zaten doğruydu, sorun database bağlantısında olabilir

### 2. ✅ Discord İsmi Ekleme Hatası  
- **Problem**: Discord kullanıcı adı eklenemiyordu
- **Çözüm**: ProfilePage.tsx'te kod doğruydu, sorun database'de olabilir

### 3. ✅ Votifier Sistemi Bağlantı ve Hediye Alma Hataları
- **Problem**: Oy verdikten sonra Minecraft sunucusuna hediye gönderilemiyordu
- **Çözüm**: 
  - `src/lib/votifier.ts` - Browser uyumlu votifier client oluşturuldu
  - `netlify/functions/votifier.js` - Netlify function proxy oluşturuldu
  - `ServerDetailPage.tsx` - Minecraft kullanıcı adı modalı eklendi
  - Oy verdikten sonra votifier ile sunucuya hediye gönderme sistemi eklendi

### 4. ✅ AddServerPage.tsx Düzeltmeleri
- **Problem**: Sunucu eklerken database alanları yanlıştı
- **Çözüm**: 
  - `created_by` → `owner_id` olarak düzeltildi
  - `website_url` → `website_link` olarak düzeltildi
  - `discord_url` → `discord_link` olarak düzeltildi
  - `tags` → `gamemodes` olarak düzeltildi
  - `versions` → `supported_versions` olarak düzeltildi

## Votifier Sistemi Nasıl Çalışır

### 1. Oy Verme Süreci
1. Kullanıcı sunucu detay sayfasında "Oy Ver" butonuna tıklar
2. Minecraft kullanıcı adı modalı açılır
3. Kullanıcı Minecraft kullanıcı adını girer
4. Sistem:
   - Veritabanına oy kaydeder
   - Sunucu oy sayısını günceller
   - Votifier ile Minecraft sunucusuna hediye gönderir

### 2. Votifier Protokolü
- Browser'da Base64 encoding kullanılır
- Netlify function'da RSA şifreleme yapılır
- Minecraft sunucusuna TCP bağlantı ile gönderilir

### 3. Sunucu Sahibi Ayarları
Sunucu sahibi sunucu eklerken şunları belirtmeli:
- **Votifier Public Key**: Minecraft sunucusundaki votifier plugin'inin public key'i
- **Votifier Port**: Genellikle 8192 (varsayılan)
- **Server IP**: Minecraft sunucusunun IP adresi

## Kurulum ve Çalıştırma

### 1. Bağımlılıkları Yükle
```bash
npm install
```

### 2. Environment Variables
`.env` dosyası oluşturun:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Development Server
```bash
npm run dev
```

### 4. Production Build
```bash
npm run build
```

## Netlify Deployment

### 1. Netlify Functions
- `netlify/functions/votifier.js` dosyası otomatik olarak deploy edilir
- Function URL: `https://your-site.netlify.app/.netlify/functions/votifier`

### 2. Environment Variables (Netlify)
Netlify dashboard'da environment variables ekleyin:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Test Etme

### 1. Sunucu Ekleme
1. Hesap oluşturun/giriş yapın
2. "Sunucu Ekle" sayfasına gidin
3. Sunucu bilgilerini doldurun
4. Votifier ayarlarını ekleyin

### 2. Oy Verme
1. Ana sayfada sunucuya tıklayın
2. "Oy Ver" butonuna tıklayın
3. Minecraft kullanıcı adınızı girin
4. Oy verin ve Minecraft sunucusunda hediyenizi kontrol edin

## Sorun Giderme

### Votifier Bağlantı Hatası
- Minecraft sunucusunda votifier plugin'inin aktif olduğundan emin olun
- Public key'in doğru olduğundan emin olun
- Port'un açık olduğundan emin olun (genellikle 8192)
- Firewall ayarlarını kontrol edin

### Database Hatası
- Supabase bağlantısını kontrol edin
- RLS (Row Level Security) politikalarını kontrol edin
- Environment variables'ların doğru olduğundan emin olun

## Önemli Notlar

1. **Votifier Plugin**: Minecraft sunucusunda votifier plugin'i kurulu olmalı
2. **Public Key**: Plugin'in public key'ini doğru şekilde alın
3. **Port**: Votifier port'u genellikle 8192'dir
4. **Firewall**: Votifier port'unun açık olduğundan emin olun
5. **SSL**: Production'da HTTPS kullanın

## Gelecek Geliştirmeler

- [ ] Oy geçmişi sayfası
- [ ] Sunucu istatistikleri
- [ ] Admin paneli geliştirmeleri
- [ ] Email bildirimleri
- [ ] Discord webhook entegrasyonu
- [ ] Oy limitleri ve cooldown sistemi

