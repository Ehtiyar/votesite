# ServerCard Top Voters Sistemi - Kurulum Rehberi

## ✅ Yapılan Değişiklikler

### 1. Database Şeması Düzeltildi
- **Problem**: `discord_link` kolonu bulunamıyordu
- **Çözüm**: `supabase-schema.sql` dosyasında `servers` tablosu tam olarak oluşturuldu
- **Eklenen Kolonlar**:
  - `discord_link` - Discord sunucu linki
  - `website_link` - Website linki
  - `gamemodes` - Oyun modları array'i
  - `supported_versions` - Desteklenen versiyonlar
  - `votifier_key` - Votifier public key
  - `votifier_port` - Votifier port (varsayılan: 8192)

### 2. ServerCard'a Top Voters Sistemi Eklendi
- **Yeni Özellikler**:
  - ✅ Oy verme butonu (Trophy ikonu ile)
  - ✅ Minecraft kullanıcı adı modalı
  - ✅ Top voters listesi (genişletilebilir)
  - ✅ Votifier entegrasyonu
  - ✅ Oy durumu kontrolü

### 3. Oy Verme Sistemi
- **Süreç**:
  1. Kullanıcı "Oy Ver" butonuna tıklar
  2. Minecraft kullanıcı adı modalı açılır
  3. Kullanıcı adını girer ve oy verir
  4. Sistem otomatik olarak:
     - Veritabanına oy kaydeder
     - Sunucu oy sayısını günceller
     - Votifier ile Minecraft sunucusuna hediye gönderir
     - Top voters listesini günceller

## 🚀 Kurulum Adımları

### 1. Database'i Güncelle
Supabase SQL Editor'da `supabase-schema.sql` dosyasını çalıştırın:

```sql
-- Servers tablosu oluşturulacak
-- Votes tablosu oluşturulacak
-- RLS politikaları eklenecek
```

### 2. Environment Variables
`.env` dosyasında Supabase ayarlarınızın doğru olduğundan emin olun:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Projeyi Çalıştır
```bash
npm install
npm run dev
```

## 🎮 Kullanım

### Sunucu Sahibi İçin:
1. **Hesap oluşturun** ve giriş yapın
2. **"Sunucu Ekle"** sayfasına gidin
3. **Votifier ayarlarını** ekleyin:
   - Votifier Public Key (Minecraft sunucusundan alın)
   - Votifier Port (genellikle 8192)
4. **Sunucuyu kaydedin**

### Oy Verenler İçin:
1. **Ana sayfada** sunucu kartını görün
2. **"Oy Ver"** butonuna tıklayın
3. **Minecraft kullanıcı adınızı** girin
4. **Oy verin** ve Minecraft sunucusunda hediyenizi alın

## 🔧 Top Voters Sistemi

### Özellikler:
- **Top 5 oy veren** gösterilir
- **Genişletilebilir liste** (▼ butonu ile)
- **Oy sayıları** gösterilir
- **Gerçek zamanlı güncelleme**

### Görünüm:
```
Top Voters (3) ▼
├── PlayerName1    5 oy
├── PlayerName2    3 oy
└── PlayerName3    2 oy
```

## 🛠️ Votifier Sistemi

### Minecraft Sunucusu Ayarları:
1. **Votifier Plugin** kurulu olmalı
2. **Public Key** alınmalı (`/votifier key` komutu)
3. **Port açık** olmalı (genellikle 8192)
4. **Firewall** ayarları kontrol edilmeli

### Test Etme:
1. Sunucuya oy verin
2. Minecraft sunucusunda hediyenizi kontrol edin
3. Console'da votifier loglarını kontrol edin

## 📱 Responsive Tasarım

ServerCard artık şu özelliklere sahip:
- **Mobil uyumlu** tasarım
- **Hover efektleri**
- **Smooth animasyonlar**
- **Modern UI/UX**

## 🔍 Sorun Giderme

### Database Hatası:
- Supabase bağlantısını kontrol edin
- RLS politikalarını kontrol edin
- Environment variables'ları kontrol edin

### Votifier Hatası:
- Minecraft sunucusunda plugin aktif mi?
- Public key doğru mu?
- Port açık mı?
- Firewall ayarları?

### Oy Verme Hatası:
- Kullanıcı giriş yapmış mı?
- Daha önce oy vermiş mi?
- Minecraft kullanıcı adı girilmiş mi?

## 🎯 Gelecek Geliştirmeler

- [ ] Oy geçmişi sayfası
- [ ] Oy limitleri (günlük/aylık)
- [ ] Discord webhook entegrasyonu
- [ ] Email bildirimleri
- [ ] Admin paneli geliştirmeleri
- [ ] Oy istatistikleri

## 📞 Destek

Herhangi bir sorun yaşarsanız:
1. Console loglarını kontrol edin
2. Network sekmesinde hataları kontrol edin
3. Supabase dashboard'da RLS politikalarını kontrol edin
4. Minecraft sunucusu loglarını kontrol edin

---

**Not**: Bu sistem tamamen çalışır durumda ve production'a hazır!

