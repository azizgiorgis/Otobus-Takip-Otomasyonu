import MapComponent from './components/MapComponent';
import React, { useState, useEffect, useCallback } from 'react';

// Şehir Hattı Durakları
const DURAKLAR = [
  { id: 1, ad: "Mecidiyeköy", lat: 41.0660, lng: 29.0033 },
  { id: 2, ad: "Beşiktaş İskelesi", lat: 41.0428, lng: 29.0069 },
  { id: 3, ad: "Taksim Meydanı", lat: 41.0361, lng: 28.9850 },
  { id: 4, ad: "Zincirlikuyu", lat: 41.0768, lng: 29.0088 },
];

// Otobüslerin Başlangıç Durumu
// Başlangıç konumları, ilgili durağın koordinatlarından minimal bir kayma ile düzeltildi (0.0001)
const BASLANGIC_OTOBUSLER = [
  { id: 101, ad: "K-1 Mecidiyeköy Ekspres", hiz: 30, maxHiz: 55, yolcuSayisi: 15, kapasite: 80, lat: DURAKLAR[0].lat + 0.0001, lng: DURAKLAR[0].lng - 0.0001, hedefIndex: 1, renk: "red", yon: 45, kalanMesafe: 0, tahminiVaris: "N/A" },
  { id: 102, ad: "M-2 Beşiktaş Yerel", hiz: 20, maxHiz: 45, yolcuSayisi: 40, kapasite: 60, lat: DURAKLAR[1].lat + 0.0001, lng: DURAKLAR[1].lng + 0.0001, hedefIndex: 2, renk: "blue", yon: 135, kalanMesafe: 0, tahminiVaris: "N/A" },
  { id: 103, ad: "T-3 Taksim Hızlı", hiz: 40, maxHiz: 60, yolcuSayisi: 5, kapasite: 70, lat: DURAKLAR[2].lat - 0.0001, lng: DURAKLAR[2].lng - 0.0001, hedefIndex: 3, renk: "green", yon: 225, kalanMesafe: 0, tahminiVaris: "N/A" },
  { id: 104, ad: "Z-4 Çevre Yolu", hiz: 50, maxHiz: 75, yolcuSayisi: 60, kapasite: 90, lat: DURAKLAR[3].lat - 0.0001, lng: DURAKLAR[3].lng + 0.0001, hedefIndex: 0, renk: "orange", yon: 315, kalanMesafe: 0, tahminiVaris: "N/A" },
];

// Haversine Formülü ile İki Nokta Arasındaki Mesafeyi (KM) Hesaplama
const getDistanceHaversine = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // Dünya'nın yarıçapı (km)
    const toRad = (value) => (value * Math.PI) / 180;

    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Mesafeyi kilometre cinsinden döndür
};

// İki nokta arasındaki yönü (derece cinsinden) hesaplama
const getBearing = (lat1, lng1, lat2, lng2) => {
    const toRad = (value) => (value * Math.PI) / 180;
    const toDeg = (value) => (value * 180) / Math.PI;

    const rLat1 = toRad(lat1);
    const rLng1 = toRad(lng1);
    const rLat2 = toRad(lat2);
    const rLng2 = toRad(lng2);

    const y = Math.sin(rLng2 - rLng1) * Math.cos(rLat2);
    const x = Math.cos(rLat1) * Math.sin(rLat2) -
              Math.sin(rLat1) * Math.cos(rLat2) * Math.cos(rLng2 - rLng1);
    
    // Yönü 0-360 derece arasında döndür
    return (toDeg(Math.atan2(y, x)) + 360) % 360; 
}


function App() {
  const [otobusler, setOtobusler] = useState(BASLANGIC_OTOBUSLER);
  const [simulasyonCalisiyor, setSimulasyonCalisiyor] = useState(true);

  // Hız değiştirme fonksiyonu
  const hiziDegistir = useCallback((id, yeniHiz) => {
    setOtobusler(prev => 
      prev.map(otobus => 
        otobus.id === id ? { ...otobus, hiz: Number(yeniHiz) } : otobus
      )
    );
  }, []);

  // Simülasyon Durdur/Başlat fonksiyonu
  const toggleSimulasyon = () => {
    setSimulasyonCalisiyor(prev => !prev);
  }
  
  // ETA Hesaplama fonksiyonu (KM cinsinden mesafeyi dakikaya çevirir)
  const calculateETA = (distanceKm, speedKmh) => {
    if (speedKmh === 0) return "Durakta";
    if (distanceKm === 0) return "Durakta";
    
    // Zaman (saat) = Mesafe (km) / Hız (km/h)
    const timeHours = distanceKm / speedKmh;
    const timeMinutes = Math.round(timeHours * 60);

    return `${timeMinutes} dk`;
  }

  // GERÇEK ZAMANLI HAREKET SİMÜLASYON MANTIĞI (KM/H BAZLI VE TRAFİK ETKİSİ)
  useEffect(() => {
    if (!simulasyonCalisiyor) return; 

    // Simülasyon adımı süresi (saniye cinsinden)
    const SIMULASYON_ADIM_SURESI_MS = 500;
    const SIMULASYON_ADIM_SURESI_H = SIMULASYON_ADIM_SURESI_MS / 1000 / 3600; // Saate çevirdik
    
    const ROTA_KARMASIKLIK_FAKTORU = 1.3; 
    // Otobüsün durağa yaklaşınca yavaşlamaya başlayacağı mesafe (KM)
    const YAVASLAMA_MESAFESI_KM = 0.5; 

    const interval = setInterval(() => {
        setOtobusler(prevOtobusler => 
            prevOtobusler.map(otobus => {
                const hedefDurak = DURAKLAR[otobus.hedefIndex];
                
                // Mevcut konum ve hedef arasındaki KUŞ UÇUŞU mesafesi (KM)
                const mesafeKmHaversine = getDistanceHaversine(otobus.lat, otobus.lng, hedefDurak.lat, hedefDurak.lng);
                
                // 1. ANLIK HIZ HESAPLAMA (Trafik Simülasyonu)
                let anlikHizKmh = otobus.hiz; // Temel kontrol panelindeki hız
                
                if (mesafeKmHaversine < YAVASLAMA_MESAFESI_KM) {
                    // Durağa yaklaştıkça yavaşla (hız, mesafeye oranla azalır, minimum 5 km/h)
                    const yavaslamaOrani = mesafeKmHaversine / YAVASLAMA_MESAFESI_KM; 
                    anlikHizKmh = Math.max(5, otobus.hiz * yavaslamaOrani);
                } else {
                    // Normal hareket ederken, %2 ihtimalle rastgele bir gecikme ekleyelim (trafik)
                    if (Math.random() < 0.02) {
                        anlikHizKmh = Math.max(10, otobus.hiz * (0.5 + Math.random() * 0.5)); // Hızı %50-100 arasında düşür
                    } else {
                        anlikHizKmh = otobus.hiz; // Normal hıza dön
                    }
                }
                
                // 2. HAREKET MİKTARI
                const katEdilecekMesafeKm = anlikHizKmh * SIMULASYON_ADIM_SURESI_H; 
                
                let yeniLat = otobus.lat;
                let yeniLng = otobus.lng;
                let yeniYon = otobus.yon;
                let sonrakiHedefIndex = otobus.hedefIndex;
                let kalanMesafe = mesafeKmHaversine;
                let tahminiVaris = calculateETA(kalanMesafe * ROTA_KARMASIKLIK_FAKTORU, otobus.hiz);

                // 3. POZİSYON GÜNCELLEME
                if (mesafeKmHaversine < katEdilecekMesafeKm / ROTA_KARMASIKLIK_FAKTORU) {
                    // Durağa ulaştık
                    yeniLat = hedefDurak.lat;
                    yeniLng = hedefDurak.lng;
                    
                    // Yolcu değişimi simülasyonu (rastgele)
                    const yeniYolcuSayisi = Math.min(otobus.kapasite, Math.max(0, otobus.yolcuSayisi + Math.floor(Math.random() * 10) - 5));
                    
                    // Bir sonraki hedef durağı ayarla ve 5 saniye durak beklemesi simüle et
                    sonrakiHedefIndex = (otobus.hedefIndex + 1) % DURAKLAR.length;

                    // Otobüs 5 saniye durakta beklerken hızını 0'a çekelim
                    // NOT: Gerçek bir uygulamada burada bir 'bekleme' state'i tutulurdu. 
                    // Basitlik için sadece durakta 0 hızda kalmasını sağlıyoruz.
                    anlikHizKmh = 0; 

                    // Hemen bir sonraki adıma geçmek yerine, bekleme süresini atlamak için
                    // Otobüsün anlık hızını 0'a çekip sonraki döngüde normal hıza döneceğiz
                    
                } else {
                    // Hareket et
                    const dLat = hedefDurak.lat - otobus.lat;
                    const dLng = hedefDurak.lng - otobus.lng;
                    
                    const oran = katEdilecekMesafeKm / (mesafeKmHaversine * ROTA_KARMASIKLIK_FAKTORU);
                    
                    yeniLat = otobus.lat + dLat * oran;
                    yeniLng = otobus.lng + dLng * oran;

                    // Yeni yönü hesapla
                    yeniYon = getBearing(otobus.lat, otobus.lng, yeniLat, yeniLng);
                }

                return { 
                    ...otobus, 
                    lat: yeniLat, 
                    lng: yeniLng, 
                    hedefIndex: sonrakiHedefIndex,
                    yon: yeniYon,
                    hiz: anlikHizKmh, // Otobüsün anlık hızını UI'da göstermek için güncelledik
                    kalanMesafe: kalanMesafe.toFixed(2), // 2 ondalık basamak
                    tahminiVaris: tahminiVaris,
                    yolcuSayisi: anlikHizKmh === 0 ? otobus.yolcuSayisi : otobus.yolcuSayisi // Yolcu değişimini sadece durakta durduğu zaman yap
                };
            })
        );
    }, SIMULASYON_ADIM_SURESI_MS); 

    return () => clearInterval(interval);
  }, [simulasyonCalisiyor]); 

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      
      {/* Sol Panel: Kontroller ve Detaylar */}
      <div className="w-1/4 p-4 bg-white shadow-xl overflow-y-auto z-10">
        <h1 className="text-2xl font-extrabold mb-4 text-indigo-700 border-b-4 border-indigo-200 pb-2">
          🚌 Gelişmiş Otobüs Takip Otomasyonu
        </h1>

        {/* Simülasyon Kontrol Butonu */}
        <button 
          onClick={toggleSimulasyon}
          className={`w-full py-3 mb-4 text-white font-bold rounded-xl shadow-lg transform transition duration-300 hover:scale-[1.02]
                      ${simulasyonCalisiyor ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
        >
          {simulasyonCalisiyor ? 'Simülasyonu Duraklat (Trafik Akıyor)' : 'Simülasyonu Başlat'}
        </button>

        <h2 className="text-xl font-bold mb-3 text-gray-700 border-b pb-1">Anlık Filo Durumu</h2>
        
        {/* Otobüs Kontrolleri */}
        {otobusler.map(otobus => (
          <OtobusKontrol key={otobus.id} otobus={otobus} hiziDegistir={hiziDegistir} duraklar={DURAKLAR} />
        ))}

      </div>
      
      {/* Sağ Kısım: Harita */}
      <div className="flex-1 h-full relative">
        <MapComponent otobusler={otobusler} duraklar={DURAKLAR} mapCenter={DURAKLAR[0]} /> 
      </div>
    </div>
  );
}

// Otobüs Kontrol Bileşeni (Panel İçin)
const OtobusKontrol = ({ otobus, hiziDegistir, duraklar }) => {
    const sonrakiDurak = duraklar[otobus.hedefIndex];
    const dolulukOrani = ((otobus.yolcuSayisi / otobus.kapasite) * 100).toFixed(0);

    let dolulukRengi = 'bg-green-500';
    if (dolulukOrani > 80) dolulukRengi = 'bg-red-500';
    else if (dolulukOrani > 50) dolulukRengi = 'bg-yellow-500';

    return (
        <div className="p-4 mb-4 bg-white border border-gray-200 rounded-xl shadow-md transition duration-300 hover:shadow-lg">
            <h3 className="font-extrabold text-xl mb-2 flex items-center justify-between" style={{ color: otobus.renk }}>
                {otobus.ad}
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full text-white ${dolulukRengi}`}>
                   Otobüs DOluluk Oranı % {dolulukOrani}
                </span>
            </h3>
            
            <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                <p><span className="font-semibold">Konum:</span> Hareket Halinde</p>
                <p><span className="font-semibold">Hedef Durak:</span> {sonrakiDurak.ad}</p>
                <p><span className="font-semibold">Kalan Yol:</span> {otobus.kalanMesafe} km</p>
                <p><span className="font-semibold">Tahmini Varış:</span> **{otobus.tahminiVaris}**</p>
            </div>

            <p className="text-lg font-bold text-gray-800 mb-2">
                Anlık Hız: {otobus.hiz.toFixed(0)} km/s
            </p>
            
            <label className="block mt-2 text-xs font-medium text-gray-500">
                Maksimum Seyir Hızı (Bas Gaza)
            </label>
            
            <input
                type="range"
                min="1"
                max={otobus.maxHiz} 
                value={otobus.hiz} // Değişken olan hız yerine, kontrol için maxHiz'i kullanmalıyız
                onChange={(e) => hiziDegistir(otobus.id, e.target.value)}
                className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer range-lg"
                style={{ accentColor: otobus.renk }}
            />
            <p className='text-xs text-right text-gray-400 mt-1'>Max Hız: {otobus.maxHiz} km/s</p>
        </div>
    );
};

export default App;
