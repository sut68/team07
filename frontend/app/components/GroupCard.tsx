import React from "react";
import { GroupProject } from "../interfaces/Group";
import "../style/StudentGroupCard.css";

interface GroupCardProps {
  group: GroupProject;
  currentUserId: number | null;
  globalUserHasGroup: boolean;
  onJoin?: (groupId: number) => void;
  hideAction?: boolean;
}

const GroupCard: React.FC<GroupCardProps> = ({ 
  group, 
  currentUserId, 
  globalUserHasGroup, 
  onJoin,
  hideAction
}) => {
  const rawMembers = group.group_members || [];
  

  const members = [...rawMembers].sort((a, b) => {
    if (a.leader && !b.leader) return -1;
    if (!a.leader && b.leader) return 1;
    return 0; 
  });

  const totalSlots = group.membership; 
  const filledCount = members.length;
  const isFull = filledCount >= totalSlots;
  const rowsToRender = Math.max(totalSlots, filledCount);
  const isMyGroup = members.some((m) => m.student_id === currentUserId);

  return (
    <div className="group-card">
      
      {/* --- ส่วนหัว (Header) --- */}
      <div className="card-header">
        <div className="header-content">
          <div className="group-title">
            กลุ่มที่ {group.group_number}
          </div>
          <div className="group-year">
            ปีการศึกษา {group.year}
          </div>
          <div className="member-count">
            สมาชิก {filledCount} / {totalSlots}
          </div>
        </div>

        {/* --- ปุ่ม Action --- */}
        {!hideAction && (
            isMyGroup ? (
                <span className="badge-my-group">กลุ่มของคุณ</span>
            ) : (
                <button
                    onClick={() => onJoin && onJoin(group.ID)}
                    disabled={globalUserHasGroup || isFull}
                    className="btn-join"
                >
                    {isFull ? "เต็ม" : "เข้าร่วม"}
                </button>
            )
        )}
      </div>

      {/* --- ส่วนรายชื่อ (Slots) --- */}
      <div className="card-body">
        {Array.from({ length: rowsToRender }).map((_, index) => {
          const member = members[index];

          return (
            <div key={index} className="member-row">
              {member ? (
                <div className="member-info">
                  {/* รหัสนักศึกษา */}
                  <span className="student-id-badge">
                      {member.student?.username?.split('@')[0] || "Unknown"} 
                  </span>
                  
                  {/* ชื่อนักศึกษา */}
                  <span className="student-name" title={`${member.student?.firstname} ${member.student?.lastname}`}>
                     {member.student?.firstname} {member.student?.lastname}
                  </span>
                  
                  {/* หัวหน้ากลุ่ม */}
                  {member.leader && (
                    <span className="badge-leader">
                      👑 หัวหน้า 
                    </span>
                  )}
                </div>
              ) : (
                // --- ช่องว่าง ---
                <div className="slot-empty">
                  <span className="slot-placeholder">
                    ว่าง
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