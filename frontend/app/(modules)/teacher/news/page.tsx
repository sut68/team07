"use client";

import CreateNewsModal from "../../../components/news/newsPop";
export default function TeacherNewsPage() {
    return (
        <div style={{ width: '100%' }}>
            <CreateNewsModal isOpen={true} onClose={() => {}}/> 
        </div>
    );
}