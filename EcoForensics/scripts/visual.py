import torch
import matplotlib.pyplot as plt
import numpy as np
import os
import rasterio
import segmentation_models_pytorch as smp
from model_utils_v2 import EcoForensicsDatasetV2

# --- KONFIGURASI ---
MODEL_PATH = "models/sar_hydra_v2.pth"  # Model hasil training Epoch 40
S1_DIR = "data/raw/s1"
LABEL_DIR = "data/raw/label"
DEM_DIR = "data/raw/dem"
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

def visualize_prediction(num_samples=5):
    print(f"🔍 Memvisualisasikan {num_samples} sampel acak...")
    
    # 1. Load Dataset
    dataset = EcoForensicsDatasetV2(S1_DIR, LABEL_DIR, DEM_DIR)
    
    if len(dataset) == 0:
        print("❌ Dataset kosong!")
        return

    # 2. Load Model Arsitektur (Sama persis dengan train_v2.py)
    model = smp.UnetPlusPlus(
        encoder_name="efficientnet-b4",
        encoder_weights=None, 
        in_channels=4, 
        classes=1,
        activation=None
    ).to(DEVICE)

    # 3. Load Weights
    if os.path.exists(MODEL_PATH):
        state_dict = torch.load(MODEL_PATH, map_location=DEVICE)
        model.load_state_dict(state_dict)
        print("✅ Model V2 berhasil di-load.")
    else:
        print(f"❌ File model {MODEL_PATH} tidak ditemukan.")
        return

    model.eval()

    # 4. Loop Visualisasi
    # Kita ambil beberapa sampel acak biar valid
    indices = np.random.choice(len(dataset), num_samples, replace=False)
    
    for idx in indices:
        try:
            image_tensor, mask_tensor = dataset[idx]
            image_input = image_tensor.unsqueeze(0).to(DEVICE)

            # Prediksi
            with torch.no_grad():
                output = model(image_input)
                # Threshold 0.5 untuk memisahkan banjir/bukan
                pred_mask = (torch.sigmoid(output) > 0.5).float().squeeze().cpu().numpy()

            # Ambil Data Asli untuk Visualisasi
            # Channel 0 = Radar VV (Struktur)
            vv_channel = image_tensor[0].numpy()
            # Channel 2 = DEM (Ketinggian)
            dem_channel = image_tensor[2].numpy()
            ground_truth = mask_tensor.squeeze().numpy()

            # --- PLOTTING ---
            fig, ax = plt.subplots(1, 4, figsize=(20, 5))
            
            # Gambar 1: Radar Asli
            ax[0].imshow(vv_channel, cmap='gray')
            ax[0].set_title(f"Input: Radar (Sample #{idx})")
            ax[0].axis('off')

            # Gambar 2: DEM (Bukti 'Deep Tech')
            # Kita pakai colormap 'terrain' biar gunung terlihat
            ax[1].imshow(dem_channel, cmap='terrain')
            ax[1].set_title("Input: Topografi (DEM)")
            ax[1].axis('off')

            # Gambar 3: Kunci Jawaban
            ax[2].imshow(ground_truth, cmap='Blues', interpolation='nearest')
            ax[2].set_title("Label Asli")
            ax[2].axis('off')

            # Gambar 4: Prediksi AI
            # Tampilkan Radar sebagai background, lalu timpa dengan Merah Transparan
            ax[3].imshow(vv_channel, cmap='gray')
            # Masking: Hanya tampilkan warna merah di area prediksi banjir
            masked_pred = np.ma.masked_where(pred_mask == 0, pred_mask)
            ax[3].imshow(masked_pred, cmap='autumn', alpha=0.6) 
            ax[3].set_title("Prediksi AI V2")
            ax[3].axis('off')

            plt.tight_layout()
            plt.show()
            
            # Simpan juga ke file biar bisa dipamerkan
            plt.savefig(f"hasil_visualisasi_index_{idx}.png")
            print(f"📸 Gambar disimpan: hasil_visualisasi_index_{idx}.png")
            
        except Exception as e:
            print(f"⚠️ Error visualisasi index {idx}: {e}")

if __name__ == "__main__":
    visualize_prediction()