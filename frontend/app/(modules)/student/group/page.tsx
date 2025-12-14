'use client'

import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { GetGroupProjects, JoinGroup } from "../../../services/group";
import { GroupProject } from "../../../interfaces/Group";
import GroupCard from "../../../components/GroupCard";

// Helper: แกะ ID จาก Token (ยังจำเป็นต้องมี เพื่อเช็คว่าปุ่มไหนต้อง Disable)
const getCurrentUserId = () => {
  // พยายามหา Token จาก Storage หรือ Cookie
  const token = localStorage.getItem("access_token") || localStorage.getItem("token");
  if (!token) return null;

  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c =>
      '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    ).join(''));
    return JSON.parse(jsonPayload).id; // **ต้องตรงกับ Key ใน Token Backend (id, userId, sub)**
  } catch (e) {
    return null;
  }
};

const GroupSelectionPage = () => {
  const [groups, setGroups] = useState<GroupProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  // โหลดข้อมูล
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await GetGroupProjects();
      if (res.data) {
        setGroups(res.data);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 1. แกะ ID ของUser มาเก็บไว้ (เพื่อใช้คำนวณ Logic ปุ่ม)
    const uid = getCurrentUserId();
    setCurrentUserId(uid);

    // 2. โหลดข้อมูล
    fetchData();
  }, []);

  // Check: User นี้มีกลุ่มอยู่แล้วหรือยัง? (Global Check)
  const globalUserHasGroup = groups.some((group) =>
    group.group_members?.some((m) => m.student_id === currentUserId)
  );

  // Handle: เมื่อกดปุ่มลงชื่อ
  const handleJoinRequest = async (groupId: number) => {
    Swal.fire({
      title: 'ยืนยันการลงชื่อ?',
      text: `คุณต้องการเข้าร่วมกลุ่มนี้ใช่หรือไม่?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#2563EB', // สีฟ้า
      cancelButtonColor: '#d33',     // สีแดง
      confirmButtonText: 'ยืนยัน',
      cancelButtonText: 'ยกเลิก'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          // Show Loading
          Swal.fire({
            title: 'กำลังบันทึก...',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
          });

          // Call API
          const res = await JoinGroup({ group_project_id: groupId });

          if (res.status === 201 || res.status === 200) {
            await Swal.fire({
              icon: 'success',
              title: 'สำเร็จ!',
              text: 'คุณได้เข้าร่วมกลุ่มเรียบร้อยแล้ว',
              timer: 1500,
              showConfirmButton: false
            });
            fetchData(); // Reload ข้อมูล
          }
        } catch (error: any) {
          Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาด',
            text: error.response?.data?.error || "ไม่สามารถเข้าร่วมกลุ่มได้",
          });
        }
      }
    });
  };

  return (
    <div className="bg-gray-100 py-8 px-4 font-sans">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-black mb-2">
          เลือกกลุ่มโครงงาน
        </h1>


        {loading ? (
          <div className="flex justify-center mt-20 text-gray-500">
            กำลังโหลดข้อมูล...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {groups.map((group) => (
              <GroupCard
                key={group.ID}
                group={group}
                currentUserId={currentUserId}
                globalUserHasGroup={globalUserHasGroup}
                onJoin={handleJoinRequest}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupSelectionPage;