"use client";
import { useState, useEffect, useRef } from 'react';
import { ListUsers, ImportUsersCSV, CreateUser, GetGenders, GetBranches, GetRoles, GetUserStatuses, DeleteUser, UpdateUser } from '../../../services/user';
import { UserProfileInterface, GenderInterface, BranchInterface, RoleInterface, StatusInterface, CreateUserInterface } from '../../../interfaces/Users';
import "../../../style/import-user.css";
import "../../../style/admin-dashboard.css";
import { CloudUploadOutlined, DownloadOutlined, TeamOutlined, SearchOutlined, PlusOutlined, SaveOutlined, DeleteOutlined, EditOutlined, CheckSquareOutlined } from '@ant-design/icons';
import Swal from 'sweetalert2';

export default function UsersManagePage() {
    // --- State: Data ---
    const [users, setUsers] = useState<UserProfileInterface[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // --- State: Filters ---
    const [selectedGender, setSelectedGender] = useState<number>(0);
    const [selectedBranch, setSelectedBranch] = useState<number>(0);
    const [selectedRole, setSelectedRole] = useState<number>(0);
    const [selectedStatus, setSelectedStatus] = useState<number>(0);

    // --- State: Bulk Delete ---
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    // --- State: Master Data for Dropdowns ---
    const [genders, setGenders] = useState<GenderInterface[]>([]);
    const [branches, setBranches] = useState<BranchInterface[]>([]);
    const [roles, setRoles] = useState<RoleInterface[]>([]);
    const [statuses, setStatuses] = useState<StatusInterface[]>([]);

    // --- State: Import Modal ---
    const [showImport, setShowImport] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- State: Create User Modal ---
    const [showCreate, setShowCreate] = useState(false);
    const [newUser, setNewUser] = useState<CreateUserInterface>({
        username: "", password: "", firstname: "", lastname: "",
        email: "", phone: "",
        gender_id: 1, branch_id: 1, role_id: 3, status_id: 1
    });

    // --- State: Edit User Modal ---
    const [showEdit, setShowEdit] = useState(false);
    const [editingUser, setEditingUser] = useState<{ id: number; firstname: string; lastname: string; status_id: number } | null>(null);

    // Fetch data
    const fetchAllData = async (userParams?: Record<string, any>) => {
        setLoading(true);
        try {
            const [usersRes, gendersRes, branchesRes, rolesRes, statusesRes] = await Promise.all([
                ListUsers(userParams),
                GetGenders(),
                GetBranches(),
                GetRoles(),
                GetUserStatuses()
            ]);

            if (usersRes.status === 200) {
                const sortedUsers = usersRes.data.sort((a: any, b: any) => (a.ID || 0) - (b.ID || 0));
                setUsers(sortedUsers);
            }
            if (gendersRes.status === 200) setGenders(gendersRes.data);
            if (branchesRes.status === 200) setBranches(branchesRes.data);
            if (rolesRes.status === 200) setRoles(rolesRes.data);
            if (statusesRes.status === 200) setStatuses(statusesRes.data);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, []);

    // Debounced Search
    useEffect(() => {
        const params: Record<string, any> = {};
        if (searchTerm.trim() !== "") params.q = searchTerm.trim();
        if (selectedGender !== 0) params.gender_id = selectedGender;
        if (selectedBranch !== 0) params.branch_id = selectedBranch;
        if (selectedRole !== 0) params.role_id = selectedRole;
        if (selectedStatus !== 0) params.status_id = selectedStatus;

        const t = setTimeout(() => {
            fetchAllData(params);
        }, 400);

        return () => clearTimeout(t);
    }, [searchTerm, selectedGender, selectedBranch, selectedRole, selectedStatus]);

    // --- Filter Logic ---
    const filteredUsers = users.filter(user => {
        const term = searchTerm.trim().toLowerCase();
        const matchesText = !term || (
            (user.firstname || '').toLowerCase().includes(term) ||
            (user.lastname || '').toLowerCase().includes(term) ||
            (user.username || '').toLowerCase().includes(term)
        );
        const matchesGender = selectedGender === 0 || (user.gender && (user.gender.ID === selectedGender || user.gender_id === selectedGender));
        const matchesBranch = selectedBranch === 0 || (user.branch && (user.branch.ID === selectedBranch || user.branch_id === selectedBranch));
        const matchesRole = selectedRole === 0 || (user.role && (user.role.ID === selectedRole || user.role_id === selectedRole));
        const matchesStatus = selectedStatus === 0 || (user.status && (user.status.ID === selectedStatus || user.status_id === selectedStatus));
        return matchesText && matchesGender && matchesBranch && matchesRole && matchesStatus;
    });

    // --- Bulk Delete Logic ---
    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            // เลือกเฉพาะ user ที่แสดงผลอยู่ และไม่ใช่ Admin
            const allIds = filteredUsers
                .filter(u => u.role?.role !== 'Admin' && u.ID)
                .map(u => u.ID!);
            setSelectedIds(allIds);
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (id: number) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(prevId => prevId !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;

        const result = await Swal.fire({
            title: `ลบผู้ใช้งาน ${selectedIds.length} คน?`,
            text: "การกระทำนี้ไม่สามารถย้อนกลับได้",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#9a0120',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'ยืนยันการลบ',
            cancelButtonText: 'ยกเลิก'
        });

        if (result.isConfirmed) {
            Swal.fire({
                title: 'กำลังลบ...',
                html: 'กรุณารอสักครู่',
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading()
            });

            try {
                // วนลูปลบทีละ ID (Promise.all เพื่อทำพร้อมกัน)
                await Promise.all(selectedIds.map(id => DeleteUser(id)));

                Swal.fire({
                    icon: 'success',
                    title: 'ลบสำเร็จ',
                    text: `ลบผู้ใช้งาน ${selectedIds.length} รายการเรียบร้อยแล้ว`,
                    timer: 1500,
                    showConfirmButton: false
                });

                setSelectedIds([]); // เคลียร์รายการที่เลือก
                fetchAllData(); // โหลดข้อมูลใหม่
            } catch (error) {
                Swal.fire({
                    icon: 'error',
                    title: 'เกิดข้อผิดพลาด',
                    text: 'บางรายการอาจลบไม่สำเร็จ'
                });
            }
        }
    };

    // --- Import Logic ---
    const handleBoxClick = () => !isUploading && fileInputRef.current?.click();
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const selectedFile = e.target.files[0];
            if (!selectedFile.name.endsWith(".csv")) {
                Swal.fire({ icon: 'warning', title: 'ไฟล์ไม่ถูกต้อง', text: 'เลือกไฟล์ .csv เท่านั้น', timer: 2000 });
                return;
            }
            setFile(selectedFile);
        }
    };
    const handleDownloadTemplate = () => {
        const csvHeader = "username,password,firstname,lastname,email,phone,gender_id,branch_id,role_id,status_id";
        const csvExample = "B6600001,123456,Somchai,Rakdee,somchai@email.com,0811111111,1,1,2,1";
        const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csvHeader + "\n" + csvExample);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "users_template.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    const handleUpload = async () => {
        if (!file) return Swal.fire({ icon: 'warning', title: 'กรุณาเลือกไฟล์ก่อน', timer: 1500 });
        const confirmResult = await Swal.fire({
            title: `นำเข้าไฟล์ "${file.name}"?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'ยืนยัน',
            confirmButtonColor: '#1f4d2b'
        });
        if (confirmResult.isConfirmed) {
            setIsUploading(true);
            try {
                Swal.fire({ title: 'กำลังอัปโหลด...', didOpen: () => Swal.showLoading() });
                const res = await ImportUsersCSV(file);
                if (res.status === 200) {
                    Swal.fire({ icon: 'success', title: 'สำเร็จ!', text: res.data.message, timer: 1500, showConfirmButton: false });
                    setFile(null); setShowImport(false); fetchAllData();
                } else {
                    Swal.fire({ icon: 'error', title: 'ข้อผิดพลาด', text: res.data.error });
                }
            } catch (error: any) {
                Swal.fire({ icon: 'error', title: 'นำเข้าไม่สำเร็จ', text: error.response?.data?.error || "Error" });
            } finally { setIsUploading(false); }
        }
    };

    // --- Create User Logic ---
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === "phone") {
            const numericValue = value.replace(/\D/g, "");
            if (numericValue.length > 10) return;
            setNewUser({ ...newUser, [name]: numericValue });
            return;
        }
        setNewUser({ ...newUser, [name]: name.includes("id") ? Number(value) : value });
    };
    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUser.username || !newUser.password || !newUser.firstname) return Swal.fire({ icon: 'warning', title: 'ข้อมูลไม่ครบ' });
        if (newUser.phone && !/^\d{10}$/.test(newUser.phone)) return Swal.fire({ icon: 'warning', title: 'เบอร์โทรไม่ถูกต้อง' });

        const result = await Swal.fire({ title: 'ยืนยันการเพิ่ม?', showCancelButton: true, confirmButtonText: 'เพิ่มเลย', confirmButtonColor: '#1f4d2b' });
        if (result.isConfirmed) {
            try {
                const res = await CreateUser(newUser);
                if (res.status === 201) {
                    Swal.fire({ icon: 'success', title: 'สำเร็จ', timer: 1500, showConfirmButton: false });
                    setShowCreate(false); fetchAllData();
                    setNewUser({ username: "", password: "", firstname: "", lastname: "", email: "", phone: "", gender_id: 1, branch_id: 1, role_id: 3, status_id: 1 });
                } else {
                    Swal.fire({ icon: 'error', title: 'Error', text: res.data.error });
                }
            } catch (error: any) {
                Swal.fire({ icon: 'error', title: 'Error', text: error.response?.data?.error });
            }
        }
    };

    // --- Delete Single User Logic ---
    const handleDelete = async (id: number) => {
        const result = await Swal.fire({ title: 'แน่ใจหรือไม่?', text: "ลบแล้วกู้คืนไม่ได้!", icon: 'warning', showCancelButton: true, confirmButtonColor: '#9a0120', confirmButtonText: 'ลบเลย' });
        if (result.isConfirmed) {
            try {
                const res = await DeleteUser(id);
                if (res.status === 200) {
                    Swal.fire({ icon: 'success', title: 'ลบสำเร็จ', timer: 1500, showConfirmButton: false });
                    fetchAllData();
                } else { Swal.fire({ icon: 'error', title: 'ลบไม่สำเร็จ', text: res.data.error }); }
            } catch (error: any) { Swal.fire({ icon: 'error', title: 'Error', text: error.response?.data?.error }); }
        }
    };

    // --- Edit User Logic ---
    const handleEditClick = (user: UserProfileInterface) => {
        if (!user.ID) return;
        setEditingUser({ id: user.ID, firstname: user.firstname || "", lastname: user.lastname || "", status_id: user.status_id || 1 });
        setShowEdit(true);
    };
    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;
        const result = await Swal.fire({ title: 'ยืนยันการแก้ไข?', showCancelButton: true, confirmButtonText: 'บันทึก', confirmButtonColor: '#1f4d2b' });
        if (result.isConfirmed) {
            try {
                const res = await UpdateUser(editingUser.id, { firstname: editingUser.firstname, lastname: editingUser.lastname, status_id: editingUser.status_id });
                if (res.status === 200) {
                    Swal.fire({ icon: 'success', title: 'แก้ไขสำเร็จ', timer: 1500, showConfirmButton: false });
                    setShowEdit(false); setEditingUser(null); fetchAllData();
                } else { Swal.fire({ icon: 'error', title: 'Error', text: res.data.error }); }
            } catch (error: any) { Swal.fire({ icon: 'error', title: 'Error', text: error.response?.data?.error }); }
        }
    };

    return (
        <div className="dashboard-container">
            <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1>จัดการผู้ใช้งาน</h1>
                    <p>รายชื่อผู้ใช้งานทั้งหมดในระบบ</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => setShowCreate(true)} style={{ backgroundColor: '#0958d9', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', gap: '8px', alignItems: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                        <PlusOutlined /> เพิ่มผู้ใช้งาน
                    </button>
                    <button onClick={() => setShowImport(true)} style={{ backgroundColor: '#9a0120', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', gap: '8px', alignItems: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                        <CloudUploadOutlined /> นำเข้า CSV
                    </button>
                </div>
            </div>

            <div className="section-main" style={{ marginTop: '20px' }}>
                {/* Filters */}
                <div style={{ marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative', minWidth: '280px', flex: '1 1 320px' }}>
                        <SearchOutlined style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
                        <input type="text" placeholder="ค้นหาชื่อ หรือ รหัสนักศึกษา..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '10px 10px 10px 35px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '0.9rem' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <select value={selectedRole} onChange={(e) => setSelectedRole(Number(e.target.value))} className="form-input" style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ddd' }}>
                            <option value={0}>บทบาท: ทั้งหมด</option>
                            {roles.map(r => <option key={r.ID} value={r.ID}>{r.role}</option>)}
                        </select>
                        <select value={selectedBranch} onChange={(e) => setSelectedBranch(Number(e.target.value))} className="form-input" style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ddd' }}>
                            <option value={0}>สาขา: ทั้งหมด</option>
                            {branches.map(b => <option key={b.ID} value={b.ID}>{b.branch_name}</option>)}
                        </select>
                        <select value={selectedGender} onChange={(e) => setSelectedGender(Number(e.target.value))} className="form-input" style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ddd' }}>
                            <option value={0}>เพศ: ทั้งหมด</option>
                            {genders.map(g => <option key={g.ID} value={g.ID}>{g.name}</option>)}
                        </select>
                        <select value={selectedStatus} onChange={(e) => setSelectedStatus(Number(e.target.value))} className="form-input" style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ddd' }}>
                            <option value={0}>สถานะ: ทั้งหมด</option>
                            {statuses.map(s => <option key={s.ID} value={s.ID}>{s.status}</option>)}
                        </select>
                        <button onClick={() => { setSearchTerm(''); setSelectedRole(0); setSelectedBranch(0); setSelectedGender(0); setSelectedStatus(0); }} style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #ddd', background: 'white', cursor: 'pointer' }}>ล้าง</button>
                    </div>
                </div>

                {/* Bulk Action Bar */}
                {selectedIds.length > 0 && (
                    <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#fff1f0', border: '1px solid #ab0224', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <span style={{ color: '#9a0120', fontWeight: 'bold' }}>เลือก {selectedIds.length} รายการ</span>
                        <button
                            onClick={handleBulkDelete}
                            style={{ backgroundColor: '#9a0120', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                        >
                            <DeleteOutlined /> ลบรายการที่เลือก
                        </button>
                    </div>
                )}

                {loading ? (
                    <p style={{ textAlign: 'center', padding: '40px', color: '#666' }}>กำลังโหลดข้อมูล...</p>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    {/* Checkbox หัวตาราง */}
                                    <th style={{ width: '40px', textAlign: 'center' }}>
                                        <input
                                            type="checkbox"
                                            onChange={handleSelectAll}
                                            checked={filteredUsers.length > 0 && selectedIds.length === filteredUsers.filter(u => u.role?.role !== 'Admin').length}
                                            disabled={filteredUsers.length === 0}
                                            style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                                        />
                                    </th>
                                    <th style={{ width: '60px', textAlign: 'center' }}>ID</th>
                                    <th>ชื่อผู้ใช้งาน</th>
                                    <th>ชื่อ - นามสกุล</th>
                                    <th>บทบาท</th>
                                    <th>สาขา</th>
                                    <th>ผ่านรายวิชา</th>
                                    <th>สถานะบัญชี</th>
                                    <th style={{ textAlign: 'center' }}>จัดการ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.length === 0 ? (
                                    <tr><td colSpan={9} style={{ textAlign: 'center', padding: '30px', color: '#999' }}>ไม่พบข้อมูลผู้ใช้งาน</td></tr>
                                ) : (
                                    filteredUsers.map((user) => (
                                        <tr key={user.ID} style={selectedIds.includes(user.ID!) ? { backgroundColor: '#fff1f0' } : {}}>
                                            {/* Checkbox ในแถว */}
                                            <td style={{ textAlign: 'center' }}>
                                                {user.role?.role !== 'Admin' && (
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedIds.includes(user.ID!)}
                                                        onChange={() => user.ID && handleSelectOne(user.ID)}
                                                        style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                                                    />
                                                )}
                                            </td>
                                            <td style={{ fontWeight: 'bold', color: '#9a0120', textAlign: 'center' }}>{user.ID}</td>
                                            <td>{user.username}</td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <div style={{ width: '30px', height: '30px', background: '#f0f0f0', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                                        <TeamOutlined style={{ color: '#666' }} />
                                                    </div>
                                                    {user.firstname} {user.lastname}
                                                </div>
                                            </td>
                                            <td>
                                                <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600, backgroundColor: user.role?.role === 'Admin' ? '#333' : (user.role?.role === 'Teacher' ? '#e6f7ff' : '#f6ffed'), color: user.role?.role === 'Admin' ? '#fff' : (user.role?.role === 'Teacher' ? '#096dd9' : '#389e0d') }}>
                                                    {user.role?.role || "-"}
                                                </span>
                                            </td>
                                            <td>{user.branch?.branch_name || "-"}</td>

                                            <td>
                                                {user.role?.role === 'Student' ? (
                                                    <span style={{
                                                        color: user.pass ? 'green' : 'red',
                                                        fontWeight: 500
                                                    }}>
                                                        {user.pass ? "Pass" : "Fail"}
                                                    </span>
                                                ) : (
                                                    <span style={{ color: '#ccc' }}>-</span>
                                                )}
                                            </td>

                                            <td><span style={{ color: user.status?.status === 'Active' ? 'green' : 'red', fontWeight: 500 }}>{user.status?.status || "-"}</span></td>
                                            <td style={{ textAlign: 'center' }}>
                                                {user.role?.role !== 'Admin' ? (
                                                    <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                                                        <button onClick={() => handleEditClick(user)} style={{ backgroundColor: 'transparent', border: 'none', cursor: 'pointer', color: '#faad14', fontSize: '1.2rem' }} title="แก้ไข">
                                                            <EditOutlined />
                                                        </button>
                                                        <button onClick={() => user.ID && handleDelete(user.ID)} style={{ backgroundColor: 'transparent', border: 'none', cursor: 'pointer', color: '#ff4d4f', fontSize: '1.2rem' }} title="ลบ">
                                                            <DeleteOutlined />
                                                        </button>
                                                    </div>
                                                ) : <span style={{ color: '#ccc', fontSize: '1.2rem', cursor: 'not-allowed' }}>🚫</span>}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal Import (คงเดิม) */}
            {showImport && (
                <div className="modal-overlay" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div className="import-card" style={{ width: '90%', maxWidth: '600px', backgroundColor: 'white', padding: '20px', borderRadius: '10px' }}>
                        <div className="import-header" style={{ position: 'relative' }}>
                            <h2>นำเข้าข้อมูลผู้ใช้งาน (Import Users)</h2>
                            <button onClick={() => setShowImport(false)} style={{ position: 'absolute', top: '0', right: '5px', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                        </div>
                        <div className="import-content">
                            <div className="template-section">
                                <button onClick={handleDownloadTemplate} className="btn-template"><DownloadOutlined /> ดาวน์โหลด Template</button>
                            </div>
                            <div className="upload-area" onClick={handleBoxClick} style={{ border: '2px dashed #ccc', padding: '20px', textAlign: 'center', marginTop: '15px', cursor: 'pointer' }}>
                                <input type="file" accept=".csv" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} disabled={isUploading} />
                                <CloudUploadOutlined style={{ fontSize: '2rem', color: '#9a0120' }} />
                                <p>{file ? file.name : "คลิกเพื่อเลือกไฟล์ CSV"}</p>
                            </div>
                            <div className="action-buttons" style={{ marginTop: '20px', textAlign: 'right' }}>
                                <button className="btn-upload" onClick={handleUpload} disabled={!file || isUploading} style={{ backgroundColor: '#1f4d2b', color: 'white', padding: '8px 16px', border: 'none', borderRadius: '4px' }}>
                                    {isUploading ? 'กำลังอัปโหลด...' : 'ยืนยัน'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Create (คงเดิม) */}
            {showCreate && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', width: '90%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <h2><PlusOutlined /> เพิ่มผู้ใช้งานใหม่</h2>
                            <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                        </div>
                        <form onSubmit={handleCreateSubmit} className="create-user-form">
                            <div className="form-group"><label>Username *</label><input className="form-input" name="username" value={newUser.username} onChange={handleInputChange} /></div>
                            <div className="form-group"><label>Password *</label><input className="form-input" type="password" name="password" value={newUser.password} onChange={handleInputChange} /></div>
                            <div className="form-group"><label>ชื่อจริง *</label><input className="form-input" name="firstname" value={newUser.firstname} onChange={handleInputChange} /></div>
                            <div className="form-group"><label>นามสกุล *</label><input className="form-input" name="lastname" value={newUser.lastname} onChange={handleInputChange} /></div>
                            <div className="form-group"><label>อีเมล</label><input className="form-input" name="email" value={newUser.email} onChange={handleInputChange} /></div>
                            <div className="form-group"><label>เบอร์โทร</label><input className="form-input" name="phone" value={newUser.phone} onChange={handleInputChange} /></div>
                            <div className="form-group"><label>เพศ</label><select className="form-input" name="gender_id" value={newUser.gender_id} onChange={handleInputChange}>{genders.map(g => <option key={g.ID} value={g.ID}>{g.name}</option>)}</select></div>
                            <div className="form-group"><label>สาขา</label><select className="form-input" name="branch_id" value={newUser.branch_id} onChange={handleInputChange}>{branches.map(b => <option key={b.ID} value={b.ID}>{b.branch_name}</option>)}</select></div>
                            <div className="form-group"><label>บทบาท</label><select className="form-input" name="role_id" value={newUser.role_id} onChange={handleInputChange}>{roles.filter(r => r.role !== 'Admin').map(r => <option key={r.ID} value={r.ID}>{r.role}</option>)}</select></div>
                            <div className="form-group"><label>สถานะ</label><select className="form-input" name="status_id" value={newUser.status_id} onChange={handleInputChange}>{statuses.map(s => <option key={s.ID} value={s.ID}>{s.status}</option>)}</select></div>
                            <div style={{ marginTop: '15px' }}><button type="submit" className="btn-save"><SaveOutlined /> บันทึกข้อมูล</button></div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Edit (คงเดิม) */}
            {showEdit && editingUser && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', width: '90%', maxWidth: '500px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                            <h2 style={{ margin: 0 }}><EditOutlined /> แก้ไขข้อมูลผู้ใช้</h2>
                            <button onClick={() => setShowEdit(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#999' }}>×</button>
                        </div>
                        <form onSubmit={handleEditSubmit}>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>ชื่อจริง (Firstname)</label>
                                <input className="form-input" value={editingUser.firstname} onChange={(e) => setEditingUser({ ...editingUser, firstname: e.target.value })} required style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>นามสกุล (Lastname)</label>
                                <input className="form-input" value={editingUser.lastname} onChange={(e) => setEditingUser({ ...editingUser, lastname: e.target.value })} required style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>สถานะ (Status)</label>
                                <select className="form-input" value={editingUser.status_id} onChange={(e) => setEditingUser({ ...editingUser, status_id: Number(e.target.value) })} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}>
                                    {statuses.map((s) => (<option key={s.ID} value={s.ID}>{s.status}</option>))}
                                </select>
                            </div>
                            <div style={{ textAlign: 'right', marginTop: '20px' }}>
                                <button type="button" onClick={() => setShowEdit(false)} style={{ marginRight: '10px', padding: '8px 16px', border: '1px solid #ddd', background: 'white', borderRadius: '4px', cursor: 'pointer' }}>ยกเลิก</button>
                                <button type="submit" style={{ padding: '8px 16px', border: 'none', background: '#0958d9', color: 'white', borderRadius: '4px', cursor: 'pointer' }}>บันทึกการแก้ไข</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}