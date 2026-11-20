/**
 * ============================================================================
 * VICO LFC MANAGER - GOOGLE APPS SCRIPT BACKEND (GOOGLE SHEETS + GOOGLE DRIVE)
 * ============================================================================
 * HƯỚNG DẪN CÀI ĐẶT (CHỈ MẤT 1 PHÚT):
 * 1. Mở file Google Sheet của phòng Kỹ thuật / QC công ty.
 * 2. Trên thanh menu, chọn: Tiện ích mở rộng (Extensions) -> Apps Script.
 * 3. Xóa mã mặc định và dán toàn bộ mã này vào file Code.gs -> Nhấn Lưu (Ctrl+S).
 * 4. Nhấn nút "Triển khai" (Deploy) ở góc phải trên -> "Tùy chọn triển khai mới" (New deployment).
 * 5. Chọn loại: "Ứng dụng web" (Web app):
 *    - Thực thi dưới dạng (Execute as): Tôi (Me)
 *    - Ai có quyền truy cập (Who has access): Bất kỳ ai (Anyone)
 * 6. Nhấn "Triển khai" (Deploy), cấp quyền truy cập Google Sheets & Google Drive.
 * 7. Copy đường link "Web App URL" (có đuôi /exec) dán vào mục [⚙️ Admin] trên Web App điện thoại.
 * ============================================================================
 */

const ROOT_DRIVE_FOLDER_NAME = 'Du_an_thi_nghiem';

function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'getCatalogs';
  try {
    if (action === 'getCatalogs') {
      return jsonResponse({
        ok: true,
        products: getOrInitProductsSheet(),
        defects: getOrInitDefectsSheet()
      });
    }
    return jsonResponse({ ok: true, message: 'VICO LFC Backend is active.' });
  } catch (err) {
    return jsonResponse({ ok: false, error: err.toString() });
  }
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const action = body.action;

    if (action === 'saveProducts') {
      saveProductsToSheet(body.products || []);
      return jsonResponse({ ok: true, message: 'Đã cập nhật Danh sách Sản phẩm lên Google Sheet!' });
    }

    if (action === 'saveDefects') {
      saveDefectsToSheet(body.defects || []);
      return jsonResponse({ ok: true, message: 'Đã cập nhật Danh mục Khuyết tật lên Google Sheet!' });
    }

    if (action === 'uploadPhoto') {
      const result = saveImageToDriveHierarchy(body);
      return jsonResponse({ ok: true, ...result });
    }

    if (action === 'syncReport') {
      syncRecordsToBmDaiSheet(body.records || []);
      return jsonResponse({ ok: true, message: 'Đã đồng bộ dữ liệu báo cáo 03-BM ĐẠI lên Google Sheet!' });
    }

    return jsonResponse({ ok: false, error: 'Unknown action: ' + action });
  } catch (err) {
    return jsonResponse({ ok: false, error: err.toString() });
  }
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// 1. QUẢN LÝ SHEET DANH MỤC SẢN PHẨM CHUẨN (DS_SAN_PHAM)
function getOrInitProductsSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let ws = ss.getSheetByName('DS_SAN_PHAM');
  if (!ws) {
    ws = ss.insertSheet('DS_SAN_PHAM');
    ws.appendRow(['Ma_Dong_SP', 'Ten_San_Pham_Chuan', 'Khoi_Luong_Thep_kg', 'Khach_Hang', 'Ghi_Chu']);
    const defaults = [
      ['SP-01', 'ISHIZUE 267-700', 165, 'ISHIZUE', 'Cánh xoắn LFC 165kg'],
      ['SP-02', 'ISHIZUE 267-800', 260, 'ISHIZUE', 'Cánh xoắn LFC 260kg'],
      ['SP-03', 'ISHIZUE 267-600', 135, 'ISHIZUE', 'Cánh xoắn LFC 135kg'],
      ['SP-04', 'CÁNH XOẮN CHẾ THỬ VICO-900', 310, 'VICO R&D', 'Sản phẩm chế thử mới']
    ];
    defaults.forEach(r => ws.appendRow(r));
  }
  const data = ws.getDataRange().getValues();
  const list = [];
  for (let i = 1; i < data.length; i++) {
    if (data[i][1]) {
      list.push({
        code: String(data[i][0] || ('SP-' + i)),
        name: String(data[i][1]).trim(),
        weight: Number(data[i][2]) || 165,
        customer: String(data[i][3] || ''),
        note: String(data[i][4] || '')
      });
    }
  }
  return list;
}

function saveProductsToSheet(products) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let ws = ss.getSheetByName('DS_SAN_PHAM');
  if (!ws) ws = ss.insertSheet('DS_SAN_PHAM');
  ws.clearContents();
  ws.appendRow(['Ma_Dong_SP', 'Ten_San_Pham_Chuan', 'Khoi_Luong_Thep_kg', 'Khach_Hang', 'Ghi_Chu']);
  products.forEach((p, idx) => {
    ws.appendRow([p.code || ('SP-' + (idx + 1)), p.name, Number(p.weight) || 165, p.customer || '', p.note || '']);
  });
}

// 2. QUẢN LÝ SHEET DANH MỤC LỖI / KHUYẾT TẬT (DS_LOI)
function getOrInitDefectsSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let ws = ss.getSheetByName('DS_LOI');
  if (!ws) {
    ws = ss.insertSheet('DS_LOI');
    ws.appendRow(['ID_Loi', 'Ten_Khuyet_Tat', 'Nhom_Loi', 'Co_Dem_So_Vet', 'Tieu_Chi_Thang_Diem_10']);
    const defList = [
      ['1', 'Rỗ khí', 'Khuyết tật lỗ rỗ', 'CO', '10: Không lỗi | 8-9: 1-2 vết nhỏ <1.5mm | 6-7: 3-5 vết nông | 4-5: Nhiều vết sâu | 0-3: Rỗ tổ ong'],
      ['2', 'Rỗ tạp chất', 'Khuyết tật lỗ rỗ', 'CO', '10: Sạch | 8-9: 1-2 vết nhẹ chân đậu/đỉnh cánh | 6-7: 3-5 vết vừa | 4-5: Rỗ tạp chất nặng | 0-3: Mục cánh'],
      ['3', 'Rỗ khí và tạp chất', 'Khuyết tật lỗ rỗ', 'KHONG', '10: Không lỗi | 8-9: Rất nhẹ | 6-7: Trung bình | 4-5: Nặng | 0-3: Phế phẩm'],
      ['4', 'Rỗ co ngót', 'Khuyết tật lỗ rỗ', 'KHONG', '10: Đặc chắc | 8-9: Lõm nhẹ chân đậu | 6-7: Co cục bộ nông | 4-5: Hốc co sâu nút nhiệt | 0-3: Xuyên tâm'],
      ['5', 'Sập khuôn', 'Khuôn & Điền đầy', 'KHONG', '10: Nguyên vẹn | 8-9: Sập cát nhỏ mép rãnh | 6-7: Sập nhẹ góc phụ | 4-5: Biến dạng cánh | 0-3: Sập hỏng phôi'],
      ['6', 'Phình khuôn (Đùn thép ống)', 'Khuôn & Điền đầy', 'KHONG', '10: Phẳng chuẩn | 8-9: Bavia nhẹ miệng ống | 6-7: Đùn thép cục bộ lòng ống | 4-5: Đùn cục lớn | 0-3: Biến dạng ống'],
      ['7', 'Cháy cát, thấm thép', 'Khuyết tật bề mặt', 'KHONG', '10: Sạch bóng | 8-9: Cháy bám cát nhẹ, gõ bong | 6-7: Cháy bám vừa | 4-5: Cháy thấm thép nặng cổ đậu/ống | 0-3: Bít ống'],
      ['8', 'Cong cánh', 'Khuyết tật hình học', 'KHONG', '10: Phẳng chuẩn | 8-9: Độ đảo <1.5mm | 6-7: Cong nhẹ 1.5-3mm | 4-5: Cong 3-6mm | 0-3: Biến dạng >6mm'],
      ['9', 'Không điền đầy', 'Khuôn & Điền đầy', 'KHONG', '10: Điền đầy 100% | 8-9: Tù nhẹ mép <2mm | 6-7: Thiếu hụt 2-5mm | 4-5: Khuyết 5-15mm | 0-3: Thiếu hụt lớn'],
      ['10', 'Lệch ống trụ', 'Khuyết tật hình học', 'KHONG', '10: Đồng tâm | 8-9: Lệch <1mm | 6-7: Lệch 1-2.5mm | 4-5: Lệch 2.5-4mm | 0-3: Lệch >4mm'],
      ['11', 'Sai lệch kích thước', 'Khuyết tật hình học', 'KHONG', '10: Chuẩn bản vẽ | 8-9: Sát biên dung sai | 6-7: Vượt nhẹ kích thước phụ | 4-5: Phải hàn bù | 0-3: Hỏng kích thước'],
      ['12', 'Nứt (Nứt sơn / Nứt thép)', 'Bề mặt & Kết cấu', 'KHONG', '10: Không nứt | 8-9: Nứt sơn nhẹ bề mặt cánh | 6-7: Nứt sơn nhiều vị trí | 4-5: Nứt nóng nông | 0-3: Nứt gãy sâu'],
      ['13', 'Nhăn khớp', 'Khuyết tật bề mặt', 'KHONG', '10: Khớp mịn | 8-9: Lộ chỉ dán mẫu nhẹ | 6-7: Rãnh nhăn <1.5mm | 4-5: Giáp mối lạnh sâu | 0-3: Không ngấu'],
      ['14', 'Gãy lưỡi cắt', 'Khuyết tật kết cấu', 'KHONG', '10: Nguyên vẹn | 8-9: Mẻ nhẹ <2mm | 6-7: Sứt cục bộ 2-5mm | 4-5: Gãy đoạn 5-15mm | 0-3: Gãy mảng lớn'],
      ['15', 'Bề mặt thô sần', 'Khuyết tật bề mặt', 'KHONG', '10: Láng mịn | 8-9: Sần nhẹ 1-2 điểm gần rãnh dẫn | 6-7: Sần bề mặt vùng đối diện đậu | 4-5: Sần sùi nặng | 0-3: Biến dạng bề mặt']
    ];
    defList.forEach(r => ws.appendRow(r));
  }
  const data = ws.getDataRange().getValues();
  const list = [];
  for (let i = 1; i < data.length; i++) {
    if (data[i][1]) {
      list.push({
        id: String(data[i][0] || i),
        name: String(data[i][1]).trim(),
        group: String(data[i][2] || 'Khuyết tật đúc'),
        has_spots: String(data[i][3] || '').toUpperCase() === 'CO',
        criteria: String(data[i][4] || '')
      });
    }
  }
  return list;
}

function saveDefectsToSheet(defects) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let ws = ss.getSheetByName('DS_LOI');
  if (!ws) ws = ss.insertSheet('DS_LOI');
  ws.clearContents();
  ws.appendRow(['ID_Loi', 'Ten_Khuyet_Tat', 'Nhom_Loi', 'Co_Dem_So_Vet', 'Tieu_Chi_Thang_Diem_10']);
  defects.forEach((d, idx) => {
    ws.appendRow([d.id || String(idx + 1), d.name, d.group || '', d.has_spots ? 'CO' : 'KHONG', d.criteria || '']);
  });
}

// 3. TỰ ĐỘNG TẠO THƯ MỤC PHÂN CẤP TRÊN GOOGLE DRIVE & LƯU ẢNH KHUYẾT TẬT
// Cấu trúc: Du_an_thi_nghiem > Tên SP > Mã thí nghiệm > Ngày thí nghiệm dd-mm-yyyy
function getOrCreateSubFolder(parentFolder, folderName) {
  const cleanName = String(folderName || 'Khac').trim();
  const iter = parentFolder.getFoldersByName(cleanName);
  if (iter.hasNext()) return iter.next();
  const created = parentFolder.createFolder(cleanName);
  try {
    created.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (e) {}
  return created;
}

function saveImageToDriveHierarchy(body) {
  const productName = body.productName || 'San_Pham_Chua_Ro';
  const expCode = body.expCode || 'Ma_TN';
  const dateStr = body.dateStr || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd-MM-yyyy');
  const defectName = body.defectName || 'Danh_Gia';
  const score = body.score !== undefined ? body.score : 10;
  const base64Data = body.base64Data.replace(/^data:image\/\w+;base64,/, '');

  // Tìm hoặc tạo thư mục gốc: Du_an_thi_nghiem
  let rootIter = DriveApp.getFoldersByName(ROOT_DRIVE_FOLDER_NAME);
  let rootFolder = rootIter.hasNext() ? rootIter.next() : DriveApp.createFolder(ROOT_DRIVE_FOLDER_NAME);
  try {
    rootFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (e) {}

  // Cấp 2: Tên SP
  const spFolder = getOrCreateSubFolder(rootFolder, productName);
  // Cấp 3: Mã thí nghiệm
  const codeFolder = getOrCreateSubFolder(spFolder, expCode);
  // Cấp 4: Ngày thí nghiệm dd-mm-yyyy
  const dateFolder = getOrCreateSubFolder(codeFolder, dateStr);

  const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'HHmmss');
  const fileName = `${expCode}_${defectName.replace(/\s+/g, '_')}_${score}d_${timestamp}.jpg`;
  const blob = Utilities.newBlob(Utilities.base64Decode(base64Data), 'image/jpeg', fileName);
  const file = dateFolder.createFile(blob);
  try {
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (e) {}

  const fileId = file.getId();
  const fileUrl = file.getUrl();
  const directLink = `https://drive.google.com/uc?export=view&id=${fileId}`;
  const folderPath = `${ROOT_DRIVE_FOLDER_NAME} > ${productName} > ${expCode} > ${dateStr}`;

  // Ghi log vào sheet LOG_ANH_KHUYET_TAT
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let wsLog = ss.getSheetByName('LOG_ANH_KHUYET_TAT');
  if (!wsLog) {
    wsLog = ss.insertSheet('LOG_ANH_KHUYET_TAT');
    wsLog.appendRow(['Thoi_Gian', 'Ten_San_Pham', 'Ma_Thi_Nghiem', 'Ngay_TN', 'Loai_Loi', 'Diem_10', 'Thu_Muc_Drive', 'Link_Anh_Truc_Tiep']);
  }
  wsLog.appendRow([new Date(), productName, expCode, dateStr, defectName, score, folderPath, fileUrl]);

  return {
    fileId: fileId,
    fileName: fileName,
    fileUrl: fileUrl,
    directLink: directLink,
    folderUrl: dateFolder.getUrl(),
    folderPath: folderPath
  };
}

// 4. ĐỒNG BỘ BÁO CÁO CHUẨN '03-BM ĐẠI' LÊN GOOGLE SHEET
function syncRecordsToBmDaiSheet(records) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let ws = ss.getSheetByName('03-BM ĐẠI');
  if (!ws) ws = ss.insertSheet('03-BM ĐẠI');
  ws.clearContents();
  ws.appendRow([
    'Lượt rót', 'Thùng chèn', 'Thứ tự rót', 'Mã sp', 'Sản phẩm',
    'Công nghệ rót', 'Nhiệt độ', 'Áp hút (bar)', 'Khối lượng (kg)',
    'Thời gian rót (giây)', 'Tốc độ rót (kg/s)', 'Hiện tượng bất thường'
  ]);
  records.forEach(r => {
    ws.appendRow([
      r.luot_rot || '', r.thung_so || '', r.thu_tu_rot || '', r.ma_sp || '',
      r.san_pham || '', r.huong_rot || r.cong_nghe || '', r.nhiet_dau || '',
      r.ap_hut_raw || `${r.ap_dau}-${r.ap_cuoi}`, r.khoi_luong || '',
      r.thoi_gian_rot || '', r.toc_do_rot || '', r.hien_tuong_rot || ''
    ]);
  });
}
