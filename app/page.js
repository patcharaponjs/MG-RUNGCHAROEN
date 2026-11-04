
"use client";

import { useState } from "react";

export default function Home() {
  const [service, setService] = useState("");

  return (
    <main className="min-h-screen bg-gray-100">
      <header className="bg-red-600 text-white p-5 shadow">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">ศูณย์บริการ เอ็มจีรุ่งเจริญ สำนักงานใหญ่(เทพารักษ์)</h1>
          <span className="text-sm">ความพึงพอใจของลูกค้า</span>
        </div>
      </header>

      <section className="max-w-3xl mx-auto px-5 py-16">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            ยินดีต้อนรับสู่ MG
          </h2>

          <p className="text-gray-500 mb-8">
            ร่วมแสดงความคิดเห็นเพื่อพัฒนาการบริการของเรา
          </p>

          <div className="text-left mb-6">
            <label className="block font-semibold mb-2">
              เลือกประเภทบริการ
            </label>

            <select
              value={service}
              onChange={(e) => setService(e.target.value)}
              className="w-full border rounded-lg p-3"
            >
              <option value="">-- กรุณาเลือกบริการ --</option>
              <option value="ซ่อมบำรุงรักษา (งานซ่อม รถมีปัญหา)">ซ่อมบำรุงรักษา (งานซ่อม รถมีปัญหา)</option>
              <option value="เช็คระยะ (การบำรุงรักษาตามระยะ)">เช็คระยะ (การบำรุงรักษาตามระยะ)</option>
              <option value="รับประกันคุณภาพ">รับประกันคุณภาพ</option>
              <option value="ซ่อมตัวถังและสี">ซ่อมตัวถังและสี</option>
            
            </select>
          </div>

          <button
            onClick={() => {
              if (!service) {
                alert("กรุณาเลือกประเภทบริการ");
                return;
              }

              window.location.href =
                "/survey?service=" + encodeURIComponent(service);
            }}
            className="w-full bg-red-600 hover:bg-red-700 text-white
            font-bold py-4 rounded-lg transition"
          >
            เริ่มประเมินความพึงพอใจ
          </button>

          <p className="text-gray-400 text-sm mt-8">
            MG Customer Feedback 
          </p>
        </div>
      </section>
    </main>
  );
}
