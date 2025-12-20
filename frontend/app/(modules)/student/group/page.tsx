'use client'

import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { GetGroupProjects, JoinGroup, GetAcademicYears } from "../../../services/group";
import { GroupProject } from "../../../interfaces/Group";
import GroupCard from "../../../components/GroupCard";
import api from "../../../services/api"; // เรียกใช้ axios instance เพื่อยิง /me

import "../../../style/StudentGroupPage.css"

const GroupSelectionPage = () => {
  const [groups, setGroups] = useState<GroupProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [academicYears, setAcademicYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear() + 543);

  // ฟังก์ชันดึงข้อมูลกลุ่ม
  const fetchGroups = async (year: number) => {
    setLoading(true);
    try {
      const res = await GetGroupProjects(year);
      if (res.data) {
        setGroups(res.data);
      } else {
        setGroups([]);
      }
    } catch (error) {
      console.error("Error fetching groups:", error);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  // ฟังก์ชันเริ่มต้น (โหลด User ID + ปีการศึกษา + กลุ่ม)
  const initData = async () => {
    setLoading(true);
    try {
      // 1. ดึงข้อมูล User ID จาก Server (แก้ปัญหา HttpOnly Cookie)
      try {
        const resMe = await api.get("/me");
        if (resMe.data && resMe.data.id) {
          setCurrentUserId(resMe.data.id);
        }
      } catch (e) {
        console.error("Failed to fetch user profile:", e);
        // ถ้าดึงไม่ได้ อาจจะ Redirect ไป Login หรือปล่อยให้เป็น null (ดูได้แต่กดไม่ได้)
      }

      // 2. ดึงปีการศึกษา
      const resYear = await GetAcademicYears();
      if (resYear.data && resYear.data.length > 0) {
        setAcademicYears(resYear.data);
        const latestYear = resYear.data[0];
        setSelectedYear(latestYear);
        // 3. ดึงกลุ่มของปีล่าสุด
        await fetchGroups(latestYear);
      } else {
        setGroups([]);
        setLoading(false);
      }
    } catch (error) {
      console.error("Error initializing:", error);
      setLoading(false);
    }
  };

  // เรียกใช้ครั้งแรกเมื่อเข้าหน้าเว็บ
  useEffect(() => {
    initData();
  }, []);

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const year = parseInt(e.target.value);
    setSelectedYear(year);
    fetchGroups(year);
  };

  // คำนวณว่า user ปัจจุบันมีกลุ่มอยู่แล้วหรือไม่ (ใน list ที่แสดงอยู่)
  const globalUserHasGroup = groups.some((group) => {
    const members = group.group_members || [];
    return members.some((m: any) => m.student_id === currentUserId);
  });

  const handleJoinRequest = async (groupId: number) => {
    // เช็คก่อนกดว่ามี ID ไหม
    if (!currentUserId) {
        Swal.fire("กรุณาเข้าสู่ระบบ", "ไม่พบข้อมูลผู้ใช้งาน", "warning");
        return;
    }

    Swal.fire({
      title: 'ยืนยันการลงชื่อ ?',
      text: `คุณต้องการเข้าร่วมกลุ่มนี้ใช่หรือไม่`,
      icon: 'question',
      showCancelButton: true,
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
            // โหลดข้อมูลใหม่เพื่อให้ UI อัปเดตสถานะกลุ่มทันที
            fetchGroups(selectedYear);
          }
        } catch (error: any) {
          Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาด',
            text: error.response?.data?.error || "ไม่สามารถเข้าร่วมกลุ่มได้",
          });
        }
      }
    })
  };

  return (
    <div className="group-selection-container">
      <div className="content-wrapper">

        <div className="page-header">
          {/* ฝั่งซ้าย: Title + Subtitle */}
          <div className="header-left">
            <div className="thick-red-bar"></div>
            <div className="header-text-content">
              <h1 className="page-title">เลือกกลุ่มโครงงาน</h1>
              <p className="page-subtitle">ประจำปีการศึกษา {selectedYear}</p>
            </div>
          </div>

          {/* ฝั่งขวา: Dropdown เปลี่ยนปี */}
          <div className="year-selector-wrapper">
            <span className="year-label">ปีการศึกษา:</span>
            <select
              value={selectedYear}
              onChange={handleYearChange}
              className="year-select"
            >
              {academicYears.length > 0 ? (
                academicYears.map(y => <option key={y} value={y}>{y}</option>)
              ) : (
                <option value={selectedYear}>{selectedYear}</option>
              )}
            </select>
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <span>กำลังโหลดข้อมูลกลุ่ม...</span>
          </div>
        ) : (
          groups.length === 0 ? (
            <div className="empty-state-box">
              ไม่พบข้อมูลกลุ่มในปีการศึกษานี้
            </div>
          ) : (
            <div className="groups-grid">
              {groups.map((group) => (
                <div key={group.ID} className="group-card-wrapper">
                  <GroupCard
                    group={group}
                    currentUserId={currentUserId} // ส่ง ID ที่ได้จาก API /me เข้าไป
                    globalUserHasGroup={globalUserHasGroup}
                    onJoin={handleJoinRequest}
                  />
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default GroupSelectionPage;