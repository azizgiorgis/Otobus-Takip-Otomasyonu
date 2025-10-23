🚌 Gelişmiş Otobüs Takip Simülasyonu

Bu proje, React ve Tailwind CSS kullanılarak geliştirilmiş, toplu taşıma araçlarının gerçek zamanlı konumlarını, hızlarını ve tahmini varış zamanlarını (ETA) simüle eden bir uygulamadır. Harita katmanı için Leaflet ve React-Leaflet kütüphaneleri kullanılmıştır.

Uygulama, özellikle otobüslerin duraklara yaklaştıkça yavaşlaması, rastgele trafik gecikmeleri ve dinamik rota hesaplamaları gibi gerçek dünya senaryolarını taklit etmek üzere tasarlanmıştır.


💻 Teknolojiler

React: Kullanıcı arayüzü (UI) ve simülasyon mantığı için.

Tailwind CSS: Hızlı ve modern arayüz tasarımı için.

Leaflet & React-Leaflet: Harita bileşenini oluşturmak ve otobüs/durak işaretçilerini yönetmek için.

Vercel: Kolay ve hızlı deployment (yayına alma) platformu.

🚀 Başlangıç

Bu projeyi yerel makinenizde çalıştırmak için aşağıdaki adımları izleyin.

Ön Koşullar

Node.js (LTS sürümü önerilir)

npm veya yarn

Kurulum Adımları

Projeyi klonlayın (Eğer klonlama yapıyorsanız):

git clone [https://github.com/kullaniciadiniz/otobus-takip-simulasyonu.git](https://github.com/kullaniciadiniz/otobus-takip-simulasyonu.git)
cd otobus-takip-simulasyonu


Bağımlılıkları yükleyin:

npm install


Uygulamayı başlatın:

npm start


Uygulama genellikle http://localhost:3000 adresinde açılacaktır.

✨ Özellikler

Gerçek Zamanlı Konum: Otobüslerin harita üzerindeki konumlarının her 500ms'de bir güncellenmesi.

Dinamik Hız Kontrolü: Kontrol panelinden her bir otobüsün maksimum seyir hızının ayarlanabilmesi.

Trafik Simülasyonu: Rastgele yavaşlamalar ekleyerek trafik gecikmelerini taklit etme.

Durak Yaklaşımı: Otobüslerin durağa 0.5 km'den daha yakınken otomatik olarak yavaşlaması ve durması.

ETA Hesaplama: Kalan mesafeye ve anlık hıza göre tahmini varış süresi (ETA) hesaplama.

Görsel Geri Bildirim: Otobüslerin doluluk oranına göre renkli etiketler (Yeşil, Sarı, Kırmızı) ile anlık kapasite durumu gösterme.