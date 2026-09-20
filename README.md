# DorkCraft

Kapsamlı arama sorguları oluşturmak, şablonları düzenlemek ve sorgu koleksiyonlarını yönetmek için tarayıcı tabanlı bir çalışma alanı. Saf HTML, CSS ve JavaScript kullanır; derleme, sunucu uygulaması veya API anahtarı gerektirmez. Orijinal koyu tema, yeşil/turuncu palet ve panel düzeni korunmuştur.

## Çalıştırma

Proje dizininde:

```bash
python3 -m http.server 8765 --bind 127.0.0.1
```

Tarayıcıda [http://localhost:8765](http://localhost:8765) adresini açın. Python yalnızca yerel dosyaları sunar. `index.html` doğrudan da açılabilir; ancak pano ve yerel depolama davranışı tarayıcıya göre değişebileceği için localhost önerilir.

## Özellikler

- **Builder:** Operatör ekleme/silme, etkinleştirme, hariç tutma, tam eşleşme, OR grupları, kelime dışlama ve tarih aralığı. Çok kelimeli değerler otomatik tırnaklanır; birebir aynı parçalar tekilleştirilir.
- **Custom:** Manuel sorgu düzenleme, anlık çıktı ve Builder sorgusunu aktarabilme. Her iki düzenleyici kendi içeriğini korur.
- **Kapsam:** Virgül veya boşlukla ayrılmış alan adları. Girilen HTTP/HTTPS adreslerinden alan adı alınır; birden fazla alan OR grubuna dönüştürülür.
- **Arama motorları:** Google, Bing ve DuckDuckGo için yeni sekmede arama veya arama bağlantısını kopyalama.
- **Sorgu denetimi:** Dengesiz tırnak/parantez, boş operatör, hatalı OR kullanımı, geçersiz/ters tarih aralığı, eski operatörler ve uzun sorgular için açıklama.
- **Şablonlar:** Ad, sorgu ve kategori üzerinden arama; kategori filtresi; kopyalama, düzenleme, arama ve kaydetme.
- **Kayıtlar:** Adlandırılmış yerel koleksiyon, sorguya göre tekrar önleme, arama, tekrar açma ve silme. En fazla 500 kayıt.
- **Geçmiş:** Son 50 farklı sorgu; geçmişi kapatma, temizleme ve koleksiyona kaydetme.
- **JSON aktarımı:** Koleksiyonu dışa aktarma ve mevcut kayıtlarla birleştirerek içe aktarma. Dosya bütünü doğrulanmadan koleksiyon değiştirilmez.
- **Kullanım:** Mobil düzen, klavye odağı, ekran okuyucu etiketleri, azaltılmış hareket tercihi ve pano erişimi olmadığında yedek kopyalama yöntemi.

## Kullanım örneği

1. Kapsam alanına `example.com, docs.example.com` yazın.
2. Builder'da `filetype:` operatörünü seçip `pdf` girin.
3. Tam eşleşmeye `annual report`, hariç tutulacak terimlere `draft, old version` yazın.
4. İsterseniz tarih aralığı ekleyin.
5. Çıktıyı inceleyin, adlandırıp kaydedin veya seçilen motorda arayın.

Örnek çıktı:

```text
(site:example.com OR site:docs.example.com) (filetype:pdf "annual report" -draft -"old version")
```

Kapsam, Builder ve Custom çıktılarına ve şablon eylemlerine uygulanır. Şablon kartında temel sorgu gösterilir; **düzenle** ile kapsam uygulanmış son çıktıyı görebilirsiniz. Kayıtlar ve geçmiş, arandıkları/kaydedildikleri tam sorguyu saklar. Bunları tekrar açmak kapsam alanını temizler; böylece aynı kapsam iki kez eklenmez. Mevcut sorgudaki `site:` ifadeleri otomatik kaldırılmaz; kapsamla çelişiyorsa elle düzenleyin.

**Temizle** yalnızca açık düzenleyiciyi sıfırlar. Kapsam, diğer düzenleyici ve koleksiyon korunur. Geçmişi kapatmak mevcut geçmişi silmez; bunun için **Geçmişi temizle** düğmesini kullanın.

Kısayollar Builder ve Custom sekmelerinde çalışır:

| Kısayol | İşlem |
| --- | --- |
| Ctrl / Cmd + Enter | Sorguyu seçilen motorda aç |
| Ctrl / Cmd + Shift + S | Sorguyu kaydet |

## JSON biçimi

```json
{
  "version": 1,
  "records": [
    {
      "name": "Yıllık raporlar",
      "query": "site:example.com filetype:pdf \"annual report\""
    }
  ]
}
```

En fazla 2 MB dosya, 500 kayıt, kayıt başına 120 karakter ad ve 10.000 karakter sorgu kabul edilir. Aynı sorgular atlanır. Geçersiz dosyada mevcut koleksiyon korunur. Dışa aktarma yalnızca kaydedilmiş koleksiyonu içerir; taslakları ve geçmişi içermez.

## Veri ve sınırlar

Uygulama sonuç kazımaz, hedeflere istek göndermez, bağlantıları taramaz ve aramaları kendiliğinden çalıştırmaz. Arama düğmesi sorguyu seçilen arama motoruna gönderir. Araç, kamuya açık kaynak araştırması ve yetkili olduğunuz alanların indeks görünürlüğünü incelemek için kullanılabilir.

Taslaklar, kapsam, motor seçimi, koleksiyon ve açık olduğunda geçmiş, `dorkcraft.workspace.v1` anahtarıyla tarayıcının `localStorage` alanında saklanır. Sunucuya veya hesaba eşitlenmez. Tarayıcı verilerini silmek bunları kaldırır; kalıcı yedek için JSON dışa aktarın. Yerel depolama engellenirse uygulama bellekte çalışmayı sürdürür ve uyarı gösterir. Kayıtlar şifrelenmez; hassas değerleri sorgulara yazmayın.

Yazı tipleri Google Fonts üzerinden yüklenir; bağlantı yoksa sistem yazı tipi kullanılır. Bunun ve kullanıcı tarafından başlatılan aramaların dışında uygulamanın harici servis bağımlılığı yoktur.

Operatör desteği arama motoruna göre değişebilir; referans Google odaklıdır. Denetleyici bir sorgu ayrıştırıcısı veya arama motoru doğrulayıcısı değildir. Uyarılar düzenlemeye yardımcı olur, sözdizimi uyarıları aramayı engellemez. Geçersiz kapsam ise arama/kopyalama/kaydetmeyi engeller. Tarihler için `YYYY-AA-GG` kullanın. Arama sonuçları, indeks kapsamı ve sonuçların güncelliği garanti edilmez. Temel operatörler için [Google'ın arama daraltma rehberine](https://support.google.com/websearch/answer/2466433?hl=tr) bakın.

## Dosya düzeni

```text
index.html             Arayüz ve erişilebilir form yapısı
style.css              Tema ve duyarlı düzen
catalog.js             Operatör referansı ve şablonlar
core.js                Sorgu oluşturma, kapsam, denetim, aktarım doğrulaması
app.js                 Arayüz olayları ve yerel kayıt yönetimi
tests/core.test.js     Bağımlılıksız mantık testleri
tests/browser.cjs      Gerçek tarayıcı senaryoları
```

Yeni şablon eklemek için `catalog.js` içindeki `TEMPLATES` listesine ilgili kategori altında `{ name, dork }` kaydı ekleyin. Arayüz, sorgu ve kayıt içeriklerini HTML olarak çalıştırmaz; metin olarak görüntüler.

## Testler

Node.js 18 veya üzeriyle, ek paket kurmadan:

```bash
node --test tests/core.test.js
```

Tarayıcı testleri için isteğe bağlı Playwright kurulumu:

```bash
npm install --no-save --package-lock=false playwright
npx playwright install chromium
```

Yerel HTTP sunucusu açıkken ikinci terminalde:

```bash
node tests/browser.cjs
```

Farklı sunucu için `APP_URL`, mevcut Playwright kurulumu için `PLAYWRIGHT_MODULE`, Chromium yolu için `CHROMIUM_PATH`, ekran görüntüleri için mevcut bir klasör belirten `SCREENSHOT_DIR` ortam değişkenleri kullanılabilir.

Testler sorgu oluşturmayı, kapsamı, tarih/sözdizimi denetimini, yenileme sonrası kalıcılığı, manuel sekme eylemlerini, kayıt/geçmiş akışını, atomik JSON aktarımını, HTML içeriklerinin metin olarak gösterilmesini, mobil taşmayı ve depolamasız çalışmayı kapsar. Tarayıcı testinde arama sekmesinin açılması taklit edilir; gerçek arama motorlarına sorgu gönderilmez.
