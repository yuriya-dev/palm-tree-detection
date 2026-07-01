# Penjelasan ML: Deteksi Pohon Sawit dari Citra

Dokumen ini menjelaskan bahwa proyek ini termasuk pengolahan citra (computer vision), serta bagaimana model mendeteksi objek, alur training, evaluasi, dan contoh perhitungan.

## Apakah ini termasuk pengolahan citra?
Ya. Proyek ini memproses citra (gambar UAV/udara) untuk mengenali dan melokalisasi objek (pohon sawit). Ini masuk ranah **computer vision** dan **object detection**, yaitu cabang dari pengolahan citra dan machine learning.

## Gambaran umum pipeline
1. **Data**: citra + anotasi kotak (bounding box) objek.
2. **Preprocessing & augmentasi**: resize, normalize, flip/rotate, dll.
3. **Model deteksi**: backbone + neck + head.
4. **Training**: optimisasi loss deteksi.
5. **Evaluasi**: mAP, precision, recall, IoU.
6. **Inferensi**: model memprediksi kotak dan label objek pada citra baru.

## Cara model mengenali objek
Model deteksi modern (mis. varian dari Faster R-CNN/RetinaNet/YOLO pada MMDetection) umumnya terdiri dari:

### 1) Backbone
Jaringan CNN (mis. ResNet) mengekstrak fitur dari citra.
- Input: citra H x W x 3.
- Output: peta fitur (feature maps) multi-skala.

### 2) Neck (opsional)
FPN (Feature Pyramid Network) menggabungkan fitur multi-skala agar objek kecil/besar tetap terbaca.

### 3) Head (detector)
Bagian ini memprediksi:
- **Kelas** objek (pohon sawit atau background).
- **Lokasi** bounding box (x, y, w, h) atau koordinat (x1, y1, x2, y2).

## Alur training (ringkas namun mendalam)
1. **Ambil batch** citra dan anotasi.
2. **Forward pass**: citra -> backbone -> neck -> head -> prediksi kelas dan box.
3. **Hitung loss**:
   - **Classification loss**: mengukur kesalahan prediksi kelas.
   - **Box regression loss**: mengukur kesalahan lokasi bounding box.
4. **Backpropagation**: update bobot untuk meminimalkan total loss.

### Contoh formula loss
#### a) Classification loss (Cross-Entropy)
Jika model memprediksi probabilitas kelas objek $p$ dan label ground truth $y \in \{0,1\}$:

$$
L_{cls} = -[y \log(p) + (1-y) \log(1-p)]
$$

#### b) Box regression loss (Smooth L1)
Dengan target box $t$ dan prediksi $\hat{t}$:

$$
L_{reg} = \sum_i \text{SmoothL1}(\hat{t}_i - t_i)
$$

di mana:

$$
\text{SmoothL1}(x) =
\begin{cases}
0.5 x^2, & |x| < 1 \\
|x| - 0.5, & \text{lainnya}
\end{cases}
$$

#### c) Total loss

$$
L = L_{cls} + \lambda L_{reg}
$$

$\lambda$ adalah koefisien penyeimbang.

## Mekanisme mengenali objek (inferensi)
1. Model menghasilkan banyak kandidat bounding box + skor.
2. **Non-Maximum Suppression (NMS)** menghapus kotak duplikat.
3. Hasil akhir: beberapa kotak dengan skor tertinggi.

### IoU (Intersection over Union)
IoU mengukur tumpang tindih antara prediksi dan ground truth:

$$
IoU = \frac{\text{Luas}(\text{Box pred} \cap \text{Box GT})}{\text{Luas}(\text{Box pred} \cup \text{Box GT})}
$$

Jika IoU >= threshold (mis. 0.5), prediksi dianggap benar.

## Evaluasi model
### 1) Precision & Recall
- **Precision** = proporsi prediksi benar dari semua prediksi.
- **Recall** = proporsi objek benar yang berhasil ditemukan.

$$
Precision = \frac{TP}{TP + FP}
$$

$$
Recall = \frac{TP}{TP + FN}
$$

### 2) AP (Average Precision) dan mAP
- **AP** = area di bawah kurva Precision-Recall untuk satu kelas.
- **mAP** = rata-rata AP untuk semua kelas.

## Contoh perhitungan sederhana
Misalkan pada satu citra:
- Ground truth ada 3 pohon.
- Model mendeteksi 4 box.
- Dari 4 box, 2 sesuai (IoU >= 0.5) dan 2 salah.

Maka:
- TP = 2
- FP = 2
- FN = 1 (1 pohon tidak terdeteksi)

$$
Precision = \frac{2}{2+2} = 0.5
$$

$$
Recall = \frac{2}{2+1} \approx 0.67
$$

## Contoh perhitungan IoU (angka sederhana)
Misalkan:
- Box GT: (x1=0, y1=0, x2=10, y2=10)
- Box Pred: (x1=5, y1=5, x2=15, y2=15)

Luas perpotongan = 5 x 5 = 25
Luas masing-masing box = 10 x 10 = 100
Luas gabungan = 100 + 100 - 25 = 175

$$
IoU = \frac{25}{175} = 0.143
$$

Ini berarti prediksi kurang tepat (IoU rendah).

## Ringkas
- Proyek ini adalah **pengolahan citra** karena memproses citra untuk deteksi objek.
- Model belajar dari contoh citra beranotasi.
- Penilaian utama adalah IoU, precision, recall, AP, dan mAP.

Jika mau, saya bisa menambahkan bagian khusus tentang konfigurasi training yang digunakan di proyek ini (mis. backbone, dataset config, dan parameter penting di file konfigurasi).