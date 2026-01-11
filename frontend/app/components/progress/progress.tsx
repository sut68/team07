"use client";

import React, { useState, useEffect } from 'react';
import { FileText, ArrowRight, TrendingUp, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { GetAdvisorRequests } from '../../services/advisor';
import { GetProgress } from '../../services/progress';

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
        backgroundColor: '#f9fafb'
      }}>
        <div style={{ textAlign: 'center', color: '#6b7280' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>
          <div>กำลังโหลดข้อมูล...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#ffffff',
      borderRadius: '8px',
      overflow: 'hidden',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
    }}>
      <div style={{
        padding: '1rem 1.25rem',
        background: 'linear-gradient(135deg, #9a0120 0%, #7d0019 100%)',
        color: '#ffffff',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <TrendingUp size={20} />
          <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600' }}>
            ความคืบหน้า
          </h3>
        </div>
      </div>

      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: '1.5rem'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{
            backgroundColor: '#fef2f2',
            padding: '1rem',
            borderRadius: '8px',
            border: '1px solid #fecaca'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.5rem'
            }}>
              <Users size={16} style={{ color: '#9a0120' }} />
              <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: '500' }}>
                กลุ่มทั้งหมด
              </span>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#9a0120' }}>
              {stats.totalGroups}
            </div>
          </div>

          <div style={{
            backgroundColor: '#fef2f2',
            padding: '1rem',
            borderRadius: '8px',
            border: '1px solid #fecaca'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.5rem'
            }}>
              <FileText size={16} style={{ color: '#9a0120' }} />
              <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: '500' }}>
                ส่งงานแล้ว
              </span>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#9a0120' }}>
              {stats.totalSubmissions}
            </div>
          </div>
        </div>

        {stats.recentCount > 0 && (
          <div style={{
            backgroundColor: '#fef9c3',
            border: '1px solid #fde047',
            borderRadius: '8px',
            padding: '0.75rem 1rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span style={{ fontSize: '1.25rem' }}>🔔</span>
            <span style={{ fontSize: '0.875rem', color: '#854d0e', fontWeight: '500' }}>
              มี {stats.recentCount} งานใหม่รอตรวจสอบ
            </span>
          </div>
        )}

        <div style={{ 
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          minHeight: '80px'
        }}>


          <button
            onClick={handleNavigate}
            style={{
              backgroundColor: '#9a0120',
              color: 'white',
              border: 'none',
              padding: '0 24px',
              height: '40px',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s',
              boxShadow: '0 4px 6px rgba(154, 1, 32, 0.2)',
              fontSize: '0.875rem',
              fontFamily: 'Noto Sans Thai'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#7d0019';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 6px 12px rgba(154, 1, 32, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#9a0120';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 6px rgba(154, 1, 32, 0.2)';
            }}
          >
            <span>ดูทั้งหมด</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardProgressWidget;