"use client";
import React from "react";
import { Modal, message } from "antd";
import { useRouter } from "next/navigation";

interface Props {
  open: boolean;
  onClose: () => void;
  project: any;
}

const LABEL_MAP: Record<string, string> = {
  "Advisor Evaluation": "Advisor Evaluation (ที่ปรึกษา)",
  "Ethics Test": "Ethics Test (จริยธรรม)",
  "Committee Evaluation": "Committee Evaluation (กรรมการ)",
};

export default function EvaluationTypeModal({
  open,
  onClose,
  project,
}: Props) {
  const router = useRouter();

  if (!project) return null;

  const handleSelect = (type: string) => {
    const appt = project.appointments?.find(
      (a: any) => (a.evaluation_name || a.evaluation_type) === type
    );

    if (!appt) {
      message.warning("ยังไม่มีนัดหมายสำหรับการประเมินประเภทนี้");
      return;
    }

    onClose();
    router.push(
      `/teacher/evaluation/form/${appt.id}?evalType=${encodeURIComponent(type)}`
    );
  };

  // ✅ ดึงประเภทการประเมินจาก appointments โดยตรง
  const evaluations: string[] = Array.from(
    new Set(
      project.appointments?.map(
        (a: any) => a.evaluation_name || a.evaluation_type
      )
    )
  );

  return (
    <Modal
      open={open}
      footer={null}
      onCancel={onClose}
      centered
      width={520}
    >
      <div className="eval-page" style={{ padding: 24 }}>
        <h2 style={{ textAlign: "center", marginBottom: 24 }}>
          เลือกประเภทการประเมิน
        </h2>

        {evaluations.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              color: "#888",
              padding: "24px 0",
            }}
          >
            ยังไม่มีการนัดหมายเพื่อประเมิน
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              gap: 16,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            {evaluations.map((type) => (
              <button
                key={type}
                className="btn-primary"
                onClick={() => handleSelect(type)}
              >
                {LABEL_MAP[type] || type}
              </button>
            ))}
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: 24 }}>
          <button className="btn-back" onClick={onClose}>
            ยกเลิก
          </button>
        </div>
      </div>
    </Modal>
  );
}
