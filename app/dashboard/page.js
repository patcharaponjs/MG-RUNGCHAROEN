"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "../../lib/supabase";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import * as XLSX from "xlsx";
import { QRCodeCanvas } from "qrcode.react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
);

export default function DashboardPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ตัวกรองข้อมูล
  const [searchTerm, setSearchTerm] = useState("");
  const [serviceFilter, setServiceFilter] = useState("ทั้งหมด");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // รายละเอียดผลประเมิน
  const [selectedFeedback, setSelectedFeedback] = useState(null);

  // QR Code สำหรับลูกค้า
  const [qrService, setQrService] = useState("ซ่อมบำรุงรถยนต์");
  const qrCanvasRef = useRef(null);

  useEffect(() => {
    let active = true;

    const checkUser = async () => {
      const { data: result } = await supabase.auth.getUser();

      if (!active) return;

      if (result.user) {
        setUser(result.user);
        await loadFeedback();
      } else {
        setLoading(false);
      }
    };

    checkUser();

    return () => {
      active = false;
    };
  }, []);

async function loadFeedback() {
  setLoading(true);
  setError("");

  const { data: result, error } = await supabase
    .from("customer_feedback")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    setError("ไม่สามารถโหลดข้อมูลได้: " + error.message);
    setData([]);
  } else {
    setData(result || []);
  }

  setLoading(false);
}

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data: result, error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (error) {
      setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      setLoading(false);
      return;
    }

    setUser(result.user);
    await loadFeedback();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setData([]);
  };

  // คำนวณคะแนนเฉลี่ย
  const average = (key) => {
    if (data.length === 0) return "0.00";

    const total = data.reduce(
      (sum, item) => sum + Number(item[key] || 0),
      0
    );

    return (total / data.length).toFixed(2);
  };

  // แปลงวันที่เป็น YYYY-MM-DD ตามเวลาท้องถิ่น
  const getLocalDate = (value) => {
    const date = new Date(value);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  // ประเภทบริการทั้งหมดที่มีในระบบ
  const serviceOptions = [
    ...new Set(data.map((item) => item.service).filter(Boolean)),
  ];

  // ค้นหาและกรองข้อมูล
  const filteredData = data.filter((item) => {
    const search = searchTerm.trim().toLowerCase();

    const matchSearch =
      !search ||
      (item.service || "").toLowerCase().includes(search) ||
      (item.comment || "").toLowerCase().includes(search);

    const matchService =
      serviceFilter === "ทั้งหมด" ||
      item.service === serviceFilter;

    const itemDate = item.created_at
      ? getLocalDate(item.created_at)
      : "";

    const matchDateFrom =
      !dateFrom || itemDate >= dateFrom;

    const matchDateTo =
      !dateTo || itemDate <= dateTo;

    return (
      matchSearch &&
      matchService &&
      matchDateFrom &&
      matchDateTo
    );
  });
  // ส่งออกผลประเมินเป็น Excel
const exportExcel = () => {
  if (filteredData.length === 0) {
    alert("ไม่มีข้อมูลสำหรับส่งออก");
    return;
  }

  const excelData = filteredData.map((item, index) => ({
    ลำดับ: index + 1,
    วันที่ประเมิน: new Date(item.created_at).toLocaleString("th-TH"),
    ประเภทบริการ: item.service,
    คะแนนพนักงาน: item.staff_rating,
    คะแนนความรวดเร็ว: item.speed_rating,
    คะแนนคุณภาพบริการ: item.quality_rating,
    คะแนนความสะอาด: item.cleanliness_rating,
    คะแนนความพึงพอใจโดยรวม: item.overall_rating,
    ความคิดเห็น: item.comment || "-",
  }));

  const worksheet = XLSX.utils.json_to_sheet(excelData);

  worksheet["!cols"] = [
    { wch: 10 },
    { wch: 22 },
    { wch: 25 },
    { wch: 16 },
    { wch: 18 },
    { wch: 20 },
    { wch: 18 },
    { wch: 25 },
    { wch: 40 },
  ];

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    "ผลประเมินลูกค้า"
  );

  const fileName = `MG_Customer_Feedback_${new Date()
    .toISOString()
    .slice(0, 10)}.xlsx`;

  XLSX.writeFile(workbook, fileName);
};

// ดาวน์โหลด QR Code เป็นรูปภาพ PNG
const downloadQRCode = () => {
  const canvas = qrCanvasRef.current;

  if (!canvas) {
    alert("ไม่พบ QR Code กรุณากรอกประเภทบริการก่อน");
    return;
  }

  const imageUrl = canvas.toDataURL("image/png");
  const link = document.createElement("a");
  link.href = imageUrl;
  link.download = `MG_QR_${qrService.trim() || "service"}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// พิมพ์ QR Code
const printQRCode = () => {
  const canvas = qrCanvasRef.current;

  if (!canvas) {
    alert("ไม่พบ QR Code กรุณากรอกประเภทบริการก่อน");
    return;
  }

  const printWindow = window.open("", "_blank", "width=700,height=800");

  if (!printWindow) {
    alert("กรุณาอนุญาตให้เว็บไซต์เปิดหน้าต่างใหม่");
    return;
  }

  const imageUrl = canvas.toDataURL("image/png");
  const heading = printWindow.document.createElement("h2");
  heading.textContent = "MG CUSTOMER FEEDBACK";

  const serviceHeading = printWindow.document.createElement("h3");
  serviceHeading.textContent = qrService.trim();

  const description = printWindow.document.createElement("p");
  description.textContent = "สแกน QR Code เพื่อประเมินบริการ";

  const image = printWindow.document.createElement("img");
  image.alt = `QR Code ${qrService}`;
  image.style.width = "300px";
  image.style.height = "300px";
  image.style.imageRendering = "pixelated";

  printWindow.document.title = "MG QR Code";
  printWindow.document.body.style.cssText =
    "font-family:Arial,sans-serif;text-align:center;padding:40px;color:#111;";

  printWindow.document.body.append(
    heading,
    serviceHeading,
    description,
    image
  );

  image.onload = () => {
    printWindow.focus();
    printWindow.print();
  };
  image.src = imageUrl;
};

  // ข้อมูลกราฟ
  const chartData = {
    labels: [
      "พนักงาน",
      "ความรวดเร็ว",
      "คุณภาพบริการ",
      "ความสะอาด",
      "ภาพรวม",
    ],
    datasets: [
      {
        label: "คะแนนเฉลี่ย",
        data: [
          Number(average("staff_rating")),
          Number(average("speed_rating")),
          Number(average("quality_rating")),
          Number(average("cleanliness_rating")),
          Number(average("overall_rating")),
        ],
        backgroundColor: "#dc2626",
        borderRadius: 8,
      },
    ],
  };

  // จำนวนการประเมินตามประเภทบริการ
  const serviceCounts = data.reduce((result, item) => {
    result[item.service] = (result[item.service] || 0) + 1;
    return result;
  }, {});
// สร้างลิงก์สำหรับ QR Code
const surveyUrl =
  typeof window !== "undefined"
    ? `${window.location.origin}/survey?service=${encodeURIComponent(qrService)}`
    : "";

  // หน้าเข้าสู่ระบบ
  if (!user) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center p-5">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <h1 className="text-2xl font-bold text-red-600 text-center">
            MG CUSTOMER FEEDBACK
          </h1>

          <h2 className="text-xl font-bold text-gray-800 text-center mt-6">
            เข้าสู่ระบบผู้ดูแล
          </h2>

          <p className="text-gray-500 text-center mt-2 mb-7">
            สำหรับพนักงานและผู้ดูแลระบบ MG
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block font-semibold text-gray-700 mb-2">
                อีเมล
              </label>

              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border rounded-lg p-3 text-gray-800"
                placeholder="กรอกอีเมล"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-2">
                รหัสผ่าน
              </label>

              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border rounded-lg p-3 text-gray-800"
                placeholder="กรอกรหัสผ่าน"
              />
            </div>

            {error && (
              <p className="text-red-600 text-sm">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-bold py-3 rounded-lg"
            >
              {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
            </button>
          </form>

          <button
            type="button"
            onClick={() => (window.location.href = "/")}
            className="w-full mt-4 bg-gray-200 py-3 rounded-lg text-gray-700"
          >
            กลับหน้าแรก
          </button>
        </div>
      </main>
    );
  }

  // หน้า Dashboard
  return (
    <main className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-red-600 text-white p-5 shadow">
        <div className="max-w-7xl mx-auto flex justify-between items-center gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-bold">
              MG CUSTOMER FEEDBACK
            </h1>

            <p className="text-sm text-red-100">
              Admin Dashboard
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="bg-white text-red-600 px-4 py-2 rounded-lg font-semibold"
          >
            ออกจากระบบ
          </button>
        </div>
      </header>

      <section className="max-w-7xl mx-auto p-5 md:p-8">
        {/* หัวข้อ */}
        <div className="flex flex-wrap justify-between items-center gap-3 mb-7">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              ภาพรวมผลประเมินลูกค้า
            </h2>

            <p className="text-gray-500 mt-1">
              ยินดีต้อนรับ {user.email}
            </p>
          </div>

          <button
            type="button"
            onClick={loadFeedback}
            className="bg-white border px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            ↻ รีเฟรชข้อมูล
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-5">
            {error}
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-xl p-10 text-center text-gray-500">
            กำลังโหลดข้อมูล...
          </div>
        ) : (
          <>
            {/* การ์ดสถิติ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-7">
              <div className="bg-white rounded-xl shadow p-6">
                <p className="text-gray-500">
                  จำนวนผู้ประเมินทั้งหมด
                </p>

                <h3 className="text-4xl font-bold text-red-600 mt-3">
                  {data.length}
                </h3>

                <p className="text-sm text-gray-400 mt-2">
                  รายการ
                </p>
              </div>

              <div className="bg-white rounded-xl shadow p-6">
                <p className="text-gray-500">
                  คะแนนเฉลี่ยโดยรวม
                </p>

                <h3 className="text-4xl font-bold text-red-600 mt-3">
                  {average("overall_rating")}
                  <span className="text-lg text-gray-400">
                    {" "}/ 5
                  </span>
                </h3>

                <p className="text-sm text-gray-400 mt-2">
                  คะแนนความพึงพอใจ
                </p>
              </div>

              <div className="bg-white rounded-xl shadow p-6">
                <p className="text-gray-500">
                  ความคิดเห็นที่ได้รับ
                </p>

                <h3 className="text-4xl font-bold text-red-600 mt-3">
                  {data.filter((item) => item.comment?.trim()).length}
                </h3>

                <p className="text-sm text-gray-400 mt-2">
                  ความคิดเห็น
                </p>
              </div>
            </div>

            {/* กราฟ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-7">
              <div className="bg-white rounded-xl shadow p-6">
                <h3 className="font-bold text-gray-800 text-lg mb-6">
                  คะแนนเฉลี่ยแต่ละหัวข้อ
                </h3>

                <Bar
                  data={chartData}
                  options={{
                    responsive: true,
                    scales: {
                      y: {
                        min: 0,
                        max: 5,
                        ticks: { stepSize: 1 },
                      },
                    },
                  }}
                />
              </div>

              <div className="bg-white rounded-xl shadow p-6">
                <h3 className="font-bold text-gray-800 text-lg mb-5">
                  จำนวนการประเมินตามประเภทบริการ
                </h3>

                {Object.keys(serviceCounts).length === 0 ? (
                  <p className="text-gray-400 text-center py-10">
                    ยังไม่มีข้อมูล
                  </p>
                ) : (
                  <div className="space-y-5">
                    {Object.entries(serviceCounts).map(
                      ([name, count]) => (
                        <div key={name}>
                          <div className="flex justify-between mb-2 text-sm">
                            <span className="text-gray-700">
                              {name}
                            </span>

                            <span className="font-bold text-red-600">
                              {count} รายการ
                            </span>
                          </div>

                          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-red-600 rounded-full"
                              style={{
                                width: `${
                                  (count / data.length) * 100
                                }%`,
                              }}
                            />
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* คะแนนเฉลี่ยรายหัวข้อ */}
            <div className="bg-white rounded-xl shadow p-6 mb-7">
              <h3 className="text-lg font-bold text-gray-800 mb-5">
                คะแนนเฉลี่ยรายหัวข้อ
              </h3>

{/* ระบบสร้าง QR Code สำหรับลูกค้า */}
<div className="bg-white rounded-xl shadow p-6 mb-7">
  <h3 className="text-lg font-bold text-gray-800 mb-2">
    QR Code สำหรับประเมินบริการ
  </h3>

  <p className="text-sm text-gray-500 mb-5">
    เลือกประเภทบริการเพื่อสร้าง QR Code ให้ลูกค้าสแกน
  </p>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">

    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        ประเภทบริการ
      </label>

      <input
        type="text"
        value={qrService}
        onChange={(e) => setQrService(e.target.value)}
        placeholder="กรอกประเภทบริการ"
        className="w-full border border-gray-300 rounded-lg p-3 text-gray-800"
      />

      <p className="text-xs text-gray-500 mt-2">
        เมื่อลูกค้าสแกน ระบบจะเปิดแบบประเมินของบริการนี้
      </p>

      {surveyUrl && (
        <div className="mt-4">
          <p className="text-sm font-semibold text-gray-700 mb-2">
            ลิงก์แบบประเมิน
          </p>

          <p className="text-xs text-blue-600 break-all">
            {surveyUrl}
          </p>

          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(surveyUrl);
              alert("คัดลอกลิงก์เรียบร้อยแล้ว");
            }}
            className="mt-3 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm"
          >
            คัดลอกลิงก์
          </button>
        </div>
      )}
    </div>

    <div className="flex flex-col items-center justify-center">
      <div className="border-2 border-gray-200 rounded-xl p-4">
        {qrService.trim() && surveyUrl ? (
          <QRCodeCanvas
            ref={qrCanvasRef}
            value={surveyUrl}
            size={220}
            level="H"
            includeMargin={true}
          />
        ) : (
          <div className="w-[220px] h-[220px] flex items-center justify-center text-gray-400 text-sm">
            กรุณากรอกประเภทบริการ
          </div>
        )}
      </div>

      <div className="flex flex-wrap justify-center gap-3 mt-4">
        <button
          type="button"
          onClick={downloadQRCode}
          disabled={!qrService.trim()}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white px-5 py-2 rounded-lg font-semibold"
        >
          ↓ ดาวน์โหลด PNG
        </button>

        <button
          type="button"
          onClick={printQRCode}
          disabled={!qrService.trim()}
          className="bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white px-5 py-2 rounded-lg font-semibold"
        >
          พิมพ์ QR Code
        </button>
      </div>

      <p className="font-bold text-gray-800 mt-3">
        {qrService || "QR Code"}
      </p>

      <p className="text-sm text-gray-500">
        สแกนเพื่อประเมินบริการ MG
      </p>
    </div>

  </div>
</div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="p-3">หัวข้อประเมิน</th>
                      <th className="p-3">คะแนนเฉลี่ย</th>
                    </tr>
                  </thead>

                  <tbody>
                    {[
                      ["ความสุภาพของพนักงาน", "staff_rating"],
                      ["ความรวดเร็ว", "speed_rating"],
                      ["คุณภาพบริการ", "quality_rating"],
                      ["ความสะอาด", "cleanliness_rating"],
                      ["ความพึงพอใจโดยรวม", "overall_rating"],
                    ].map(([name, key]) => (
                      <tr key={key} className="border-b">
                        <td className="p-3 text-gray-700">
                          {name}
                        </td>

                        <td className="p-3 font-bold text-red-600">
                          {average(key)} / 5
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ตารางผลประเมินและระบบค้นหา */}
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex flex-wrap justify-between items-center gap-3 mb-5">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">
                    รายละเอียดผลประเมินลูกค้า
                  </h3>

                  <p className="text-sm text-gray-500 mt-1">
                    พบ {filteredData.length} จาก {data.length} รายการ
                  </p>
                </div>
              </div>

              {/* ช่องค้นหา */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    ค้นหาประเภทบริการหรือความคิดเห็น
                  </label>

                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="พิมพ์คำค้นหา..."
                    className="w-full border border-gray-300 rounded-lg p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    กรองตามประเภทบริการ
                  </label>

                  <select
                    value={serviceFilter}
                    onChange={(e) => setServiceFilter(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-3 text-gray-800 bg-white"
                  >
                    <option value="ทั้งหมด">ทั้งหมด</option>

                    {serviceOptions.map((service) => (
                      <option key={service} value={service}>
                        {service}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* กรองวันที่ */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    ตั้งแต่วันที่
                  </label>

                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-3 text-gray-800"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    ถึงวันที่
                  </label>

                  <input
                    type="date"
                    value={dateTo}
                    min={dateFrom || undefined}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-3 text-gray-800"
                  />
                </div>
              </div>

<div className="flex flex-wrap justify-between gap-3 mb-5">

  <button
    type="button"
    onClick={exportExcel}
    disabled={filteredData.length === 0}
    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white px-5 py-2 rounded-lg font-semibold"
  >
    ↓ ดาวน์โหลด Excel
  </button>

  <button
    type="button"
    onClick={() => {
      setSearchTerm("");
      setServiceFilter("ทั้งหมด");
      setDateFrom("");
      setDateTo("");
    }}
    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm"
  >
    ล้างตัวกรอง
  </button>

</div>

              {/* ตาราง */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="p-3 whitespace-nowrap">ลำดับ</th>
                      <th className="p-3 whitespace-nowrap">วันที่ประเมิน</th>
                      <th className="p-3 whitespace-nowrap">ประเภทบริการ</th>
                      <th className="p-3 whitespace-nowrap">คะแนนรวม</th>
                      <th className="p-3 min-w-48">ความคิดเห็น</th>
                      <th className="p-3 text-center">รายละเอียด</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredData.length === 0 ? (
                      <tr>
                        <td
                          colSpan="6"
                          className="p-8 text-center text-gray-400"
                        >
                          ไม่พบข้อมูลที่ค้นหา
                        </td>
                      </tr>
                    ) : (
                      filteredData.map((item, index) => (
                        <tr
                          key={item.id}
                          className="border-b hover:bg-gray-50"
                        >
                          <td className="p-3 text-gray-600">
                            {index + 1}
                          </td>

                          <td className="p-3 text-gray-600 whitespace-nowrap">
                            {new Date(item.created_at).toLocaleString(
                              "th-TH"
                            )}
                          </td>

                          <td className="p-3 text-gray-700">
                            {item.service}
                          </td>

                          <td className="p-3 font-bold text-red-600 whitespace-nowrap">
                            {item.overall_rating} / 5 ★
                          </td>

                          <td className="p-3 text-gray-600 min-w-48">
                            {item.comment || "-"}
                          </td>

                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => setSelectedFeedback(item)}
                              className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg whitespace-nowrap"
                            >
                              ดูรายละเอียด
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        <p className="text-center text-gray-400 text-sm mt-8">
          MG Customer Feedback System
        </p>
      </section>

      {/* หน้าต่างรายละเอียดคะแนน */}
      {selectedFeedback && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setSelectedFeedback(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-bold text-gray-800">
                รายละเอียดผลประเมิน
              </h3>

              <button
                type="button"
                onClick={() => setSelectedFeedback(null)}
                className="text-gray-500 hover:text-red-600 text-2xl"
                aria-label="ปิดหน้าต่าง"
              >
                ×
              </button>
            </div>

            <div className="bg-red-50 rounded-lg p-4 mb-5">
              <p className="text-sm text-gray-500">
                ประเภทบริการ
              </p>

              <p className="font-bold text-red-600 text-lg">
                {selectedFeedback.service}
              </p>

              <p className="text-sm text-gray-500 mt-2">
                วันที่ประเมิน
              </p>

              <p className="text-gray-700">
                {new Date(
                  selectedFeedback.created_at
                ).toLocaleString("th-TH")}
              </p>
            </div>

            <h4 className="font-bold text-gray-800 mb-3">
              คะแนนแต่ละหัวข้อ
            </h4>

            <div className="space-y-3">
              {[
                ["ความสุภาพและการเอาใจใส่ของพนักงาน", "staff_rating"],
                ["ความรวดเร็วในการให้บริการ", "speed_rating"],
                ["คุณภาพในการให้บริการ", "quality_rating"],
                ["ความสะอาดของสถานที่", "cleanliness_rating"],
                ["ความพึงพอใจโดยรวม", "overall_rating"],
              ].map(([name, key]) => (
                <div
                  key={key}
                  className="flex justify-between items-center border-b pb-3 gap-3"
                >
                  <span className="text-gray-700">
                    {name}
                  </span>

                  <span className="font-bold text-red-600 whitespace-nowrap">
                    {selectedFeedback[key]} / 5 ★
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-5">
              <h4 className="font-bold text-gray-800 mb-2">
                ความคิดเห็นเพิ่มเติม
              </h4>

              <div className="bg-gray-50 rounded-lg p-4 text-gray-700 whitespace-pre-wrap min-h-20">
                {selectedFeedback.comment || "ลูกค้าไม่ได้แสดงความคิดเห็น"}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedFeedback(null)}
              className="w-full mt-6 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      )}
    </main>
  );
}