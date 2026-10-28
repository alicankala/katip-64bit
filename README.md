# Kâtip — Oto Servis Takip Sistemi (64-bit Windows)

**Güncel Sürüm: 1.9.0** · Platform: **Windows x64** · Mimari: **Electron + Vue 3 + SQLite**

**Kâtip**, oto servislerinin araç kabulünden iş emrine, yedek parça ve stok takibinden cari hesaplara, kasa ve kâr raporundan yerel ağ üzerinden mobil telefon entegrasyonuna kadar tüm günlük operasyonlarını tek bir masaüstü uygulamasından yönetmesi için geliştirilmiş kapsamlı servis takip sistemidir.

Tüm veriler yerel SQLite veritabanında saklanır; internet kesintilerinden etkilenmez, güvenli yerel mimariyle çalışır.

---

## Öne Çıkan Özellikler

### 🚗 Araç Kabul & İş Emri Yönetimi
- **Hızlı Servis Kabul:** Plaka, müşteri adı ve telefon ile anlık arama ve araç kabul kaydı.
- **Detaylı İş Emri Takibi:** İş emri durumları (Bekliyor, İşlemde, Parça Bekliyor, Tamamlandı, Teslim Edildi), işçilik ve kullanılan parça kalemleri.
- **Finansal Koruma:** İş emri toplamı, yapılmış olan aktif tahsilatların altına düşürülemez.
- **Servis Geçmişi:** Araçların önceki tüm servis, işlem ve kilometre geçmişi tek ekranda.

### 📦 Parça ve Stok Takibi
- Barkod / kod bazlı yedek parça ve malzeme kartları.
- Kritik stok uyarıları ve asgari stok seviyesi takibi.
- Parça maliyetleri, satış fiyatları ve kâr marjı hesaplamaları.
- İş emirleriyle tam entegre, transaction korumalı stok düşümü.

### 💰 Cari Hesap, Kasa & Finans
- **Müşteri Alacakları:** Veresiye / vadeli iş emirleri ve parça ödemelerinin müşteri bazlı takibi.
- **Tedarikçi Borçları:** Parça tedarikçilerinin cari hesapları ve borç takibi.
- **İşletme Giderleri:** Kira, fatura, personel ve genel işletme masraflarının kaydı.
- **Gün Sonu Kasa Özeti:** Nakit, kredi kartı ve havale/EFT tahsilat dökümü; kapalı günlerin mali hareketlerini koruyan kilit mekanizması.
- **Kâr Raporları:** İş emri bazlı anlık net kâr hesabı ve dönemsel işletme kâr/zarar analizi.

### 📱 Yerel Ağ (LAN) Telefon Sunucusu & Mobil Fotoğraf Aktarımı
- Servis içerisindeki telefonlardan masaüstü uygulamasına **QR kod** veya **PIN** ile hızlı eşleşme.
- Araç kabul fotoğraflarını ve hasar görsellerini cep telefonundan anında iş emrine ekleme.
- Streaming dosya transferi, Bearer oturum doğrulaması ve yerel ağ hızında güvenli iletişim.

### 🖨️ Servis Fişi & Yazdırma
- Müşteriye teslim edilecek servis kabul ve işlem fişlerinin doğrudan ekranda önizlenmesi ve güvenli yazdırılması.

### 🛡️ Güvenli Otomatik Güncelleme & Yedekleme
- **Kesintisiz Güncelleme:** GitHub Releases üzerinden otomatik sürüm denetimi ve arayüzde canlı indirme/kurulum ilerleme göstergesi.
- **Pre-Update Güvenlik Kalkanı:** Güncelleme kurulmadan önce SQLite veritabanı ve fotoğrafları kapsayan tam otomatik ZIP yedeği (`tar.exe`) alınır; hata durumunda sıfır veri kaybı garantilenir.
- **Yedekleme & Geri Yükleme:** İstendiğinde tek tıkla tam sistem yedeği oluşturma ve doğrulamalı geri yükleme (restore).

---

## Teknoloji Yığını

- **Masaüstü:** [Electron](https://www.electronjs.org/) (x64)
- **Arayüz:** [Vue 3](https://vuejs.org/) (Composition API, `<script setup>`) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vitejs.dev/)
- **Bileşen Kütüphanesi:** [PrimeVue](https://primevue.org/) & PrimeIcons
- **Veritabanı:** [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) (Yerel ACID uyumlu SQLite motoru)
- **Güncelleyici & Paketleyici:** [electron-updater](https://www.electron.build/auto-update) & [electron-builder](https://www.electron.build/) (NSIS)
- **Mobil Köprü:** Node.js HTTP Server, QR Code (`qrcode`)

---

## Geliştirme ve Test

```bash
# Bağımlılıkları yükleme
npm install

# Geliştirme ortamını başlatma (Vite + Electron)
npm run dev

# Tip denetimi
npx vue-tsc --noEmit

# Test süiti
npm run test:unit           # Birim testleri
npm run test:integration    # Entegrasyon testleri
npm run test:business       # İş mantığı ve kural testleri
npm run test:stage4         # Stage-4 telefon API ve restore testleri
npm run test:smoke          # Smoke ve Electron çalıştırma testleri

# Mimari senkronizasyon ve release sözleşmesi kontrolleri
npm run check:sync
npm run check:release-contract

# Üretim derlemesi (Installer çıktısı: release/ altındadır)
npm run build
```

---

## 32-bit ve Windows 7 Sürümü

Eski donanımlar ve Windows 7/8 sistemleri için optimize edilmiş x86 sürümüne [alicankala/katip-32bit](https://github.com/alicankala/katip-32bit) deposundan ulaşabilirsiniz.

---

Developed by Alican Kala
