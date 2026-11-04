"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabase";

const questions = [
  { key: "staff", title: "ความสุภาพและการเอาใจใส่ของพนักงาน" },
  { key: "speed", title: "ความรวดเร็วในการให้บริการ" },
  { key: "quality", title: "คุณภาพในการให้บริการ" },
  { key: "cleanliness", title: "ความสะอาดของสถานที่" },
  { key: "overall", title: "ความพึงพอใจโดยรวม" },
];

const ratingLabels = [
  "ควรปรับปรุง",
  "พอใช้",
  "ปานกลาง",
  "ดี",
  "ดีมาก",
];

// 1. แยก Component ย่อยสำหรับจัดการ Logic และ UI ของแบบสอบถาม
function SurveyForm() {
  const searchParams = useSearchParams();
  const service = searchParams.get("service") || "";

  const [ratings, setRatings] = useState({
    staff: 0,
    speed: 0,
    quality: 0,
    cleanliness: 0,
    overall: 0,
  });

  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRating = (key, value) => {
    setRatings((prev) => ({
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

    const incomplete = questions.some(
      (question) => ratings[question.key] === 0
    );

    if (incomplete) {
      alert("กรุณาประเมินให้ครบทุกหัวข้อ");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from("customer_feedback")
        .insert([
          {
            service: service,
            staff_rating: ratings.staff,
            speed_rating: ratings.speed,
            quality_rating: ratings.quality,
            cleanliness_rating: ratings.cleanliness,
            overall_rating: ratings.overall,
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
            MG CUSTOMER FEEDBACK
          </h1>

          <span className="text-sm hidden sm:block">
            Customer Satisfaction
          </span>
        </div>
      </header>

      <section className="max-w-3xl mx-auto px-4 py-10">
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-10">

          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
              แบบประเมินความพึงพอใจ
            </h2>

            <p className="text-gray-500 mt-3">
              ความคิดเห็นของคุณมีความสำคัญต่อการพัฒนาบริการของเรา
            </p>

            <div className="mt-5 inline-block bg-red-50 text-red-600 px-5 py-2 rounded-lg">
              ประเภทบริการ: {service || "ไม่ระบุ"}
            </div>
          </div>

          <form onSubmit={handleSubmit}>

            <div className="bg-gray-50 rounded-xl p-4 mb-7">
              <p className="font-semibold text-gray-700 mb-2">
                คำแนะนำในการประเมิน
              </p>

              <p className="text-sm text-gray-500">
                กรุณาเลือกคะแนนตั้งแต่ 1 ถึง 5 ดาว
                ตามระดับความพึงพอใจของคุณ
              </p>

              <p className="text-sm text-gray-500 mt-1">
                1 = ควรปรับปรุง และ 5 = ดีมาก
              </p>
            </div>

            <div className="space-y-7">
              {questions.map((question, index) => (
                <div
                  key={question.key}
                  className="border-b border-gray-200 pb-6"
                >
                  <p className="font-semibold text-gray-800 mb-3">
                    {index + 1}. {question.title}
                  </p>

                  <div className="flex gap-3 flex-wrap">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() =>
                          handleRating(question.key, star)
                        }
                        className={`text-3xl transition-transform hover:scale-125 ${
                          ratings[question.key] >= star
                            ? "text-yellow-400"
                            : "text-gray-300"
                        }`}
                        aria-label={`ให้ ${star} คะแนน`}
                      >
                        ★
                      </button>
                    ))}
                  </div>

                  <p className="text-sm text-gray-500 mt-2">
                    {ratings[question.key] > 0
                      ? `${ratings[question.key]} ดาว - ${ratingLabels[ratings[question.key] - 1]}`
                      : "ยังไม่ได้ประเมิน"}
                  </p>
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

          <p className="text-center text-gray-400 text-sm mt-8">
            MG Customer Feedback System
          </p>

        </div>
      </section>
    </main>
  );
}

// 2. Export หน้าหลักโดยครอบด้วย Suspense
export default function SurveyPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">กำลังโหลดแบบประเมิน...</div>}>
      <SurveyForm />
    </Suspense>
  );
}