// 1. Inisialisasi Peta (Default: ITB Bandung)
const map = L.map('map').setView([-6.8915, 107.6107], 13);
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '© OpenStreetMap, © CartoDB'
}).addTo(map);

let marker = L.marker([-6.8915, 107.6107], { draggable: true }).addTo(map);

// Fungsi Update Input saat Peta Digeser/Diklik/Dicari
function updateInputs(lat, lon) {
    document.getElementById('lat').value = lat.toFixed(6);
    document.getElementById('lon').value = lon.toFixed(6);
    marker.setLatLng([lat, lon]);
    // Jangan ubah view map di sini agar tidak loncat-loncat saat drag
}

// Event: Klik Peta
map.on('click', (e) => {
    updateInputs(e.latlng.lat, e.latlng.lng);
});

// Event: Marker Digeser
marker.on('dragend', (e) => {
    const { lat, lng } = marker.getLatLng();
    updateInputs(lat, lng);
});

// 2. FITUR PENCARIAN KOTA (MANUAL SEARCH) - PERBAIKAN UTAMA
document.getElementById('btn-search').addEventListener('click', async () => {
    const query = document.getElementById('city-search').value;
    const btn = document.getElementById('btn-search');
    
    if (!query) {
        alert("Ketik nama kota dulu!");
        return;
    }

    btn.innerText = "⏳"; // Loading indicator kecil

    try {
        // Gunakan Nominatim API (OpenStreetMap) untuk Geocoding
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}`);
        const data = await res.json();

        if (data.length > 0) {
            const lat = parseFloat(data[0].lat);
            const lon = parseFloat(data[0].lon);
            
            // Pindahkan peta ke lokasi hasil pencarian
            map.setView([lat, lon], 14);
            marker.setLatLng([lat, lon]);
            
            // Update input koordinat
            document.getElementById('lat').value = lat.toFixed(6);
            document.getElementById('lon').value = lon.toFixed(6);
        } else {
            alert("Lokasi tidak ditemukan. Coba nama yang lebih spesifik.");
        }
    } catch (err) {
        console.error(err);
        alert("Gagal mencari lokasi.");
    } finally {
        btn.innerText = "🔍";
    }
});

// 3. FITUR LOKASI SAYA (GPS)
document.getElementById('btn-mylocation').addEventListener('click', () => {
    const btn = document.getElementById('btn-mylocation');
    btn.innerHTML = "⏳";
    
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                map.setView([latitude, longitude], 16);
                marker.setLatLng([latitude, longitude]);
                
                // Update input secara eksplisit
                document.getElementById('lat').value = latitude.toFixed(6);
                document.getElementById('lon').value = longitude.toFixed(6);
                
                btn.innerHTML = "📍";
            },
            (err) => {
                alert("Gagal ambil lokasi: " + err.message);
                btn.innerHTML = "📍";
            }
        );
    } else {
        alert("Browser tidak mendukung GPS.");
    }
});

// 4. LOGIKA ANALISIS & TAMPILAN DASHBOARD
document.getElementById('btn-analyze').addEventListener('click', async (e) => {
    e.preventDefault();
    
    const lat = document.getElementById('lat').value;
    const lon = document.getElementById('lon').value;

    if (!lat || !lon) {
        alert("Pilih lokasi target dulu (via Search, GPS, atau Klik Peta)!");
        return;
    }

    const btn = document.getElementById('btn-analyze');
    btn.innerText = "⚡ MENGANALISIS SAR...";
    btn.disabled = true;

    try {
        // Kirim koordinat ke Backend
        const res = await fetch(`http://127.0.0.1:8000/v1/realtime-analysis?lat=${lat}&lon=${lon}`, {
            method: 'POST'
        });

        if (!res.ok) throw new Error("Backend Error");
        const data = await res.json();

        // TAMPILKAN DASHBOARD
        document.getElementById('forensic-dashboard').classList.remove('hidden');

        // Isi Data Sponge Effect (Kejenuhan Tanah)
        const saturationRaw = parseFloat(data.hydrology.saturation.replace('%', ''));
        document.getElementById('sat-val').innerText = data.hydrology.saturation;
        document.getElementById('sat-progress').style.width = `${saturationRaw}%`;
        
        // Ubah warna bar jika kritis
        const barFill = document.getElementById('sat-progress');
        if (saturationRaw > 80) {
            barFill.style.backgroundColor = "#ff4444"; // Merah bahaya
        } else {
            barFill.style.backgroundColor = "#00ff88"; // Hijau aman
        }

        // Isi Prediksi Waktu
        const timeElem = document.getElementById('prediction-window');
        timeElem.innerText = data.forensic_result.prediction_window;
        
        // Isi Status & Rekomendasi
        const box = document.getElementById('status-box');
        const title = document.getElementById('status-title');
        
        title.innerText = data.forensic_result.status;
        document.getElementById('recommendation').innerText = 
            `Curah Hujan: ${data.hydrology.weather_forecast}\n` + // Tampilkan curah hujan di sini
            `Rekomendasi: ${data.forensic_result.recommendation}`;

        // Styling Alert Berdasarkan Status
        if (data.forensic_result.status.includes('CRITICAL')) {
            box.style.borderLeftColor = "#ff4444";
            title.style.color = "#ff4444";
            timeElem.style.color = "#ff4444";
            timeElem.classList.add('blink-text');
        } else if (data.forensic_result.status.includes('WARNING')) {
            box.style.borderLeftColor = "#ffbb33"; // Kuning
            title.style.color = "#ffbb33";
            timeElem.style.color = "#ffbb33";
            timeElem.classList.remove('blink-text');
        } else {
            box.style.borderLeftColor = "#00ff88";
            title.style.color = "#00ff88";
            timeElem.style.color = "#00ff88";
            timeElem.classList.remove('blink-text');
        }

    } catch (err) {
        alert("Gagal koneksi ke Backend. Pastikan uvicorn jalan.");
        console.error(err);
    } finally {
        btn.innerText = "JALANKAN AUDIT FORENSIK";
        btn.disabled = false;
    }
});

function toggleDashboard() {
    document.getElementById('forensic-dashboard').classList.add('hidden');
}