import rasterio
import matplotlib.pyplot as plt
import numpy as np
import os

# Tentukan file yang mau dilihat (ambil sampel pertama dari folder)
s1_path = "data/raw/s1"
label_path = "data/raw/label"

s1_files = sorted(os.listdir(s1_path))
label_files = sorted(os.listdir(label_path))

# Ambil sampel ke-0
test_s1 = os.path.join(s1_path, s1_files[0])
test_label = os.path.join(label_path, label_files[0])

print(f"🧐 Menampilkan file: {s1_files[0]}")

# Membaca data satelit
with rasterio.open(test_s1) as src_s1:
    # Sentinel-1 biasanya punya 2 band: Band 1 (VV) dan Band 2 (VH)
    vv = src_s1.read(1)
    vh = src_s1.read(2)

with rasterio.open(test_label) as src_label:
    label = src_label.read(1)

# Visualisasi
plt.figure(figsize=(15, 5))

# Plot Band VV (Polarisasi Vertikal-Vertikal)
plt.subplot(1, 3, 1)
plt.imshow(vv, cmap='gray')
plt.title("Sentinel-1 (VV Band)")
plt.colorbar(fraction=0.046, pad=0.04)

# Plot Band VH (Polarisasi Vertikal-Horizontal)
plt.subplot(1, 3, 2)
plt.imshow(vh, cmap='gray')
plt.title("Sentinel-1 (VH Band)")
plt.colorbar(fraction=0.046, pad=0.04)

# Plot Label (Jawaban AI: Banjir vs Bukan)
plt.subplot(1, 3, 3)
plt.imshow(label, cmap='Blues')
plt.title("Ground Truth (Banjir)")
plt.colorbar(fraction=0.046, pad=0.04)

plt.tight_layout()
plt.show()