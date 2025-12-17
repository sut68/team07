'use client'

import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import GroupManagementModal from "../../../components/GroupModal";
import { GetEligibleStudentCount, GenerateGroups, GetGroupProjects } from "../../../services/group";
import { GroupProject } from "../../../interfaces/Group";
import '../../../style/AdminGroupPage.css';

const AdminGroupPage = () => {
  // --- State Logic (คงเดิม) ---
  const [totalStudents, setTotalStudents] = useState<number>(0);
  const [groups, setGroups] = useState<GroupProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState<number>(new Date().getFullYear() + 543);
  const [count5, setCount5] = useState<number>(0);
  const [count4, setCount4] = useState<number>(0);
  const [count3, setCount3] = useState<number>(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<number>(0);

  useEffect(() => { fetchStudentCount(); }, []);
  useEffect(() => { fetchGroups(); }, [year]);

  const fetchStudentCount = async () => {
    try {
      const res = await GetEligibleStudentCount();
      if (res.data) setTotalStudents(res.data.count);
    } catch (error) { console.error(error); }
  };

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const res = await GetGroupProjects(year);
      setGroups(res.data ? res.data : []);
    } catch (error) {
      Swal.fire("Error", "ไม่สามารถดึงข้อมูลกลุ่มได้", "error");
    } finally { setLoading(false); }
  };

  const handleManageGroup = (groupId: number) => {
    setSelectedGroupId(groupId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedGroupId(0);
    fetchGroups();
  };

  const usedStudents = (count5 * 5) + (count4 * 4) + (count3 * 3);
  const remainingStudents = totalStudents - usedStudents;

  const handleSubmit = async () => {
    if (year < 2500) { Swal.fire("ข้อผิดพลาด", "ระบุปีไม่ถูกต้อง", "warning"); return; }
    if (count5 === 0 && count4 === 0 && count3 === 0) { Swal.fire("ข้อผิดพลาด", "ระบุจำนวนกลุ่มอย่างน้อย 1 ประเภท", "warning"); return; }

    Swal.fire({
      title: "ยืนยันการสร้างกลุ่ม?",
      html: `สร้างกลุ่มสำหรับปี: ${year}<br/>โควต้าที่ใช้: ${usedStudents} คน`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "ยืนยัน",
      cancelButtonText: "ยกเลิก"
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await GenerateGroups({ year, count_5: count5, count_4: count4, count_3: count3 });
          await Swal.fire("สำเร็จ!", "สร้างกลุ่มเรียบร้อย", "success");
          setCount5(0); setCount4(0); setCount3(0);
          await fetchGroups();
        } catch (error: any) {
          Swal.fire("Error", error.response?.data?.error || "Failed", "error");
        }
      }
    });
  };

  return (
    <div className="admin-page-container">
      <div className="content-wrapper">

        {/* --- SECTION 1: FORM --- */}
        <div className="card">
          <div className="card-header">
            <h1 className="card-title">สร้างกลุ่มโครงงาน</h1>
          </div>

          <div className="card-body">
            {/* Stats */}
            <div className="stats-box">
              <div className="stat-item">
                <span>จำนวนนักศึกษาทั้งหมด</span>
                <span className="stat-number">{totalStudents}</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <span style={{ color: remainingStudents < 0 ? '#ef4444' : '#22c55e' }}>คงเหลือ</span>
                <span
                  className="stat-number"
                  style={{ color: remainingStudents < 0 ? '#ef4444' : '#22c55e' }}
                >
                  {remainingStudents}
                </span>
              </div>
            </div>

            {/* Form Inputs */}
            <div className="form-container">
              <div className="form-row">
                <label className="form-label">ปีการศึกษา :</label>
                <div className="input-group">
                  <input
                    type="number"
                    className="form-input"
                    value={year}
                    onChange={(e) => setYear(parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
              <div className="form-row">
                <label className="form-label">กลุ่มละ 5 คน :</label>
                <div className="input-group">
                  <input
                    type="number"
                    className="form-input"
                    min="0" 
                    value={count5 === 0 ? '' : count5}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      setCount5(val < 0 ? 0 : val); 
                    }}
                    onKeyDown={(evt) => ["e", "E", "+", "-"].includes(evt.key) && evt.preventDefault()} // 3. ป้องกันการพิมตัวอักษรที่ไม่จำเป็น
                    placeholder="0"
                  />
                  <span>กลุ่ม</span>
                </div>
              </div>
              <div className="form-row">
                <label className="form-label">กลุ่มละ 4 คน :</label>
                <div className="input-group">
                  <input
                    type="number"
                    className="form-input"
                    min="0"
                    value={count4 === 0 ? '' : count4}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      setCount4(val < 0 ? 0 : val);
                    }}
                    onKeyDown={(evt) => ["e", "E", "+", "-"].includes(evt.key) && evt.preventDefault()}
                    placeholder="0"
                  />
                  <span>กลุ่ม</span>
                </div>
              </div>
              <div className="form-row">
                <label className="form-label">กลุ่มละ 3 คน :</label>
                <div className="input-group">
                  <input
                    type="number"
                    className="form-input"
                    min="0" 
                    value={count3 === 0 ? '' : count3}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      setCount3(val < 0 ? 0 : val); 
                    }}
                    onKeyDown={(evt) => ["e", "E", "+", "-"].includes(evt.key) && evt.preventDefault()} // 3. ป้องกันการพิมตัวอักษรที่ไม่จำเป็น
                    placeholder="0"
                  />
                  <span>กลุ่ม</span>
                </div>
              </div>

              <div className="submit-btn-wrapper">
                <button className="btn-submit" onClick={handleSubmit}>ยืนยันการสร้างกลุ่ม</button>
              </div>
            </div>
          </div>
        </div>

        {/* --- SECTION 2: LIST --- */}
        <div>
          <div className="list-header">
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <h2 className="list-title">จัดการข้อมูลกลุ่ม</h2>
              <span className="list-subtitle">ปีการศึกษา {year}</span>
            </div>
            <div>
              ปีการศึกษา:
              <input
                type="number"
                className="year-filter"
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          <div style={{ minHeight: '300px' }}>
            {loading ? (
              <p className="loading-text">กำลังโหลดข้อมูล...</p>
            ) : groups.length === 0 ? (
              <div className="empty-state">
                ไม่พบข้อมูลกลุ่มในปีการศึกษานี้
              </div>
            ) : (
              <div className="grid-container">
                {groups.map((group) => {
                  const current = group.group_members?.length || 0;
                  const max = group.membership;
                  const isFull = current >= max;
                  const isOver = current > max;

                  // กำหนด Class สีตามเงื่อนไข
                  const colorClass = isOver ? 'red' : isFull ? 'green' : 'blue';
                  const advisor = group.teacher ? `${group.teacher.firstname} ${group.teacher.lastname}` : "ไม่มีอาจารย์ที่ปรึกษา";

                  return (
                    <div key={group.ID} className="group-card">
                      {/* Status Bar */}
                      <div className={`status-bar bg-${colorClass}`}></div>

                      <div className="card-info">
                        <div className="card-header-row">
                          <h3 className="group-number">G-{group.group_number}</h3>
                          <span className={`status-badge text-${colorClass}`}>
                            {isOver ? 'เกินจำนวนที่กำหนด' : isFull ? 'เต็มแล้ว' : 'ว่าง'}
                          </span>
                        </div>
                        <div className="info-text">
                          <span>อาจารย์ที่ปรึกษา:</span>
                          <b>{advisor}</b>
                        </div>
                        <div className="info-text">
                          <span>สมาชิก:</span>
                          <b>{current} / {max}</b>
                        </div>
                        <div className="info-text">
                          <span>สถานะ:</span>
                          <span>{group.group_status}</span>
                        </div>
                      </div>

                      <div className="card-footer">
                        <button className="btn-detail" onClick={() => handleManageGroup(group.ID)}>
                          รายละเอียด
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {isModalOpen && (
          <GroupManagementModal isOpen={isModalOpen} onClose={handleCloseModal} groupId={selectedGroupId} />
        )}
      </div>
    </div>
  );
};

export default AdminGroupPage;