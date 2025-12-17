'use client'

import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import GroupManagementModal from "../../../components/GroupModal"; 
import { GetEligibleStudentCount, GenerateGroups, GetGroupProjects } from "../../../services/group"; 
import { GroupProject } from "../../../interfaces/Group"; 
import { button } from "@material-tailwind/react";

const AdminGroupPage = () => {
  // State ข้อมูล
  const [totalStudents, setTotalStudents] = useState<number>(0);
  const [groups, setGroups] = useState<GroupProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState<number>(new Date().getFullYear() + 543); // ปีปัจจุบัน (พ.ศ.)
  
  // State ช่องกรอกจำนวนกลุ่ม
  const [count5, setCount5] = useState<number>(0);
  const [count4, setCount4] = useState<number>(0);
  const [count3, setCount3] = useState<number>(0);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedGroupId, setSelectedGroupId] = useState<number>(0);
  
    // โหลดจำนวนนักศึกษาเมื่อเข้าหน้าเว็บ
  useEffect(() => {
    fetchStudentCount();
  }, []);

  const fetchStudentCount = async () => {
    try {
      const res = await GetEligibleStudentCount();
      if (res.data) {
        setTotalStudents(res.data.count);
      }
    } catch (error) {
      console.error("Error fetching student count:", error);
    }
  };

  // 1. Fetch Groups เมื่อ year เปลี่ยน
  useEffect(() => {
    fetchGroups();
  }, [year]);

  const fetchGroups = async () => {
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
      Swal.fire("Error", "ไม่สามารถดึงข้อมูลกลุ่มได้", "error");
    } finally {
      setLoading(false);
    }
  };

  // 2. เปิด Modal จัดการ
  const handleManageGroup = (groupId: number) => {
    setSelectedGroupId(groupId);
    setIsModalOpen(true);
  };

  // 3. ปิด Modal และ Refresh ข้อมูล (เผื่อมีการลบกลุ่มหรือแก้สมาชิก)
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedGroupId(0);
    fetchGroups(); // Refresh list logic
  };
  

  // Logic คำนวณนักศึกษาที่เหลือ (Real-time)
  const usedStudents = (count5 * 5) + (count4 * 4) + (count3 * 3);
  const remainingStudents = totalStudents - usedStudents;

  // Function กดปุ่มยืนยัน
  const handleSubmit = async () => {
    // Validation เบื้องต้น
    if (year < 2500) {
      Swal.fire("ข้อผิดพลาด", "กรุณาระบุปีการศึกษาให้ถูกต้อง", "warning");
      return;
    }
    if (count5 === 0 && count4 === 0 && count3 === 0) {
      Swal.fire("ข้อผิดพลาด", "กรุณาระบุจำนวนกลุ่มอย่างน้อย 1 ประเภท", "warning");
      return;
    }

    Swal.fire({
      title: "ยืนยันการสร้างกลุ่ม?",
      html: `
        <div class="text-left text-sm">
          <p>ปีการศึกษา: <b>${year}</b></p>
          <p>กลุ่มละ 5 คน: <b>${count5}</b> กลุ่ม</p>
          <p>กลุ่มละ 4 คน: <b>${count4}</b> กลุ่ม</p>
          <p>กลุ่มละ 3 คน: <b>${count3}</b> กลุ่ม</p>
          <hr class="my-2"/>
          <p>ใช้โควต้านักศึกษาไป: <b>${usedStudents}</b> คน</p>
          <p>คงเหลือ: <b style="color:${remainingStudents < 0 ? 'red' : 'green'}">${remainingStudents}</b> คน</p>
        </div>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "ยืนยัน",
      cancelButtonText: "ยกเลิก"
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          // เรียก API สร้างกลุ่ม
          await GenerateGroups({
            year: year,
            count_5: count5,
            count_4: count4,
            count_3: count3,
          });

          await Swal.fire("สำเร็จ!", "สร้างกลุ่มเรียบร้อยแล้ว", "success");
          
          // Reset ค่า หรือ Redirect ตามต้องการ
          setCount5(0);
          setCount4(0);
          setCount3(0);

          await fetchGroups();
          
        } catch (error: any) {
          Swal.fire("เกิดข้อผิดพลาด", error.response?.data?.error || "ไม่สามารถสร้างกลุ่มได้", "error");
        }
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8" style={{margin: "20px"}}>
      {/* Wrapper เพื่อคุมความกว้างเนื้อหาทั้งหมดให้เท่ากัน */}
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* --- SECTION 1: สร้างกลุ่มโครงงาน --- */}
        <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100 flex flex-col justify-center">
          
          {/* Header Card */}
          <div className="bg-white p-6 md:p-10 border-b border-gray-200">
            <h1 className="text-3xl md:text-4xl font-bold text-red-800 tracking-wide border-l-4 border-red-800 pl-4">
              สร้างกลุ่มโครงงาน
            </h1>
          </div>

          <div className="p-6 md:p-10 space-y-8">
            
            {/* Stats Display */}
            <div className="bg-red-50 rounded-lg p-6 flex flex-col md:flex-row justify-around items-center gap-4 text-center md:text-left">
              <div className="text-lg md:text-xl text-gray-800">
                จำนวนนักศึกษาทั้งหมด <br/>
                <span className="font-bold text-3xl md:text-4xl block mt-1"> {totalStudents} </span>
              </div>
              <div className="h-px w-full md:w-px md:h-16 bg-red-200"></div>
              <div className="text-lg md:text-xl text-red-700">
                จำนวนนักศึกษาที่เหลือ <br/>
                <span className={`font-bold text-3xl md:text-4xl block mt-1 ${remainingStudents < 0 ? "underline decoration-red-500" : ""}`}>
                  {remainingStudents}
                </span>
              </div>
            </div>

            {/* Form Inputs */}
            <div className="max-w-3xl mx-auto space-y-6">
              
              {/* ปีการศึกษา */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-4">
                <label className="text-lg font-medium text-gray-700 w-full md:w-1/3 text-left md:text-right">
                  ประจำปีการศึกษา
                </label>
                <div className="w-full md:w-2/3">
                    <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(parseInt(e.target.value) || 0)}
                    className="w-full md:w-40 border-2 border-gray-300 px-3 py-2 text-center text-lg rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                    />
                </div>
              </div>

              {/* กลุ่มละ 5 คน */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-4">
                <label className="text-lg font-medium text-gray-700 w-full md:w-1/3 text-left md:text-right">
                  กลุ่มละ 5 คน
                </label>
                <div className="flex items-center gap-3 w-full md:w-2/3">
                  <input
                    type="number"
                    min="0"
                    value={count5 === 0 ? '' : count5}
                    onChange={(e) => setCount5(parseInt(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full md:w-40 border-2 border-gray-300 px-3 py-2 text-center text-lg rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                  />
                  <span className="text-lg text-gray-500">กลุ่ม</span>
                </div>
              </div>

              {/* กลุ่มละ 4 คน */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-4">
                <label className="text-lg font-medium text-gray-700 w-full md:w-1/3 text-left md:text-right">
                  กลุ่มละ 4 คน
                </label>
                <div className="flex items-center gap-3 w-full md:w-2/3">
                  <input
                    type="number"
                    min="0"
                    value={count4 === 0 ? '' : count4}
                    onChange={(e) => setCount4(parseInt(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full md:w-40 border-2 border-gray-300 px-3 py-2 text-center text-lg rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                  />
                  <span className="text-lg text-gray-500">กลุ่ม</span>
                </div>
              </div>

              {/* กลุ่มละ 3 คน */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-4">
                <label className="text-lg font-medium text-gray-700 w-full md:w-1/3 text-left md:text-right">
                  กลุ่มละ 3 คน
                </label>
                <div className="flex items-center gap-3 w-full md:w-2/3">
                  <input
                    type="number"
                    min="0"
                    value={count3 === 0 ? '' : count3}
                    onChange={(e) => setCount3(parseInt(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full md:w-40 border-2 border-gray-300 px-3 py-2 text-center text-lg rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                  />
                  <span className="text-lg text-gray-500">กลุ่ม</span>
                </div>
              </div>

              {/* ปุ่มยืนยัน - ปรับ Margin และ Padding ให้เหมาะสม */}
              <div className="pt-6 flex justify-center md:justify-end">
                <button
                    onClick={handleSubmit}
                    className="w-full md:w-auto bg-sky-400 hover:bg-sky-500 text-white shadow-md px-8 py-3 rounded-lg text-xl font-bold transition-all transform hover:scale-105"
                >
                    ยืนยันการสร้าง
                </button>
              </div>

            </div>
          </div>
        </div>

        {/* --- SECTION 2: จัดการข้อมูลกลุ่มโครงงาน --- */}
        <div className="bg-transparent border" style={{ padding: '100px '}}> {/* เอา border/shadow ออกเพื่อให้ดู Clean ขึ้น หรือใส่กลับได้ถ้าต้องการ */}
            
            {/* Header Section */}
            <div className="mb-6 flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-800 mb-2 border-l-4 border-gray-800 pl-4">
                      จัดการข้อมูลกลุ่ม
                  </h1>
                  <p className="text-gray-500 pl-5 text-sm">รายการกลุ่มทั้งหมดในปีการศึกษา {year}</p>
                </div>
      
                {/* Year Filter */}
                <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
                    <label className="text-sm font-semibold text-gray-700">แสดงปีการศึกษา:</label>
                    <input
                      type="number"
                      value={year}
                      onChange={(e) => setYear(parseInt(e.target.value) || 0)}
                      className="w-24 border border-gray-300 rounded px-2 py-1 text-center font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>
      
            {/* Content Grid */}
            <div className="min-h-[300px]">
              {loading ? (
                  <div className="text-center py-20 text-gray-400">กำลังโหลดข้อมูล...</div>
              ) : groups.length === 0 ? (
                  <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                      <p className="text-gray-500 text-lg">ไม่พบข้อมูลกลุ่มในปีการศึกษานี้</p>
                  </div>
              ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {groups.map((group) => {
                          const currentMembers = group.group_members ? group.group_members.length : 0;
                          const isFull = currentMembers >= group.membership;
                          const isOver = currentMembers > group.membership;

                          const advisorName = group.teacher 
                          ? `${group.teacher.firstname} ${group.teacher.lastname}` 
                          : "ยังไม่มีอาจารย์ที่ปรึกษา";
      
                          return (
                              <div key={group.ID} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300 flex flex-col overflow-hidden group">
                                  {/* Card Header Color Bar */}
                                  <div className={`h-2 w-full transition-colors ${isOver ? 'bg-red-500' : isFull ? 'bg-green-500' : 'bg-blue-500'}`} />
                                  
                                  <div className="p-5 flex-1">
                                      <div className="flex justify-between items-start mb-4">
                                          <h3 className="text-xl font-bold text-gray-800">G-{group.group_number}</h3>
                                          <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold ${
                                              isOver ? 'bg-red-50 text-red-600 border-red-200' :
                                              isFull ? 'bg-green-50 text-green-600 border-green-200' : 
                                              'bg-blue-50 text-blue-600 border-blue-200'
                                          }`}>
                                              {isOver ? 'Over Quota' : isFull ? 'เต็มแล้ว' : 'ว่าง'}
                                          </span>
                                      </div>
                                      
                                      <div className="text-gray-500 text-sm space-y-2">
                                          <p className="flex justify-between">
                                            <span>ที่ปรึกษา:</span>
                                            <span className="font-medium text-gray-800 text-right truncate max-w-[150px]">{advisorName}</span>
                                          </p>
                                          <p className="flex justify-between">
                                            <span>สมาชิก:</span>
                                            <span className="font-medium text-gray-800">{currentMembers} / {group.membership} คน</span>
                                          </p>
                                          <p className="flex justify-between">
                                            <span>สถานะ:</span>
                                            <span className="font-medium text-gray-800">{group.group_status}</span>
                                          </p>
                                      </div>
                                  </div>
      
                                  {/* Card Footer */}
                                  <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                                      <button 
                                          onClick={() => handleManageGroup(group.ID)}
                                          className="w-full py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-all shadow-sm text-sm"
                                      >
                                          แก้ไข / รายละเอียด
                                      </button>
                                  </div>
                              </div>
                          );
                      })}
                  </div>
              )}
            </div>
      
            {/* Modal */}
            {isModalOpen && (
              <GroupManagementModal 
                  isOpen={isModalOpen} 
                  onClose={handleCloseModal} 
                  groupId={selectedGroupId}
              />
            )} 
        </div>
        
      </div>
    </div>
  );
};

export default AdminGroupPage;