# Bakım Eğitimleri - Web Uygulaması (PWA)

Bu, aynı 34 eğitim / 5 kategori / Must-Basic filtre sistemini **link üzerinden
erişilebilir, çevrimdışı çalışabilen** bir web uygulaması (Progressive Web App)
olarak sunar. Kurulum gerektirmez — link'e giren kişi "Ana Ekrana Ekle" derse
telefonunda gerçek bir uygulama gibi görünür.

## Nasıl çalışır
- Tüm PDF'ler ve veri (`trainings.json`) uygulama içinde, cihaza önbelleğe alınır
- İlk açılışta internet gerekir (dosyalar indirilsin diye), sonrasında **tamamen çevrimdışı çalışır**
- Sağ üstte kırmızı "Çevrimdışı" etiketi, internet olmadığını gösterir (uygulama yine de çalışmaya devam eder)
- Aynı Must/Basic rozetleri ve filtre çipleri mevcut

---

## 1. Barındırma (hosting) — ücretsiz seçenek: GitHub Pages

1. GitHub'da yeni bir repo oluşturun (örn. `bakim-egitimleri`)
2. Bu klasördeki (`CimentoWebApp`) TÜM dosyaları o repoya yükleyin
3. Repo ayarlarında **Settings > Pages** bölümüne gidin
4. "Branch" olarak `main` (veya `master`) seçip **Save** deyin
5. Birkaç dakika sonra şu formatta bir link verecek:
   `https://kullaniciadiniz.github.io/bakim-egitimleri/`
6. Bu link, çalışanlarınızla paylaşacağınız linktir

### Alternatif barındırma seçenekleri
- **Netlify / Vercel**: Klasörü sürükle-bırak ile yükleyip anında link alabilirsiniz (netlify.com/drop)
- **Şirket intranet sunucunuz**: Klasörü herhangi bir web sunucusuna (IIS, Nginx, Apache) kopyalamanız yeterli — statik dosyalardan oluşur, özel bir sunucu gerekmez

## 2. QR kod oluşturma

Barındırma linkiniz elinize geçtiğinde (örn. `https://firma.github.io/bakim-egitimleri/`)
bu linki bana gönderin, o linke ait **QR kodu hemen oluşturup** size görsel
olarak veririm. Poster/duyuru panosuna basıp asabilirsiniz.

## 3. İçerik güncelleme (Android uygulamasıyla birebir aynı mantık)

- Yeni PDF: `pdfs/` klasörüne dosyayı koyun
- `data/trainings.json` içine ilgili kategori altına yeni kayıt ekleyin:

```json
{
  "id": "benzersiz_id",
  "title": "Eğitimin Görünen Adı",
  "description": "",
  "level": "MUST",
  "pdfFileName": "dosya_adi.pdf"
}
```

- Değişikliği GitHub'a tekrar yükleyin (veya sunucudaki dosyaları güncelleyin), birkaç dakika içinde yayına yansır

⚠️ Kod tarafında hiçbir değişiklik gerekmez — Android APK projesiyle aynı `trainings.json` formatını kullanır.

## 4. Test etme (yayınlamadan önce, bilgisayarınızda)

Terminal / komut satırında bu klasöre girip:

```
python3 -m http.server 8000
```

sonra tarayıcıda `http://localhost:8000` adresini açarak deneyebilirsiniz.
(Not: Service worker / çevrimdışı özellik `file://` ile açıldığında çalışmaz,
mutlaka bir sunucudan — localhost ya da barındırma linki — açılması gerekir.)

## 5. Dosya yapısı

```
CimentoWebApp/
├── index.html          ← Ana sayfa
├── manifest.json       ← "Ana ekrana ekle" için uygulama tanımı
├── service-worker.js   ← Çevrimdışı önbellekleme mantığı
├── css/style.css
├── js/app.js            ← Tüm ekran/gezinme mantığı
├── data/trainings.json ← Kategori/eğitim/PDF eşlemesi (içerik burada yönetilir)
├── pdfs/                ← Tüm PDF dosyaları
└── icons/               ← Uygulama ikonları
```
