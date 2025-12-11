"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SavePeerEvaluation } from '../../../services/evaluation';
import type {ISaveEvaluationPeerRequest} from "../../../interfaces/Evaluation";

export default function StudentEvaluationPage() {
    const router = useRouter();
    return (
        <div>
            <h1>Evaluation ผู้เรียน</h1>
            <p>ยินดีต้อนรับ...</p>
        </div>
    );
}