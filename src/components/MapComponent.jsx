import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Leaflet ikon sorununu gidermek için
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Otobüs ikonu için özel ayar (basit bir SVG kullanıyoruz)
const customBusIcon = (color) => new L.Icon({
    iconUrl: `data:image/svg+xml;charset=utf-8,
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="30px" height="30px">
            <path d="M18 10v6H6v-6c0-1.77 1.4-3.21 3.11-3.44L12 3l2.89 3.56C16.6 6.79 18 8.23 18 10zM6 18c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2v-1H6v1z"/>
        </svg>`,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30]
});


const MapComponent = ({ otobusler, duraklar, mapCenter }) => {
    // Tüm durakların koordinatlarını rota çizimi için alalım
    const polylineCoords = duraklar.map(d => [d.lat, d.lng]);

    // Harita merkezini Mecidiyeköy'e (ilk durağa) ayarlayalım
    const center = mapCenter ? [mapCenter.lat, mapCenter.lng] : [41.0660, 29.0033]; 
    const zoomLevel = 13;

    return (
        // Harita konteynerinin dış DIV'i h-full w-full almalı
        <div id="mapid" className="h-full w-full"> 
            <MapContainer 
                center={center} 
                zoom={zoomLevel} 
                scrollWheelZoom={true}
                // Haritanın yüksekliğini %100 yapmalıyız
                style={{ height: '100%', width: '100%' }} 
            >
                {/* Açık kaynak harita katmanı (OpenStreetMap) */}
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                {/* 1. Rota Çizgisi (Polyline) */}
                <Polyline pathOptions={{ color: '#00BFFF', weight: 4, dashArray: '10, 10' }} positions={polylineCoords} />
                
                {/* 2. Durak İşaretçileri */}
                {duraklar.map(durak => (
                    <Marker key={durak.id} position={[durak.lat, durak.lng]}>
                        <Popup>
                            **Durak:** {durak.ad}
                        </Popup>
                    </Marker>
                ))}

                {/* 3. Otobüs İşaretçileri */}
                {otobusler.map(otobus => (
                    <Marker 
                        key={otobus.id} 
                        position={[otobus.lat, otobus.lng]}
                        icon={customBusIcon(otobus.renk)} 
                    >
                        <Popup>
                            **{otobus.ad}** <br/>
                            Hız: {otobus.hiz} km/s <br/>
                            Sonraki Durak: {duraklar[otobus.hedefIndex].ad}
                        </Popup>
                    </Marker>
                ))}
                
            </MapContainer>
        </div>
    );
};

export default MapComponent;
