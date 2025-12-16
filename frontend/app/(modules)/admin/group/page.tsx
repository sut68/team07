// Page

'use client'

import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import GroupManagementModal from "../../../components/GroupModal";
import { GetEligibleStudentCount, GenerateGroups, GetGroupProjects } from "../../../services/group";
import { GroupProject } from "../../../interfaces/Group";

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
      <div className="min-h-screen bg-gray-50">
        
        <div className=" bg-white flex flex-col justify-center items-center shadow-xl rounded-xl">
          {/* หัวข้อ */}
          <h1 className="text-4xl font-bold text-red-800 text-left mb-10 tracking-wide border-b-5 border-red-900">
            สร้างกลุ่มโครงงาน
          </h1>

          {/* ส่วนแสดงผลข้อมูล (Stat) */}
          <div className="p-10 mt-10">
            <div className="text-xl md:text-2xl text-black font-medium">
              จำนวนนักศึกษา 
              <span className="font-bold"> {totalStudents} </span> คน
            </div>
            <div className="text-xl md:text-2xl text-red-600 font-medium">
              จำนวนนักศึกษาที่เหลือ 
              <span className={`font-bold ${remainingStudents < 0 ? "underline" : ""}`}>
                {remainingStudents}
              </span> คน 
            </div>
          </div>

          {/* Form Inputs */}
          <div className="">
            
            {/* ปีการศึกษา */}
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <label className="text-xl md:text-2xl text-black min-w-[200px]">ประจำปีการศึกษา</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value) || 0)}
                className="w-40 border-2 border-black px-2 py-1 text-center text-xl rounded-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            {/* กลุ่มละ 5 คน */}
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <label className="text-xl md:text-2xl text-black min-w-[200px]">กลุ่มละ 5 คน ทั้งหมด</label>
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  min="0"
                  value={count5 === 0 ? '' : count5} // ถ้าเป็น 0 ให้แสดงว่างๆ หรือแสดง 0 ตามชอบ
                  onChange={(e) => setCount5(parseInt(e.target.value) || 0)}
                  className="w-40 border-2 border-black px-2 py-1 text-center text-xl rounded-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <span className="text-xl md:text-2xl text-black">กลุ่ม</span>
              </div>
            </div>

            {/* กลุ่มละ 4 คน */}
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <label className="text-xl md:text-2xl text-black min-w-[200px]">กลุ่มละ 4 คน ทั้งหมด</label>
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  min="0"
                  value={count4 === 0 ? '' : count4}
                  onChange={(e) => setCount4(parseInt(e.target.value) || 0)}
                  className="w-40 border-2 border-black px-2 py-1 text-center text-xl rounded-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <span className="text-xl md:text-2xl text-black">กลุ่ม</span>
              </div>
            </div>

            {/* กลุ่มละ 3 คน */}
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <label className="text-xl md:text-2xl text-black min-w-[200px]">กลุ่มละ 3 คน ทั้งหมด</label>
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  min="0"
                  value={count3 === 0 ? '' : count3}
                  onChange={(e) => setCount3(parseInt(e.target.value) || 0)}
                  className="w-40 border-2 border-black px-2 py-1 text-center text-xl rounded-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <span className="text-xl md:text-2xl text-black">กลุ่ม</span>
              </div>
            </div>

            {/* ปุ่มยืนยัน */}
            <div className="m-20">
                <button
                    onClick={handleSubmit}
                    className="bg-sky-300 hover:bg-sky-500 p-10 text-black border-2 border-black rounded-sm text-xl font-bold "
                >
                    ยืนยัน
                </button>
            </div>

          </div>
        </div>

        <div className="h-full w-full max-w-full border-5 shadow-xl rounded-xl">
              {/* Header Section */}
              <div className="max-w-7xl mx-auto mb-8 mt-8 flex flex-col md:flex-row justify-between items-end md:items-center gap-5">
                  <div>
                    <h1 className="text-4xl font-bold text-red-800 text-left mb-10 tracking-wide border-b-5 border-red-900">
                        จัดการข้อมูลกลุ่มโครงงาน
                    </h1>
                    <p className="text-gray-500 mt-1">รายการกลุ่มทั้งหมดในปีการศึกษา {year}</p>
                  </div>
        
                  {/* Year Filter */}
                  <div className="flex items-center gap-3 bg-white p-2 rounded-lg shadow-sm border border-gray-200">
                      <label className="text-sm font-semibold text-gray-700 pl-2">ปีการศึกษา:</label>
                      <input
                        type="number"
                        value={year}
                        onChange={(e) => setYear(parseInt(e.target.value) || 0)}
                        className="w-24 border border-gray-300 rounded px-2 py-1 text-center font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                  </div>
              </div>
        
              {/* Content Section */}
              <div className="max-w-7xl mt-20">
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
                                <div key={group.ID} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden">
                                    {/* Card Header */}
                                    <div className={`h-2 w-full ${isOver ? 'bg-red-500' : isFull ? 'bg-green-500' : 'bg-blue-500'}`} />
                                    
                                    <div className="p-5 flex-1">
                                        <div className="flex justify-between items-start mb-3">
                                            <h3 className="text-xl font-bold text-gray-800">G-{group.group_number}</h3>
                                            <span className={`text-xs px-2 py-1 rounded-full border font-medium ${
                                                isOver ? 'bg-red-50 text-red-600 border-red-200' :
                                                isFull ? 'bg-green-50 text-green-600 border-green-200' : 
                                                'bg-blue-50 text-blue-600 border-blue-200'
                                            }`}>
                                                {isOver ? 'Over Quota' : isFull ? 'เต็มแล้ว' : 'ว่าง'}
                                            </span>
                                        </div>
                                        
                                        <div className="text-gray-600 text-sm mb-4 space-y-1">
                                            <p>อาจารย์ที่ปรึกษา: <b className="text-black">{advisorName}</b> </p>
                                            <p>สมาชิก: <b className="text-black">{currentMembers}</b> / {group.membership} คน</p>
                                            <p>สถานะ: <b className="text-black">{group.group_status}</b> </p>
                                        </div>
                                    </div>
        
                                    {/* Card Footer */}
                                    <div className="p-4 bg-gray-50 border-t border-gray-100">
                                        <button 
                                            onClick={() => handleManageGroup(group.ID)}
                                            className="w-full py-2 px-4 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 hover:text-blue-600 hover:border-blue-300 transition-colors shadow-sm text-sm"
                                        >
                                            แก้ไข
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
  );
};

export default AdminGroupPage;