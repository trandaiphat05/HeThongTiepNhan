import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { FileText, Save } from 'lucide-react';
import { api } from '../../../../services/api';

/**
 * Soạn thảo trực tiếp nội dung tri thức pháp luật toàn hệ thống (Raw Markdown Editor)
 * 
 * @param {Object} props
 * @param {() => void} props.onSuccess - Callback sau khi cập nhật thành công
 * @param {(type: 'success' | 'warning', message: string) => void} props.onToast - Thông báo toast
 */
export default function RAGRawEditor({ onSuccess, onToast }) {
  const [ragText, setRagText] = useState(`## 1. LĨNH VỰC GIAO THÔNG VẬN TẢI (SO_GTVT)
### 1.1. Thẩm quyền quản lý hạ tầng giao thông đường bộ
- Quản lý, duy tu, bảo trì kết cấu hạ tầng giao thông đường bộ trên các tuyến Quốc lộ ủy thác (QL1A, QL51, QL20 qua địa bàn tỉnh) và các tuyến Đường tỉnh (ĐT.768, ĐT.769, ĐT.767, ĐT.765, ĐT.764, v.v.).
- Khắc phục hư hỏng mặt đường, dặm vá ổ gà, sụt lún mặt đường, sự cố cầu đường; xử lý các "điểm đen" và điểm tiềm ẩn tai nạn giao thông.
- Quản lý và vận hành hệ thống đèn tín hiệu giao thông, biển báo hiệu đường bộ, vạch kẻ đường, phân luồng giao thông chống ùn tắc.
- Quản lý hoạt động vận tải hành khách công cộng (xe buýt, xe khách tuyến cố định, taxi, xe hợp đồng) và kiểm soát tải trọng phương tiện đường bộ.

### 1.2. Căn cứ pháp lý viện dẫn lĩnh vực GTVT
- **Luật Giao thông đường bộ 2008 & Luật Đường bộ 2024**: Điều 37, 38 về tổ chức giao thông và bảo đảm an toàn giao thông kết cấu hạ tầng.
- **Nghị định số 11/2010/NĐ-CP & Nghị định số 100/2013/NĐ-CP**: Quy định về quản lý và bảo vệ kết cấu hạ tầng giao thông đường bộ.
- **Nghị định số 100/2019/NĐ-CP (sửa đổi bởi Nghị định 123/2021/NĐ-CP)**: Xử phạt vi phạm hành chính trong lĩnh vực giao thông đường bộ.

---

## 2. LĨNH VỰC TÀI NGUYÊN VÀ MÔI TRƯỜNG (SO_TNMT)
### 2.1. Thẩm quyền quản lý đất đai và môi trường
- Tiếp nhận, xử lý vi phạm về ô nhiễm môi trường không khí, mùi hôi nồng nặc phát tán từ khu công nghiệp (KCN Amata, KCN Biên Hòa 2, KCN Nhơn Trạch, KCN Loteco, KCN Giang Điền...).
- Kiểm soát và xử lý hành vi xả trộm nước thải công nghiệp, nước thải hóa chất chưa qua xử lý ra kênh rạch và lưu vực sông Đồng Nai, sông Buông, sông Thị Vải.
- Xử lý các điểm tập kết rác thải tự phát quy mô lớn gây ô nhiễm môi trường đất và nguồn nước ngầm.
- Quản lý nhà nước về đất đai: Thủ tục cấp Giấy chứng nhận quyền sử dụng đất (sổ đỏ), hành vi hủy hoại đất, chuyển mục đích sử dụng đất trái phép quy mô lớn, phân lô bán nền trái phép.
- Hoạt động khai thác khoáng sản trái phép (bơm hút cát lậu trên sông Đồng Nai, khai thác đá, đất san lấp trái phép).

### 2.2. Căn cứ pháp lý viện dẫn lĩnh vực TN&MT
- **Luật Bảo vệ Môi trường 2020**: Điều 6, Điều 8 về hành vi bị nghiêm cấm trong bảo vệ môi trường; Điều 162 về trách nhiệm tiếp nhận, xử lý phản ánh ô nhiễm.
- **Nghị định số 45/2022/NĐ-CP**: Xử phạt vi phạm hành chính trong lĩnh vực bảo vệ môi trường.
- **Luật Đất đai 2024**: Quy định về quản lý, cấp giấy chứng nhận quyền sử dụng đất, xử lý tranh chấp, lấn chiếm và chuyển mục đích trái phép.

---

## 3. LĨNH VỰC XÂY DỰNG VÀ QUY HOẠCH ĐÔ THỊ (SO_XD)
### 3.1. Thẩm quyền quản lý trật tự xây dựng và quy hoạch
- Cấp giấy phép xây dựng và kiểm tra, giám sát trật tự xây dựng đối với các công trình dự án lớn, công trình cấp I, cấp II, trung tâm thương mại, khu đô thị mới.
- Xử lý các dự án vi phạm chỉ giới xây dựng, xây sai giấy phép được cấp, xây dựng trái phép, cơi nới sai cốt cao độ gây ngập úng cho khu vực dân cư xung quanh.
- Quản lý quy hoạch hạ tầng kỹ thuật đô thị, quy hoạch hệ thống thoát nước chính của các đô thị (TP. Biên Hòa, TP. Long Khánh).
- Xử lý các công trình thi công gây nứt lún, đe dọa sập đổ nhà dân liền kề hoặc không đảm bảo an toàn lao động công trường.

### 3.2. Căn cứ pháp lý viện dẫn lĩnh vực Xây dựng
- **Luật Xây dựng 2014 (sửa đổi, bổ sung 2020)**: Điều 12 về các hành vi bị nghiêm cấm; Điều 89 về cấp giấy phép xây dựng.
- **Nghị định số 16/2022/NĐ-CP**: Xử phạt vi phạm hành chính về trật tự xây dựng.
- **Nghị định số 80/2014/NĐ-CP**: Về thoát nước và xử lý nước thải đô thị.

---

## 4. LĨNH VỰC Y TẾ, KHÁM CHỮA BỆNH & AN TOÀN THỰC PHẨM (SO_YTE)
### 4.1. Thẩm quyền quản lý y tế và vệ sinh an toàn thực phẩm
- Quản lý bệnh viện đa khoa, trung tâm y tế, trạm y tế phường/xã, cơ sở khám chữa bệnh tư nhân, phòng khám đa khoa, phòng nha, nhà thuốc trên địa bàn tỉnh.
- Kiểm tra, xử lý ngộ độc thực phẩm tập thể tại các bếp ăn trường học, bếp ăn khu công nghiệp, cơ sở chế biến thực phẩm, suất ăn sẵn.
- Giám sát phòng chống dịch bệnh truyền nhiễm (sốt xuất huyết, tay chân miệng, cúm gia cầm), vệ sinh môi trường phòng dịch.
- Giải quyết phản ánh về thái độ phục vụ của nhân viên y tế, viện phí, thanh toán bảo hiểm y tế khám chữa bệnh.

### 4.2. Căn cứ pháp lý viện dẫn lĩnh vực Y tế
- **Luật Khám bệnh, chữa bệnh 2023**: Quy định về quyền, nghĩa vụ người bệnh, đạo đức nghề nghiệp và điều kiện hành nghề y.
- **Luật An toàn thực phẩm 2010**: Điều 5, 6 về điều kiện bảo đảm an toàn thực phẩm, xử lý sự cố ngộ độc thực phẩm.
- **Nghị định số 115/2018/NĐ-CP**: Xử phạt vi phạm hành chính về an toàn thực phẩm.

---

## 5. LĨNH VỰC GIÁO DỤC VÀ ĐÀO TẠO (SO_GDDT)
### 5.1. Thẩm quyền quản lý giáo dục và trường học
- Quản lý các cơ sở giáo dục từ mầm non, tiểu học, trung học cơ sở, trung học phổ thông, trung tâm giáo dục thường xuyên.
- Xử lý các phản ánh về thu chi học phí không đúng quy định, tình trạng lạm thu đầu năm học, tiền đóng góp xã hội hóa sai quy chế.
- Giải quyết khiếu nại về tuyển sinh đầu cấp, chuyển trường, phân tuyến học sinh, chất lượng cơ sở vật chất lớp học.
- Thanh tra, xử lý các vụ việc bạo lực học đường, xâm phạm thân thể học sinh, vi phạm đạo đức nhà giáo.

### 5.2. Căn cứ pháp lý viện dẫn lĩnh vực Giáo dục
- **Luật Giáo dục 2019**: Điều 22 về các hành vi bị nghiêm cấm trong cơ sở giáo dục; Điều 99 về học phí và các khoản thu.
- **Nghị định số 04/2021/NĐ-CP**: Xử phạt vi phạm hành chính trong lĩnh vực giáo dục.

---

## 6. LĨNH VỰC LAO ĐỘNG - THƯƠNG BINH VÀ XÃ HỘI (SO_LDTBXH)
### 6.1. Thẩm quyền quản lý lao động và chính sách an sinh xã hội
- Quản lý việc thực thi pháp luật lao động, giải quyết tranh chấp lao động tập thể, quyền lợi công nhân tại các doanh nghiệp trong và ngoài KCN.
- Xử lý tình trạng công ty chậm trả lương, nợ lương kéo dài, trốn đóng hoặc nợ bảo hiểm xã hội, bảo hiểm y tế của người lao động.
- Giải quyết chế độ trợ cấp người có công với cách mạng, gia đình chính sách, chế độ thương binh, liệt sĩ.
- Quản lý công tác bảo trợ xã hội, trợ cấp người cao tuổi, người khuyết tật, trẻ em có hoàn cảnh đặc biệt khó khăn.

### 6.2. Căn cứ pháp lý viện dẫn lĩnh vực Lao động & Xã hội
- **Bộ luật Lao động 2019**: Điều 94, 97 về nguyên tắc và kỳ hạn trả lương; Điều 179 về giải quyết tranh chấp lao động.
- **Luật Bảo hiểm xã hội 2014 / 2024**: Quy định về quyền tham gia và thụ hưởng BHXH, xử lý hành vi chậm đóng, trốn đóng BHXH.
- **Nghị định số 12/2022/NĐ-CP**: Xử phạt vi phạm hành chính trong lĩnh vực lao động, BHXH.

---

## 7. LĨNH VỰC AN NINH TRẬT TỰ & AN TOÀN XÃ HỘI (CONG_AN_TINH)
### 7.1. Thẩm quyền của Công an Tỉnh Đồng Nai
- Tiếp nhận và xử lý tin báo, phản ánh về tội phạm hình sự, trộm cắp tài sản, cướp giật, lừa đảo chiếm đoạt tài sản qua mạng viễn thông/Internet.
- Xử lý các vụ việc tụ tập đua xe trái phép, lạng lách đánh võng, thanh thiếu niên mang hung khí gây rối trật tự công cộng.
- Đảm bảo an toàn phòng cháy chữa cháy và cứu nạn cứu hộ (PCCC & CNCH) tại các cơ sở kinh doanh, chung cư, nhà xưởng sản xuất.
- Đăng ký, quản lý cư trú, cấp thẻ Căn cước công dân/Căn cước, quản lý ngành nghề kinh doanh có điều kiện.

### 7.2. Căn cứ pháp lý viện dẫn lĩnh vực An ninh Trật tự
- **Bộ luật Hình sự 2015 (sửa đổi, bổ sung 2017)**: Quy định về các tội phạm xâm phạm trật tự công cộng và sở hữu tài sản.
- **Nghị định số 144/2021/NĐ-CP**: Xử phạt vi phạm hành chính trong lĩnh vực an ninh, trật tự, an toàn xã hội, PCCC.
- **Luật Cư trú 2020 & Luật Căn cước 2023**: Quy định về đăng ký thường trú, tạm trú và thông tin dữ liệu dân cư.

---

## 8. LĨNH VỰC TIẾP CÔNG DÂN & THỦ TỤC HÀNH CHÍNH (UBND_CAP_HUYEN)
### 8.1. Thẩm quyền Ban Tiếp công dân Tỉnh và UBND Cấp Huyện/TP
- Tiếp nhận, giải quyết và trả kết quả thủ tục hành chính tại Ban Tiếp công dân Tỉnh và UBND cấp huyện/xã.
- Xử lý khiếu nại về chậm trễ giải quyết hồ sơ hành chính, thái độ sách nhiễu của cán bộ tiếp nhận hồ sơ, yêu cầu bổ sung giấy tờ ngoài quy định.
- Hòa giải tranh chấp dân sự nhỏ lẻ tại cơ sở, ranh giới đất đai gia đình, lối đi chung chưa khởi kiện ra Tòa án.
- Quản lý trật tự đô thị địa phương: Tiếng ồn hát karaoke sau 22h, buôn bán hàng rong lấn chiếm vỉa hè, rác thải ngõ xóm thuộc cấp xã/phường.

### 8.2. Căn cứ pháp lý viện dẫn lĩnh vực Tiếp công dân & Địa phương
- **Nghị định số 61/2018/NĐ-CP & Nghị định số 107/2021/NĐ-CP**: Về cơ chế liên thông, giải quyết TTHC và Tiếp công dân.
- **Luật Khiếu nại 2011 & Luật Tố cáo 2018**: Trình tự, thủ tục giải quyết khiếu nại, tố cáo hành chính tại cấp huyện, xã.
- **Luật Tổ chức chính quyền địa phương 2015 (sửa đổi 2019)**: Nhiệm vụ, quyền hạn của UBND cấp huyện, thành phố và cấp xã.

---

## 9. ĐIỀU PHỐI NGOẠI LỆ & DUYỆT THỦ CÔNG (REQUIRE_HUMAN_REVIEW)
### 9.1. Quy trình xử lý hồ sơ ngoại lệ
- Áp dụng cho các hồ sơ đơn thư phức tạp có sự giao thoa thẩm quyền giữa nhiều cơ quan chuyên trách mà AI chưa thể phân định rõ ràng.
- Đơn thư phản ánh nội dung tiêu cực, nặc danh, thiếu thông tin chứng cứ xác thực, hoặc có dấu hiệu khiếu kiện vượt cấp kéo dài.
- Hồ sơ có độ tin cậy AI phân loại (confidence_score) dưới ngưỡng 0.65 cần Tổ Tiếp nhận & Điều phối Đơn thư Tỉnh trực tiếp phân công.

### 9.2. Căn cứ điều phối
- **Quy chế làm việc của UBND tỉnh Đồng Nai**: Về phân công trách nhiệm giữa các Sở, Ban, Ngành và UBND cấp huyện.
- **Luật Tiếp công dân 2013**: Trách nhiệm tiếp nhận, phân loại và chuyển đơn khiếu nại, tố cáo, kiến nghị, phản ánh.`);

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.updateRAGKnowledge(ragText);
      if (onToast) {
        onToast('success', 'Cập nhật kho văn bản luật thành công! Hệ thống đã tự động đồng bộ căn cứ mới.');
      }
      if (onSuccess) onSuccess();
    } catch (err) {
      alert('Lỗi lưu kho luật: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-3.5 bg-slate-50/70 p-4 sm:p-5 rounded-xl border border-slate-200/80">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-2.5">
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-gov-blue" />
            Soạn Thảo Trực Tiếp Nội Dung Quy Định:
          </label>
          <span className="text-[11px] text-slate-400">
            Độ dài: {ragText.length} ký tự
          </span>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="gov-btn-primary text-xs py-1.5 px-4 font-semibold shadow-xs flex items-center gap-1.5"
        >
          <Save className="w-3.5 h-3.5 text-amber-300" />
          <span>{isSaving ? 'Đang Cập Nhật...' : 'Lưu Thay Đổi'}</span>
        </button>
      </div>

      <textarea
        rows={12}
        value={ragText}
        onChange={(e) => setRagText(e.target.value)}
        className="gov-input font-mono text-xs leading-relaxed p-3.5 bg-white focus:bg-white"
        placeholder="Nhập nội dung quy định, nghị quyết pháp luật của tỉnh Đồng Nai..."
      />
    </div>
  );
}

RAGRawEditor.propTypes = {
  onSuccess: PropTypes.func,
  onToast: PropTypes.func,
};

