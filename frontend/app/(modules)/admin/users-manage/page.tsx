"use client";
import { useState, useEffect, useRef } from 'react';
import { GetUsers, ImportUsersCSV, CreateUser, GetGenders, GetBranches, GetRoles, GetUserStatuses, DeleteUser, UpdateUser } from '../../../services/user';
import { UserProfileInterface, GenderInterface, BranchInterface, RoleInterface, StatusInterface, CreateUserInterface } from '../../../interfaces/Users';
import "../../../style/import-user.css";
import "../../../style/admin-dashboard.css";
import { CloudUploadOutlined, FileTextOutlined, DownloadOutlined, TeamOutlined, SearchOutlined, PlusOutlined, SaveOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';

export default function UsersManagePage() {
    // --- State: Data ---
    const [users, setUsers] = useState<UserProfileInterface[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

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
    const [editingUser, setEditingUser] = useState<{ id: number; firstname: string; lastname: string } | null>(null);

    // Fetch All Data
    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [usersRes, gendersRes, branchesRes, rolesRes, statusesRes] = await Promise.all([
                GetUsers(),
                GetGenders(),
                GetBranches(),
                GetRoles(),
                GetUserStatuses()
            ]);

            if (usersRes.status === 200) setUsers(usersRes.data);
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

    // Logic Import CSV
    const handleBoxClick = () => !isUploading && fileInputRef.current?.click();
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const selectedFile = e.target.files[0];
            if (!selectedFile.name.endsWith(".csv")) {
                alert("❌ กรุณาเลือกไฟล์ .csv เท่านั้น");
                return;
            }
            setFile(selectedFile);
        }
    };
    const handleDownloadTemplate = () => {
        const csvHeader = "username,password,firstname,lastname,email,phone,gender_id,branch_id,role_id,status_id";
        const csvExample = "B6600001,123456,Somchai,Rakdee,somchai@email.com,0811111111,1,1,1,1";
        const csvContent = "data:text/csv;charset=utf-8," + csvHeader + "\n" + csvExample;
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "users_template.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    const handleUpload = async () => {
        if (!file) return alert("⚠️ กรุณาเลือกไฟล์ก่อน");
        if (!confirm(`ยืนยันการนำเข้าไฟล์ "${file.name}"?`)) return;
        setIsUploading(true);
        try {
            const res = await ImportUsersCSV(file);
            if (res.status === 200) {
                alert(`✅ นำเข้าสำเร็จ!\n${res.data.message || ""}`);
                setFile(null);
                setShowImport(false);
                fetchAllData();
            } else {
                alert(`❌ เกิดข้อผิดพลาด: ${res.data.error}`);
            }
        } catch (error: any) {
            console.error("Upload Error:", error);
            // ดึงข้อความ Error จาก Backend มาแสดง
            if (error.response && error.response.data && error.response.data.error) {
                alert(`❌ นำเข้าไม่สำเร็จ:\n${error.response.data.error}`);
            } else {
                alert("❌ เชื่อมต่อ Server ไม่ได้ หรือเกิดข้อผิดพลาดที่ไม่ระบุ");
            }
        } finally {
            setIsUploading(false);
        }
    };

    // Logic Create User
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === "phone") {
            const numericValue = value.replace(/\D/g, "");
            if (numericValue.length > 10) return;
            setNewUser({ ...newUser, [name]: numericValue });
            return;
        }
        if (name === "username") {
            setNewUser({ ...newUser, [name]: value.toUpperCase() });
            return;
        }
        setNewUser({
            ...newUser,
            [name]: name.includes("id") ? Number(value) : value
        });
    };
    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUser.username || !newUser.password || !newUser.firstname) return alert("กรุณากรอกข้อมูลสำคัญให้ครบ");
        const usernameRegex = /^B(65|66)\d{5}$/;
        if (!usernameRegex.test(newUser.username)) return alert("❌ รูปแบบ Username ไม่ถูกต้อง (เช่น B66xxxxx)");
        const phoneRegex = /^\d{10}$/;
        if (newUser.phone && !phoneRegex.test(newUser.phone)) return alert("❌ เบอร์โทรต้องมี 10 หลัก");

        try {
            const res = await CreateUser(newUser);
            if (res.status === 201) {
                alert("✅ เพิ่มผู้ใช้งานสำเร็จ!");
                setShowCreate(false);
                setNewUser({ username: "", password: "", firstname: "", lastname: "", email: "", phone: "", gender_id: 1, branch_id: 1, role_id: 3, status_id: 1 });
                fetchAllData();
            } else {
                alert("❌ เกิดข้อผิดพลาด: " + res.data.error);
            }
        } catch (error: any) {
            alert("❌ " + (error.response?.data?.error || error.message));
        }
    };

    // Logic Delete User
    const handleDelete = async (id: number) => {
        if (!confirm("⚠️ คุณแน่ใจหรือไม่ว่าจะลบผู้ใช้งานรายนี้?")) return;
        try {
            const res = await DeleteUser(id);
            if (res.status === 200) {
                alert("✅ ลบผู้ใช้งานสำเร็จ");
                fetchAllData();
            } else {
                alert("❌ ลบไม่สำเร็จ: " + res.data.error);
            }
        } catch (error: any) {
            alert("❌ เกิดข้อผิดพลาด: " + (error.response?.data?.error || error.message));
        }
    };

    // Logic Edit User
    const handleEditClick = (user: UserProfileInterface) => {
        if (!user.ID) return;
        setEditingUser({
            id: user.ID,
            firstname: user.firstname || "",
            lastname: user.lastname || ""
        });
        setShowEdit(true);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;
        try {
            const res = await UpdateUser(editingUser.id, {
                firstname: editingUser.firstname,
                lastname: editingUser.lastname
            });
            if (res.status === 200) {
                alert("✅ แก้ไขข้อมูลสำเร็จ");
                setShowEdit(false);
                setEditingUser(null);
                fetchAllData();
            } else {
                alert("❌ แก้ไขไม่สำเร็จ: " + res.data.error);
            }
        } catch (error: any) {
            alert("❌ เกิดข้อผิดพลาด: " + (error.response?.data?.error || error.message));
        }
    };

    const filteredUsers = users.filter(user =>
        user.firstname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username?.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                <div style={{ marginBottom: '20px', position: 'relative', maxWidth: '300px' }}>
                    <SearchOutlined style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
                    <input type="text" placeholder="ค้นหาชื่อ หรือ รหัสนักศึกษา..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '10px 10px 10px 35px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '0.9rem' }} />
                </div>

                {loading ? (
                    <p style={{ textAlign: 'center', padding: '40px', color: '#666' }}>กำลังโหลดข้อมูล...</p>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '80px', textAlign: 'center' }}>ID</th>
                                    <th>ชื่อผู้ใช้งาน</th>
                                    <th>ชื่อ - นามสกุล</th>
                                    <th>บทบาท</th>
                                    <th>สาขา</th>
                                    <th>สถานะ</th>
                                    <th style={{ textAlign: 'center' }}>จัดการ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.length === 0 ? (
                                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: '#999' }}>ไม่พบข้อมูลผู้ใช้งาน</td></tr>
                                ) : (
                                    filteredUsers.map((user) => (
                                        <tr key={user.ID}>
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
                                            <td><span style={{ color: user.status?.status === 'Active' ? 'green' : 'red', fontWeight: 500 }}>{user.status?.status || "-"}</span></td>
                                            <td style={{ textAlign: 'center' }}>
                                                {user.role?.role !== 'Admin' ? (
                                                    <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                                                        {/* ปุ่มแก้ไข */}
                                                        <button
                                                            onClick={() => handleEditClick(user)}
                                                            style={{ backgroundColor: 'transparent', border: 'none', cursor: 'pointer', color: '#faad14', fontSize: '1.2rem' }}
                                                            title="แก้ไขชื่อ-นามสกุล"
                                                        >
                                                            <EditOutlined />
                                                        </button>
                                                        {/* ปุ่มลบ */}
                                                        <button
                                                            onClick={() => user.ID && handleDelete(user.ID)}
                                                            style={{ backgroundColor: 'transparent', border: 'none', cursor: 'pointer', color: '#ff4d4f', fontSize: '1.2rem' }}
                                                            title="ลบผู้ใช้งาน"
                                                        >
                                                            <DeleteOutlined />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span style={{ color: '#ccc', fontSize: '1.2rem', cursor: 'not-allowed' }}>🚫</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal Import */}
            {showImport && (
                <div className="modal-overlay" style={{
                    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div className="import-card" style={{ width: '90%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div className="import-header" style={{ position: 'relative' }}>
                            <h2>นำเข้าข้อมูลผู้ใช้งาน (Import Users)</h2>
                            <p>รองรับไฟล์ .csv เท่านั้น</p>
                            <button
                                onClick={() => setShowImport(false)}
                                style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}
                            >×</button>
                        </div>
                        <div className="import-content">
                            <div className="template-section">
                                <span>ยังไม่มีไฟล์ต้นแบบ? </span>
                                <button onClick={handleDownloadTemplate} className="btn-template">
                                    <DownloadOutlined /> ดาวน์โหลด Template CSV
                                </button>
                            </div>
                            <div
                                className="upload-area"
                                onClick={handleBoxClick}
                                style={{ opacity: isUploading ? 0.6 : 1, cursor: isUploading ? 'wait' : 'pointer' }}
                            >
                                <input type="file" accept=".csv" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} disabled={isUploading} />
                                <div className="upload-icon"><CloudUploadOutlined /></div>
                                <div className="upload-text-main">คลิกเพื่อเลือกไฟล์ CSV</div>
                                <div className="upload-text-sub">หรือลากไฟล์มาวางที่นี่</div>
                                {file && (
                                    <div className="selected-file-badge" onClick={(e) => e.stopPropagation()}>
                                        <FileTextOutlined /> {file.name}
                                    </div>
                                )}
                            </div>
                            <div className="action-buttons">
                                <button className="btn-back" onClick={() => setShowImport(false)} disabled={isUploading}>ยกเลิก</button>
                                <button className="btn-upload" onClick={handleUpload} disabled={!file || isUploading}>
                                    {isUploading ? 'กำลังอัปโหลด...' : 'ยืนยันการนำเข้า'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Create */}
            {showCreate && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', width: '90%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                            <h2 style={{ margin: 0 }}><PlusOutlined /> เพิ่มผู้ใช้งานใหม่</h2>
                            <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                        </div>
                        <form onSubmit={handleCreateSubmit} className="create-user-form">
                            <div className="form-group"><label>Username *</label><input className="form-input" name="username" value={newUser.username} onChange={handleInputChange} required placeholder="B66xxxxx" /></div>
                            <div className="form-group"><label>Password *</label><input className="form-input" type="password" name="password" value={newUser.password} onChange={handleInputChange} required /></div>
                            <div className="form-group"><label>ชื่อจริง *</label><input className="form-input" name="firstname" value={newUser.firstname} onChange={handleInputChange} required /></div>
                            <div className="form-group"><label>นามสกุล *</label><input className="form-input" name="lastname" value={newUser.lastname} onChange={handleInputChange} required /></div>
                            <div className="form-group"><label>อีเมล</label><input className="form-input" type="email" name="email" value={newUser.email} onChange={handleInputChange} /></div>
                            <div className="form-group"><label>เบอร์โทร</label><input className="form-input" name="phone" value={newUser.phone} onChange={handleInputChange} /></div>
                            <div className="form-group"><label>เพศ</label><select className="form-input" name="gender_id" value={newUser.gender_id} onChange={handleInputChange}>{genders.map(g => <option key={g.ID} value={g.ID}>{g.name}</option>)}</select></div>
                            <div className="form-group"><label>สาขา</label><select className="form-input" name="branch_id" value={newUser.branch_id} onChange={handleInputChange}>{branches.map(b => <option key={b.ID} value={b.ID}>{b.branch_name}</option>)}</select></div>
                            <div className="form-group"><label>บทบาท</label><select className="form-input" name="role_id" value={newUser.role_id} onChange={handleInputChange}>{roles.filter(r => r.role !== 'Admin').map(r => <option key={r.ID} value={r.ID}>{r.role}</option>)}</select></div>
                            <div className="form-group"><label>สถานะ</label><select className="form-input" name="status_id" value={newUser.status_id} onChange={handleInputChange}>{statuses.map(s => <option key={s.ID} value={s.ID}>{s.status}</option>)}</select></div>
                            <div style={{ gridColumn: '1 / -1', marginTop: '15px' }}><button type="submit" className="btn-save"><SaveOutlined /> บันทึกข้อมูล</button></div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Edit User */}
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
                                <input
                                    className="form-input"
                                    value={editingUser.firstname}
                                    onChange={(e) => setEditingUser({ ...editingUser, firstname: e.target.value })}
                                    required
                                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                />
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>นามสกุล (Lastname)</label>
                                <input
                                    className="form-input"
                                    value={editingUser.lastname}
                                    onChange={(e) => setEditingUser({ ...editingUser, lastname: e.target.value })}
                                    required
                                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                />
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