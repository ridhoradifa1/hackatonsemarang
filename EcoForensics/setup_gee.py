import ee

# Ganti dengan Project ID Anda
PROJECT_ID = "hackaton-485815" 

print("=== MULAI PROSES LOGIN GOOGLE EARTH ENGINE ===")
print("1. Browser akan terbuka (atau link akan muncul).")
print("2. Login dengan akun Google Anda.")
print("3. Klik 'Allow' / 'Izinkan'.")
print("4. COPY kode yang muncul.")
print("5. PASTE kode tersebut di terminal ini, lalu tekan ENTER.")
print("==============================================")

try:
    # Ini akan memaksa browser terbuka
    ee.Authenticate()

    # Inisialisasi untuk memastikan login berhasil
    ee.Initialize(project=PROJECT_ID)
    print("\n✅ SUKSES! Izin GEE sudah tersimpan di komputer ini.")
    print("Sekarang Anda bisa menjalankan main.py dengan aman.")
except Exception as e:
    print(f"\n❌ GAGAL: {e}")