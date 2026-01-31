// 1. Inisialisasi Peta
var map = L.map('map').setView([-6.9175, 107.6191], 13);
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '© OpenStreetMap'
}).addTo(map);

var currentMarker = null;

async function fetchPrediction() {
    const lat = parseFloat(document.getElementById('lat').value);
    const lon = parseFloat(document.getElementById('lon').value);

    // Reset UI
    document.getElementById('loading').classList.remove('hidden');
    document.getElementById('result-area').classList.add('hidden');

    // --- PERBAIKAN PETA HILANG ---
    // Peta sering error saat container 'hidden' dibuka.
    // Kita paksa peta untuk render ulang ukurannya.
    setTimeout(() => { map.invalidateSize(); }, 100);
    
    // Update Lokasi Peta
    map.flyTo([lat, lon], 14);
    if (currentMarker) map.removeLayer(currentMarker);
    currentMarker = L.marker([lat, lon]).addTo(map);

    try {
        const response = await fetch('/api/predict', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ lat: lat, lon: lon })
        });
        
        const result = await response.json();
        
        if(result.status === 'success') {
            const data = result.data;
            
            // Tampilkan Data Meta (Jujur)
            document.getElementById('sat-date').innerText = data.meta.satellite_date;
            document.getElementById('data-source').innerText = data.meta.data_source;
            document.getElementById('gap-note').innerText = data.meta.gap_note;
            document.getElementById('global-status-text').innerText = "STATUS WILAYAH: " + data.global_status;
            
            // Render Kartu 3 Hari
            const container = document.getElementById('forecast-cards');
            container.innerHTML = ''; // Bersihkan lama
            
            data.forecast.forEach((day, index) => {
                let label = day.day_name;
                if(index === 0) label = "HARI INI"; 
                if(index === 1) label = "BESOK";

                const html = `
                    <div class="card ${day.css_class}">
                        <div style="font-size: 0.9em; color: #94a3b8;">${label} (${day.date})</div>
                        <div style="font-size: 2em; font-weight: bold; margin: 10px 0;">${day.flood_risk}%</div>
                        <div style="font-weight: bold; margin-bottom: 10px;">${day.status}</div>
                        <div style="font-size: 0.85em; text-align: left; background: #334155; padding: 8px; border-radius: 6px;">
                            <div>💧 Tanah: <b>${day.soil_moisture}</b></div>
                            <div>🌧️ Hujan: <b>${day.rain_mm} mm</b></div>
                        </div>
                    </div>
                `;
                container.innerHTML += html;
            });
        }

    } catch (error) {
        alert("Gagal koneksi ke API!");
        console.error(error);
    } finally {
        document.getElementById('loading').classList.add('hidden');
        document.getElementById('result-area').classList.remove('hidden');
    }
}