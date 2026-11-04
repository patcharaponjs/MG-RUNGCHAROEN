"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { QRCodeCanvas } from "qrcode.react";

// ลิงก์ Google Maps ของ เอ็มจี รุ่งเจริญ สาขาเทพารักษ์
const MAPS_URL = "https://maps.google.com/?q=เอ็มจี+รุ่งเจริญ+สาขาเทพารักษ์";

// กำหนดคำถามทั้ง 10 ข้อตามเอกสาร CSI
const questions = [
  {
    key: "q1",
    title: "Q1 ท่านได้ทำการนัดหมายกับศูนย์บริการ เรื่องคิวเข้ารับบริการล่วงหน้า",
    type: "yes_no",
  },
  {
    key: "q2",
    title: "Q2 ท่านได้เข้ารับบริการในวันที่ท่านต้องการนัดหมาย (ภายใน 3 วัน)",
    type: "yes_no",
  },
  {
    key: "q3",
    title: "Q3 ท่านพึงพอใจกับระยะเวลา และ การต้อนรับของพนักงานที่มารับรถ",
    type: "rating_10",
  },
  {
    key: "q4",
    title: "Q4 ความสะดวกสบายของห้องพักรับรอง และ สิ่งอำนวยความสะดวก",
    type: "rating_10",
  },
  {
    key: "q5",
    title: "Q5 พนักงานได้ทำการประเมินค่าใช้จ่าย ก่อนการดำเนินการซ่อม และ ระยะเวลาที่จะใช้ในการซ่อม",
    type: "yes_no",
  },
  {
    key: "q6",
    title: "Q6 ระยะเวลาที่ใช้ในการให้บริการรถของท่านโดยรวม เป็นไปตามที่พนักงานได้แจ้งให้ทราบ",
    type: "yes_no",
  },
  {
    key: "q7",
    title: "Q7 ในการเข้ารับบริการในครั้งนี้ รถของท่านได้รับการแก้ไขปัญหา ได้อย่างถูกต้องตามรายการที่ท่านแจ้งซ่อม",
    type: "yes_no",
  },
  {
    key: "q8",
    title: "Q8 พนักงานเข้าใจปัญหาที่ท่านแจ้ง สามารถอธิบายอย่างละเอียด เกี่ยวกับรายการซ่อม และค่าใช้จ่ายที่เกิดขึ้น ได้อย่างเหมาะสม",
    type: "rating_10",
  },
  {
    key: "q9",
    title: "Q9 ความพึงพอใจโดยรวม ในการเข้ารับบริการจากศูนย์บริการในครั้งนี้",
    type: "rating_10",
  },
  {
    key: "q10",
    title: "Q10 คุณลูกค้ารู้จัก MG Smile หรือไม่ (MG Smile คือการปรับปรุงการให้บริการ เพื่อให้ลูกค้าได้รับความประทับใจในการบริการ)",
    type: "know_unknow",
  },
];

function SurveyForm() {
  const searchParams = useSearchParams();
  const service = searchParams.get("service") || "";

  // สถานะการเก็บคำตอบ
  const [answers, setAnswers] = useState({
    q1: "",
    q2: "",
    q3: 0,
    q4: 0,
    q5: "",
    q6: "",
    q7: "",
    q8: 0,
    q9: 0,
    q10: "",
  });

  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAnswerChange = (key, value) => {
    setAnswers((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    if (!service) {
      alert("กรุณาเลือกประเภทบริการก่อนประเมิน");
      return;
    }

    // ตรวจสอบว่าตอบครบทุกข้อหรือไม่
    const incomplete = questions.some((q) => {
      const val = answers[q.key];
      if (q.type === "rating_10") return val === 0;
      return val === "";
    });

    if (incomplete) {
      alert("กรุณาตอบแบบประเมินให้ครบทุกหัวข้อ");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from("customer_feedback")
        .insert([
          {
            service: service,
            q1: answers.q1,
            q2: answers.q2,
            q3: answers.q3,
            q4: answers.q4,
            q5: answers.q5,
            q6: answers.q6,
            q7: answers.q7,
            q8: answers.q8,
            q9: answers.q9,
            q10: answers.q10,
            comment: comment.trim() || null,
          },
        ]);

      if (error) {
        console.error("Supabase Error:", error);
        alert("บันทึกข้อมูลไม่สำเร็จ กรุณาลองอีกครั้ง");
        return;
      }

      alert("ขอบคุณสำหรับการประเมินความพึงพอใจ ข้อมูลถูกบันทึกเรียบร้อยแล้ว");
      window.location.href = "/";

    } catch (error) {
      console.error("Submit Error:", error);
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่");

    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-100">
      <header className="bg-red-600 text-white shadow-md">
        <div className="max-w-4xl mx-auto px-6 py-5 flex justify-between items-center">
          <h1 className="text-xl md:text-2xl font-bold">
            ศูนย์บริการเอ็มจีรุ่งเจริญ สำนักงานใหญ่(เทพารักษ์)
          </h1>

          <span className="text-sm hidden sm:block">
            ความพึงพอใจของลูกค้า
          </span>
        </div>
      </header>

      <section className="max-w-3xl mx-auto px-4 py-10">
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-10">

          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
              แบบประเมินความพึงพอใจ (CSI)
            </h2>

            <p className="text-gray-500 mt-3">
              ความคิดเห็นของคุณมีความสำคัญต่อการพัฒนาบริการของเรา
            </p>

            <div className="mt-5 inline-block bg-red-50 text-red-600 px-5 py-2 rounded-lg font-medium">
              ประเภทบริการ: {service || "ไม่ระบุ"}
            </div>
          </div>

          <form onSubmit={handleSubmit}>

            <div className="space-y-8">
              {questions.map((question) => (
                <div
                  key={question.key}
                  className="border-b border-gray-200 pb-6"
                >
                  <p className="font-semibold text-gray-800 mb-4 leading-relaxed">
                    {question.title}
                  </p>

                  {/* ตัวเลือกตอบ YES / NO */}
                  {question.type === "yes_no" && (
                    <div className="flex gap-4">
                      {["ใช่", "ไม่ใช่"].map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => handleAnswerChange(question.key, option)}
                          className={`flex-1 py-3 px-6 rounded-xl border-2 font-semibold transition ${
                            answers[question.key] === option
                              ? "border-red-600 bg-red-600 text-white"
                              : "border-gray-300 text-gray-700 hover:border-red-400"
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* ตัวเลือกตอบ คะแนน 1-10 */}
                  {question.type === "rating_10" && (
                    <div>
                      <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 mb-2">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => handleAnswerChange(question.key, num)}
                            className={`py-3 rounded-lg border-2 font-bold text-lg transition ${
                              answers[question.key] === num
                                ? "border-red-600 bg-red-600 text-white"
                                : "border-gray-200 text-gray-700 hover:border-red-300"
                            }`}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                      <p className="text-sm text-gray-500 text-right mt-1">
                        {answers[question.key] > 0
                          ? `คะแนนที่เลือก: ${answers[question.key]} / 10`
                          : "กรุณาเลือกระดับคะแนน (1-10)"}
                      </p>
                    </div>
                  )}

                  {/* ตัวเลือกตอบ รู้จัก / ไม่รู้จัก */}
                  {question.type === "know_unknow" && (
                    <div className="flex gap-4">
                      {["รู้จัก", "ไม่รู้จัก"].map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => handleAnswerChange(question.key, option)}
                          className={`flex-1 py-3 px-6 rounded-xl border-2 font-semibold transition ${
                            answers[question.key] === option
                              ? "border-red-600 bg-red-600 text-white"
                              : "border-gray-300 text-gray-700 hover:border-red-400"
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-8">
              <label className="block font-semibold text-gray-800 mb-3">
                ความคิดเห็นและข้อเสนอแนะเพิ่มเติม
              </label>

              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={5}
                placeholder="กรุณาแสดงความคิดเห็นเพิ่มเติม..."
                className="w-full border border-gray-300 rounded-xl p-4 outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
              />
            </div>

            <div className="mt-8 space-y-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-bold py-4 rounded-xl transition"
              >
                {loading ? "กำลังบันทึกข้อมูล..." : "ส่งแบบประเมิน"}
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => (window.location.href = "/")}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 rounded-xl transition"
              >
                กลับหน้าแรก
              </button>
            </div>
          </form>

          {/* ส่วนแสดง QR Code แผนที่ตำแหน่งศูนย์บริการ */}
          <div className="mt-10 pt-8 border-t border-gray-200 text-center bg-gray-50 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-1">
              📍 แผนที่ตำแหน่ง เอ็มจี รุ่งเจริญ สาขาเทพารักษ์
            </h3>
            
            <div className="flex items-center justify-center gap-2 text-sm text-yellow-600 my-2">
              <span className="font-bold">4.5</span>
              <span>★★★★★</span>
              <span className="text-gray-500">(531 รีวิว บน Google)</span>
            </div>

            <p className="text-xs text-gray-500 mb-4">
              สแกน QR Code เพื่อดูตำแหน่งที่อยู่และเปิดนำทางบน Google Maps
            </p>

            <div className="flex justify-center mb-4">
              <div className="p-3 bg-white border-2 border-red-500 rounded-2xl shadow-md inline-block">
                <QRCodeCanvas
                  value={MAPS_URL}
                  size={160}
                  level="H"
                  includeMargin={true}
                />
              </div>
            </div>

            <div className="text-xs text-gray-600 space-y-1 mb-4">
              <p className="font-semibold text-gray-800">3456 ถ. เทพารักษ์ ตำบลเทพารักษ์ อำเภอเมืองสมุทรปราการ สมุทรปราการ 10270</p>
              <p className="text-green-600 font-semibold">เปิดอยู่ · ปิดเวลา 18:00 น.</p>
            </div>

            <a
              href={MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2.5 px-5 rounded-xl transition shadow-sm"
            >
              📍 นำทางด้วย Google Maps ↗
            </a>
          </div>

          <p className="text-center text-gray-400 text-sm mt-8">
            MG Customer Feedback System
          </p>

        </div>
      </section>
    </main>
  );
}

export default function SurveyPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">กำลังโหลดแบบประเมิน...</div>}>
      <SurveyForm />
    </Suspense>
  );
}