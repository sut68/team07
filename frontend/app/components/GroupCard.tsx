'use client'

import React from "react";
import { GroupProject } from "../interfaces/Group"; // Import Interface ที่เราสร้างไว้

interface GroupCardProps {
  group: GroupProject;           // ข้อมูลกลุ่ม 1 กลุ่ม
  currentUserId: number | null;  // ID ของ user ที่ login อยู่
  globalUserHasGroup: boolean;   // สถานะบอกว่า user คนนี้มีกลุ่มอยู่แล้วหรือยัง (เช็คจากทุกกลุ่ม)
  onJoin: (groupId: number) => void; // ฟังก์ชัน callback เมื่อกดปุ่มลงชื่อ
}

const GroupCard: React.FC<GroupCardProps> = ({ 
  group, 
  currentUserId, 
  globalUserHasGroup, 
  onJoin 
}) => {
  // 1. คำนวณตัวแปรต่างๆ
  const members = group.group_members || [];
  const totalSlots = group.membership; // เช่น 3 หรือ 5
  const filledCount = members.length;
  const isFull = filledCount >= totalSlots;

  // 2. เช็คว่า "ฉัน" อยู่ในกลุ่ม "นี้" หรือไม่?
  const isMyGroup = members.some((m) => m.student_id === currentUserId);

  return (
    <div className="bg-white border-2 border-black rounded-lg p-3 shadow-sm flex flex-col w-full max-w-sm">
      {/* --- ส่วนหัว (Header) --- */}
      <div className="flex justify-between items-center mb-3 pb-2 border-b-2 border-gray-200">
        <div>
          <div className="text-blue-600 font-bold text-lg">
            กลุ่มที่ {group.group_number}
          </div>
          <div className="text-xs text-gray-500">
            จำนวนสมาชิก {filledCount} / {totalSlots} คน
          </div>
        </div>

        {/* --- ปุ่ม Action (Logic ตามภาพที่ 2) --- */}
        {isMyGroup ? (
          <span className="bg-gray-200 text-gray-600 px-3 py-1 rounded-full text-sm font-bold cursor-default border border-gray-300">
            อยู่แล้ว
          </span>
        ) : (
          <button
            onClick={() => onJoin(group.ID)}
            disabled={globalUserHasGroup || isFull} // ห้ามกดถ้า: มีกลุ่มแล้ว หรือ กลุ่มเต็ม
            className={`px-4 py-1 rounded-full text-white text-sm font-bold transition-all
              ${
                globalUserHasGroup || isFull
                  ? "bg-gray-400 cursor-not-allowed opacity-70"
                  : "bg-blue-600 hover:bg-blue-700 shadow hover:shadow-md"
              }`}
          >
            {isFull ? "เต็ม" : "ลงชื่อ"}
          </button>
        )}
      </div>

      {/* --- ส่วนรายชื่อ (Slots) --- */}
      <div className="flex-col space-y-1">
        {/* วนลูปสร้างช่องตามจำนวน Membership (ภาพที่ 3: Dynamic Slots) */}
        {Array.from({ length: totalSlots }).map((_, index) => {
          const member = members[index]; // ดึงคนในลำดับนั้น (ถ้ามี)

          return (
            <div
              key={index}
              className={`border border-black px-2 py-2 h-10 flex items-center text-sm rounded-sm ${
                member ? "bg-white" : "bg-gray-50"
              }`}
            >
              {member ? (
                // กรณีมีคนนั่ง (Filled Slot)
                <div className="flex w-full justify-between items-center overflow-hidden">
                  <div className="truncate w-full pr-2 flex items-center gap-2">
                     {/* แสดงรหัสนศ. หรือ ชื่อ */}
                    <span className="font-mono text-xs text-gray-500">
                        {member.student?.username?.split('@')[0] || "Bxxxxxx"} 
                    </span>
                    <span className="truncate font-medium text-gray-800">
                       {member.student?.firstname} {member.student?.lastname}
                    </span>
                  </div>
                  
                  {/* แสดงสถานะ Leader */}
                  {member.leader && (
                    <span className="text-[10px] text-white bg-orange-500 px-1.5 py-0.5 rounded-md font-bold whitespace-nowrap shadow-sm">
                      หัวหน้า
                    </span>
                  )}
                </div>
              ) : (
                // ช่องว่าง (Empty Slot) - ภาพที่ 1
                <span className="text-gray-500 mx-auto italic select-none text-xs ">
                  - ว่าง -
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GroupCard;