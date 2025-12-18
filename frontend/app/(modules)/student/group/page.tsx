'use client'

import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { GetGroupProjects, JoinGroup, GetAcademicYears } from "../../../services/group";
import { GroupProject } from "../../../interfaces/Group";
import GroupCard from "../../../components/GroupCard";

// Import CSS
import "../../../style/StudentGroupPage.css"

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

const GroupSelectionPage = () => {
  const [groups, setGroups] = useState<GroupProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [academicYears, setAcademicYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear() + 543);

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

  const initData = async () => {
    setLoading(true);
    try {
      const resYear = await GetAcademicYears();
      if (resYear.data && resYear.data.length > 0) {
        setAcademicYears(resYear.data);
        const latestYear = resYear.data[0];
        setSelectedYear(latestYear);
        await fetchGroups(latestYear);
      } else {
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
    initData();
  }, []);

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const year = parseInt(e.target.value);
    setSelectedYear(year);
    fetchGroups(year);
  };

  const globalUserHasGroup = groups.some((group) => {
    const members = group.group_members || [];
    return members.some((m: any) => m.student_id === currentUserId);
  });

  const handleJoinRequest = async (groupId: number) => {
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
    }
    )
  };

  return (
    <div className="group-selection-container">
      <div className="content-wrapper">

        <div className="page-header">
          {/* ฝั่งซ้าย: Title + Subtitle */}
          <div className="header-left">
            {/* 1. แท่งสีแดง (ย้ายมาไว้ตรงนี้ เพื่อให้เป็นแท่งยาวแท่งเดียว) */}
            <div className="thick-red-bar"></div>

            {/* 2. สร้าง div ใหม่คลุมตัวหนังสือทั้ง 2 บรรทัด */}
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
                    currentUserId={currentUserId}
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