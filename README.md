# VICO LFC Manager — Hệ Thống Điều Độ & Phân Tích Công Nghệ Đúc Lost-Foam (LFC)

Ứng dụng Web và Sổ tay Excel chuẩn hóa dành cho **Kỹ thuật viên (KTV) trực đúc** và **Kỹ sư QC** tại xưởng đúc Lost-Foam (LFC):
- 🌐 **Giao diện Web App trực tuyến (GitHub Pages)**: [https://h2o86.github.io/vico-lfc-manager/](https://h2o86.github.io/vico-lfc-manager/)
- 📊 **Sổ tay Excel tự động hóa (5 Sheet công thức)**: `He_Thong_Quan_Ly_Duc_LFC_VICO.xlsx`

---

## Tính năng chính

1. **Điều độ Kéo - Thả (Drag & Drop) Chùm Sản Phẩm vào Thùng Chân Không**:
   - Tập kết chùm sản phẩm từ buồng sấy và kéo thả trực quan vào các Thùng chân không (`Thùng CK 01` .. `Thùng CK 08`).
   - Gắn từng sản phẩm với số hiệu thùng và dải áp suất hút chân không (`Áp đầu – Áp cuối`, bar).
2. **Xâu Chuỗi Lượt Rót (Nồi Thép) & Nội Suy Giảm Nhiệt Tuyến Tính Tự Động**:
   - Cho phép một nồi nước thép di chuyển linh hoạt qua lại giữa nhiều thùng chân không.
   - Chỉ cần ghi nhận **Nhiệt độ đầu lượt rót ($T_{\text{đầu}}$)** và **Nhiệt độ cuối lượt rót ($T_{\text{cuối}}$)**, hệ thống tự động tính toán tốc độ giảm nhiệt và **nội suy tuyến tính nhiệt độ rót** cho toàn bộ các sản phẩm ở giữa lượt rót.
   - Tự động tính **Tốc độ rót thép ($\text{kg/s}$)** = $\text{Khối lượng thép} / \text{Thời gian rót video}$.
3. **Truy Vấn Hồ Sơ Công Nghệ Theo Mã Sản Phẩm (`11A`, `13A`, `1D`...)**:
   - Click vào bất kỳ mã sản phẩm nào để xem toàn bộ lịch sử công nghệ đúc, diễn biến video, ghi chú sau bắn bi (`Mặt lưỡi cắt MLC` & `Mặt đậu MĐ`) và điểm chất lượng.
4. **Đánh Giá 15 Danh Mục Khuyết Tật (Thang Điểm 0 – 10) & Phân Tích Tương Quan**:
   - Chấm điểm 15 loại khuyết tật kèm bảng tiêu chí chuẩn (Rubric 0–10 điểm) và số vết (*Rỗ khí*, *Rỗ tạp chất*).
   - Tự động phân tích tác động của từng mức chỉ số công nghệ (**Công nghệ Rót đùn vs Rót trực tiếp**, **Vùng Nhiệt độ rót đã nội suy**, **Tốc độ rót**, **Áp suất chân không**) lên từng loại khuyết tật.
