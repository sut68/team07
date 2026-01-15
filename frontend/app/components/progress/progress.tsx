"use client";

import React, { useState, useEffect } from 'react';
import { FileText, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { GetAdvisorRequests } from '../../services/advisor';
import { GetProgress } from '../../services/progress';
import '../../style/dashboard.css';

interface ProgressStats {
  totalGroups: number;
  totalSubmissions: number;
  recentCount: number;
}

interface DashboardProgressWidgetProps {
  teacherId?: number;
}

const DashboardProgressWidget: React.FC<DashboardProgressWidgetProps> = ({ 
  teacherId 
}) => {
  const router = useRouter();
  const [stats, setStats] = useState<ProgressStats>({
    totalGroups: 0,
    totalSubmissions: 0,
    recentCount: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (teacherId) {
      fetchProgressStats();
    } else {
      setLoading(false);
    }
  }, [teacherId]);

  const fetchProgressStats = async () => {
    try {
      setLoading(true);
      
      const res = await GetAdvisorRequests();
      
      if (res.data && res.data.data) {
        const acceptedGroups = res.data.data.filter((r: any) => r.status === 'accepted');
        const totalGroups = acceptedGroups.length;
        
        let totalSubmissions = 0;
        let recentCount = 0;
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        for (const group of acceptedGroups) {
          try {
            const progressData = await GetProgress({ 
              group_project_id: group.group_project_id 
            });
            
            if (progressData && progressData.length > 0) {
              totalSubmissions += progressData.length;
              
              const recent = progressData.filter((p: any) => {
                if (!p.created_at) return false;
                const createdDate = new Date(p.created_at);
                return createdDate >= sevenDaysAgo;
              });
              recentCount += recent.length;
            }
          } catch (err) {
            console.error(`Error fetching progress for group ${group.group_project_id}:`, err);
          }
        }
        
        setStats({
          totalGroups,
          totalSubmissions,
          recentCount
        });
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching progress stats:', error);
      setLoading(false);
    }
  };

  const handleNavigate = () => {
    router.push('/teacher/progress');
  };

  if (loading) {
    return (
      <div style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        color: '#6b7280'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>⏳</div>
          <div>กำลังโหลดข้อมูล...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      
      {/* Header Style matches SelectGroupCard */}
      <div className="section-header-with-action" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <div style={{fontSize: '1.25rem', fontWeight: '800', color: '#333', display: 'flex', alignItems: 'center', gap: '8px'}}>
            ความคืบหน้า (Progress)
        </div>

        <button 
            className="btn-view-all-theme"
            onClick={handleNavigate}
        >
            ดูทั้งหมด <span>&rsaquo;</span>
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '15px',
        }}>
          {/* Total Groups Card */}
          <div style={{
            backgroundColor: '#fff',
            padding: '1.25rem',
            borderRadius: '12px',
            border: '1px solid #eee',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: '8px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              <div style={{ 
                backgroundColor: 'rgba(154, 1, 32, 0.1)', 
                padding: '6px', 
                borderRadius: '6px',
                display: 'flex'
              }}>
                 <Users size={18} style={{ color: '#9a0120' }} />
              </div>
              <span style={{ fontSize: '0.85rem', color: '#666', fontWeight: '600' }}>
                กลุ่มในที่ปรึกษา
              </span>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#333', lineHeight: 1 }}>
              {stats.totalGroups}
            </div>
          </div>

          {/* Submissions Card */}
          <div style={{
            backgroundColor: '#fff',
            padding: '1.25rem',
            borderRadius: '12px',
            border: '1px solid #eee',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: '8px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              <div style={{ 
                backgroundColor: 'rgba(154, 1, 32, 0.1)', 
                padding: '6px', 
                borderRadius: '6px',
                display: 'flex'
              }}>
                <FileText size={18} style={{ color: '#9a0120' }} />
              </div>
              <span style={{ fontSize: '0.85rem', color: '#666', fontWeight: '600' }}>
                ส่งงานแล้ว
              </span>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#333', lineHeight: 1 }}>
              {stats.totalSubmissions}
            </div>
          </div>
        </div>

        {stats.recentCount > 0 && (
          <div style={{
            backgroundColor: '#fefce8',
            border: '1px solid #fde047',
            borderRadius: '10px',
            padding: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{ 
                backgroundColor: '#fef08a', 
                padding: '6px', 
                borderRadius: '50%',
                display: 'flex',
                fontSize: '1rem'
            }}>
                🔔
            </div>
            <div>
                 <div style={{ fontSize: '0.9rem', color: '#854d0e', fontWeight: '700' }}>
                 มี {stats.recentCount} งานใหม่
                </div>
                <div style={{ fontSize: '0.8rem', color: '#a16207' }}>
                 รอการตรวจสอบจากคุณ
                </div>
            </div>
           
          </div>
        )}
        
        {stats.totalGroups === 0 && !loading && (
             <div style={{ 
                textAlign: 'center', 
                padding: '20px', 
                color: '#9ca3af',
                fontSize: '0.9rem',
                backgroundColor: '#f9fafb',
                borderRadius: '8px',
                border: '1px dashed #e5e7eb'
            }}>
                ยังไม่มีกลุ่มโปรเจคในความดูแล
            </div>
        )}
      </div>
    </div>
  );
};

export default DashboardProgressWidget;