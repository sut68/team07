'use client'

import React, { useEffect, useState } from "react";
import Swal from "sweetalert2"; 
import { GetGroupProjects, JoinGroup, GetAcademicYears } from "../../../services/group";
import { GroupProject } from "../../../interfaces/Group";
import GroupCard from "../../../components/GroupCard";

// Helper: แกะ ID จาก Token
const getCurrentUserId = () => {
    const token = localStorage.getItem("access_token") || localStorage.getItem("token"); 
    if (!token) return null;
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => 
            '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
        ).join(''));
        return JSON.parse(jsonPayload).id; 
    } catch (e) {
        return null;
    }
};

// โหลดข้อมูลกลุ่ม (ตามปี)
const GroupSelectionPage = () => {
  const [groups, setGroups] = useState<GroupProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  // --- แก้ไขจุดที่ 1: เปลี่ยน academicYears เป็น State ---
  const [academicYears, setAcademicYears] = useState<number[]>([]); 
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear() + 543); // ค่าเริ่มต้นเป็นปีปัจจุบันไปก่อน

  // โหลดข้อมูลกลุ่ม (ตามปี)
  const fetchGroups = async (year: number) => {
    setLoading(true);
    try {
      const res = await GetGroupProjects(year);
      if (res.data) {
        setGroups(res.data);
      }
    } catch (error) {
      console.error("Error fetching groups:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- แก้ไขจุดที่ 2: สร้างฟังก์ชันโหลดปีการศึกษา ---
  const initData = async () => {
    setLoading(true);
    try {
        // 1. ดึงปีการศึกษามาก่อน
        const resYear = await GetAcademicYears();
        
        if (resYear.data && resYear.data.length > 0) {
            setAcademicYears(resYear.data);
            
            // 2. ตั้งค่าปีล่าสุดเป็นค่าเริ่มต้น (ตัวแรกสุด เพราะเรา sort desc มาแล้ว)
            const latestYear = resYear.data[0];
            setSelectedYear(latestYear);
            
            // 3. โหลดข้อมูลกลุ่มของปีล่าสุดทันที
            await fetchGroups(latestYear);
        } else {
            // กรณีไม่มีข้อมูลปีเลย (Database ว่างเปล่า)
            setGroups([]);
        }
    } catch (error) {
        console.error("Error initializing:", error);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    const uid = getCurrentUserId();
    setCurrentUserId(uid);
    
    // เรียกฟังก์ชัน initData แทนการเรียก fetchData ตรงๆ
    initData();
  }, []);

  // ฟังก์ชันเปลี่ยนปี
  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const year = parseInt(e.target.value);
      setSelectedYear(year);
      fetchGroups(year); 
  };

  // Check: User นี้มีกลุ่มอยู่แล้วหรือยัง? 
  const globalUserHasGroup = groups.some((group) => {
    const members = group.group_members || [];
    return members.some((m: any) => 
        m.student_id === currentUserId
    );
  });

  // Handle: เมื่อกดปุ่มลงชื่อ
  const handleJoinRequest = async (groupId: number) => {
    Swal.fire({
        title: 'ยืนยันการลงชื่อ?',
        text: `คุณต้องการเข้าร่วมกลุ่มนี้ใช่หรือไม่?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#2563EB',
        cancelButtonColor: '#d33',
        confirmButtonText: 'ยืนยัน',
        cancelButtonText: 'ยกเลิก'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                Swal.fire({
                    title: 'กำลังบันทึก...',
                    allowOutsideClick: false,
                    didOpen: () => Swal.showLoading()
                });

                const res = await JoinGroup({ group_project_id: groupId });
                
                if (res.status === 201 || res.status === 200) {
                    await Swal.fire({
                        icon: 'success',
                        title: 'สำเร็จ!',
                        text: 'คุณได้เข้าร่วมกลุ่มเรียบร้อยแล้ว',
                        timer: 1500,
                        showConfirmButton: false
                    });
                    fetchGroups(selectedYear); // Reload ตามปีปัจจุบัน
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
    <div className="min-h-screen bg-white py-10 px-4 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* Header & Dropdown */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-20">
            {/* ส่วนซ้าย: ชื่อหัวข้อ และ รายละเอียด */}
            <div className="flex items-baseline gap-4"> 
                <h1 className="text-4xl font-bold text-red-800">
                    เลือกกลุ่มโครงงาน
                </h1>
                <p className="text-gray-600 text-lg font-medium"> 
                    ( ประจำปีการศึกษา {selectedYear} )
                </p>
            </div>

            {/* ส่วนขวา: Dropdown เลือกปี */}
            <div className="mt-4 md:mt-0 flex items-center gap-3 ">
                <label className="font-bold text-gray-500">ปีการศึกษา:</label>
                
                <select 
                    value={selectedYear}
                    onChange={handleYearChange}
                    className="border border-gray-300 rounded-lg px-4 py-2 text-lg bg-white shadow-sm focus:ring-2 focus:ring-red-500 focus:outline-none cursor-pointer"
                >
                    {academicYears.length > 0 ? (
                        academicYears.map(y => <option key={y} value={y}>{y}</option>)
                    ) : (
                        <option value={selectedYear}>{selectedYear}</option>
                    )}
                </select>
            </div>
        </div>

        {/* ... (ส่วนแสดงผล Loading และ Grid เหมือนเดิม) ... */}
        {loading ? (
          <div className="flex justify-center mt-20">
             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          groups.length === 0 ? (
            <div className="text-center p-10 border-2 border-dashed border-gray-300 rounded-xl text-gray-500">
                ไม่พบข้อมูลกลุ่มในปีการศึกษานี้
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
          )
        )}
      </div>
    </div>
  );
};

export default GroupSelectionPage;