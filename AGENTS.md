# Kâtip 64-bit çalışma rehberi

Bu repo Kâtip'in modern Windows / x64 sürümüdür.

Ana dal: `master`

## Temel mimari

- Electron
- Vue 3
- Vue Router
- PrimeVue
- TypeScript
- Vite
- SQLite / `better-sqlite3`
- NSIS x64
- ESM / `type: module`

Ana noktalar:

- `electron/main.ts`
- `electron/preload.ts`
- `electron/database.js`
- `electron/controllers/`
- `electron/phoneServer.ts`
- `electron/phoneAuthState.ts`
- `electron/phoneHttpUtils.ts`
- `electron/phoneMigrations.ts`
- `electron/phoneAssets.ts`
- `electron/permissions.ts`
- `electron/session.ts`
- `electron/security.ts`
- `electron/restoreState.ts`
- `electron/windowOpenPolicy.ts`
- `src/`
- `electron-builder.json5`

64-bit sürüm modern Electron/Node hattıdır.

Mevcut ESM yapısını koru.

Preload paket çıktısı `.mjs` hattındadır.

Modern Node/Electron özellikleri kullanılabilir ancak mevcut mimariyi sebepsiz değiştirme.

## Masaüstü ve telefon davranışı

Bazı Kâtip iş kuralları masaüstü controller'larında ve telefon API'sinde ayrı kod yollarında uygulanır.

Aşağıdaki değişikliklerde iki tarafı da kontrol et:

- müşteri
- araç
- iş emri
- stok
- tahsilat
- cari
- gider
- gün sonu
- fotoğraf
- yetki

Masaüstü tarafında renderer → preload → IPC/controller → SQLite zincirini dikkate al.

Telefon tarafında `phoneServer.ts` ve ilgili `phone*.ts` yardımcılarını kontrol et.

Mobil yardımcıların mevcut sorumluluklarını yeniden tek büyük dosyada toplama.

## Kritik iş kuralları

Aşağıdaki mevcut davranışları test geçirmek amacıyla değiştirme:

- iş emri toplamı aktif tahsilatların altına düşemez
- stok ve ödeme işlemleri transaction içinde korunur
- kapalı güne geriye dönük mali hareket eklenemez/değiştirilemez
- gün yeniden açılması yönetici onayı ve gerekçeyle loglanır
- restore sırasında işlemler bloke edilir
- destek/yönetici modu kritik mutasyonları sınırlar
- renderer localStorage değeri nihai yetki kanıtı değildir; ana süreç oturumu esastır

Gerçek business-rule belirsizliği veya çelişkisi bulursan kullanıcıya sor.

## Veri ve yedek güvenliği

Gerçek kullanıcı verileri Electron `userData` altındadır.

Başlıca:

- `otoservis.db`
- `fotograflar/`
- `yedekler/`

Kod reposu ile gerçek kullanıcı verisi aynı kapsam değildir.

Gerçek DB üzerinde test yapma.

Testlerde yalnız doğrulanmış geçici `userData` kullan.

Aktif DB'ye doğrudan müdahale gerekiyorsa önce:

- uygulamanın kapalı olduğunu
- doğru hedef yolu
- SQLite bütünlüğünü

doğrula.

Restore veya fabrika sıfırlama kullanıcı açıkça istemeden yapılmamalıdır.

Yedek DB ve fotoğrafları birlikte kapsamalıdır.

64-bit yedekleme mevcut Windows `tar.exe` tabanlı yolu kullanır.

Sırf iki repo aynı görünsün diye x86'daki `yazl/yauzl` streaming ZIP implementasyonuna dönüştürme.

## Güncelleme davranışı

Updater yalnız:

`alicankala/katip-64bit`

reposunu kullanmalıdır.

Installer adı:

`Katip-Windows-<version>-Setup.exe`

olmalıdır.

`autoInstallOnAppQuit=false` davranışını koru.

Güncelleme indirildikten sonra uygulamada `Şimdi Yeniden Başlat` aksiyonu görünür.

Kullanıcı bu aksiyonu seçtiğinde:

1. DB ve fotoğrafları kapsayan tam pre-update ZIP yedeği oluşturulur.
2. Yedek başarısızsa kurulum iptal edilir.
3. Yedek başarılıysa NSIS kurulumu Next/İleri sihirbazı göstermeden sessiz biçimde başlar.
4. Kurulum sonrası uygulama yeniden açılır.

Pre-update yedeğini atlama.

Normal çıkış yedeğini pre-update yedeği yerine kullanma.

## Tema ve UI

Yeni kurulumda veya kayıtlı tema bulunmadığında varsayılan tema açıktır.

Daha önce kaydedilmiş kullanıcı tema tercihini koru.

Arayüz kartları, açılır seçimler ve sekmeler gereksiz bekleme/açılış animasyonu kullanmamalıdır.

Alt durum çubuğundaki döviz/hava geçişi animasyonlu kalabilir.

Kullanıcı istemeden bu davranışları değiştirme.

## Telefon sunucusu

Telefon sunucusu LAN üzerinde HTTP ile çalışır; internetten açık genel sunucu gibi ele alma.

Mevcut güvenlikleri koru:

- PIN / QR giriş
- Bearer session
- rate-limit
- body-size limit
- fotoğraf path doğrulaması
- restore sırasında 503
- oturum zaman aşımı

Fotoğraf gönderimindeki streaming davranışını tüm dosyayı RAM'de Buffer'a alan modele dönüştürme.

## Yazdırma

Servis fişi değişikliklerinde birlikte kontrol et:

- ekrandaki önizleme
- gerçek print HTML/CSS
- güvenli `about:blank` yazdırma penceresi
- x86 ile davranış eşleşmesi

Renderer'ın diğer uzak `window.open` hedeflerini serbest bırakma.

## 32-bit ile ilişki

Ortak ürün özelliğinde `katip-32bit` tarafını da kontrol et.

Ancak şu altyapıları körlemesine eşitleme:

- Electron sürümü
- Node özellikleri
- ESM / CommonJS
- preload formatı
- native SQLite
- updater transport
- backup motoru
- x64 / ia32 paketleme
- Win7 performans ayarları

Ortak kritik dosyalarda gerektiğinde:

`npm run check:sync`

kullan.

## Doğrulama

Dar değişiklikte önce ilgili test ve type-check'i kullan.

Mevcut dependency ağacı uygunsa yalnız tip kontrolü için önce:

`npx vue-tsc --noEmit`

çalıştırılabilir.

İhtiyaca göre:

- `npm run test:unit`
- `npm run test:integration`
- `npm run test:business`
- `npm run test:stage4`
- `npm run test:smoke`
- `npm run check:sync`
- `npm run check:release-contract`

Paketleme gerekiyorsa:

`npm run build -- --publish never`

kullan.

Sırf inceleme için gereksiz `npm ci` çalıştırma.

DB, updater, backup, native modül, paketleme veya kritik iş kuralı değişikliğinde geniş doğrulama yap.

Kullanıcı açıkça release istemeden:

`scripts/yayinla.ps1`

çalıştırma.