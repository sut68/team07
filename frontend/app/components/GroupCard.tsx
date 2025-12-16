'use client'

import React from "react";
import { GroupProject } from "../interfaces/Group";

interface GroupCardProps {
  group: GroupProject;
  currentUserId: number | null;
  globalUserHasGroup: boolean;
  onJoin: (groupId: number) => void;
}

const GroupCard: React.FC<GroupCardProps> = ({ 
  group, 
  currentUserId, 
  globalUserHasGroup, 
  onJoin 
}) => {
  const members = group.group_members || [];
  const totalSlots = group.membership; 
  const filledCount = members.length;
  const isFull = filledCount >= totalSlots;

  // หาค่ามากสุด: ถ้าคนเกินโควต้า ให้ใช้จำนวนคนจริง, ถ้าคนน้อยกว่า ให้ใช้โควต้า (เพื่อโชว์ช่องว่าง)
  const rowsToRender = Math.max(totalSlots, filledCount);

  const isMyGroup = members.some((m) => m.student_id === currentUserId);

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden flex flex-col w-full transition-all hover:shadow-lg">
      
      {/* --- ส่วนหัว (Header) --- */}
      {/* 1. กำหนด Padding รอบกล่องหัวข้อที่นี่ที่เดียว  */}
      <div className="flex justify-between items-center px-6 py-4 bg-red-900 border-b border-gray-200">
        <div>
          <div className="text-white font-bold text-lg ">
            กลุ่มที่ {group.group_number}
          </div>
          <div className="text-xs text-amber-100 font-medium mt-1">
            สมาชิก {filledCount} / {totalSlots} คน
          </div>
        </div>

        {/* --- ปุ่ม Action --- */}
        {isMyGroup ? (
          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold border border-green-200 select-none">
            กลุ่มของคุณ
          </span>
        ) : (
          <button
            onClick={() => onJoin(group.ID)}
            disabled={globalUserHasGroup || isFull}
            className={`px-5 py-1.5 rounded-lg text-white text-2xl font-bold transition-all shadow-sm
              ${
                globalUserHasGroup || isFull
                  ? "bg-gray-300 outline-2 outline-offset text-gray-500 min-w-[60px] min-h-[20px] cursor-not-allowed"
                  : "bg-amber-200 outline-2 outline-offset hover:bg-amber-300 min-w-[60px] min-h-[20px] hover:shadow-md active:scale-95"
              }`}
          >
            {isFull ? "เต็ม" : "เข้าร่วม"}
          </button>
        )}
      </div>

      {/* --- ส่วนรายชื่อ (Slots) --- */}
      <div className="flex-col divide-y divide-gray-100 bg-white">
        {Array.from({ length: rowsToRender }).map((_, index) => {
          const member = members[index];

          return (
            <div
              key={index}
              // 3. ปรับ px-6 ให้เท่ากับส่วนหัว (Header) 
              className="px-6 h-12 flex items-center text-sm"
            >
              {member ? (
                // --- กรณีมีคนนั่ง ---
                <div className="flex w-full justify-between items-center gap-3 overflow-hidden">
                  <div className="flex items-center gap-5 truncate w-full ">
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md min-w-[80px] text-center">
                        {member.student?.username?.split('@')[0] || "Bxxxxxx"} 
                    </span>
                    <span className="truncate font-medium text-gray-700 text-sm">
                       {member.student?.firstname} {member.student?.lastname}
                    </span>
                  </div>
                  
                  {member.leader && (
                    <span className="text-[10px] text-orange-700 bg-orange-100 border border-orange-200 min-w-[40px] text-center px-2 py-0.5 rounded-full font-bold whitespace-nowrap">
                    หัวหน้า 
                    </span>
                  )}
                </div>
              ) : (
                // --- ช่องว่าง (- ว่าง -) ---
                <div className="flex w-full justify-center items-center h-full">
                  <span className="text-gray-400 text-xs italic select-none">
                    - ว่าง -
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GroupCard;