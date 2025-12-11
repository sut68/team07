"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {  } from '../../../services/evaluation';
import type {
    IEvaluationProject,
    IEvaluationFormResponse,
    IEvaluationResultResponse,
    IEvaluationSummaryResponse,
    ISaveEvaluationRequest,
    ISaveEvaluationPeerRequest,
    ICreateCriteriaRequest,
    ICreateLevelRequest
} from "../../../interfaces/Evaluation";
import {
    GetEvaluationProjects,
    GetEvaluationForm,
    GetEvaluationResult,
    SaveEvaluation,
    ListCriteria,
    GetCriteriaById,
    CreateCriteria,
    UpdateCriteria,
    DeleteCriteria,
    CreateCriteriaLevel,
    UpdateCriteriaLevel,
    DeleteCriteriaLevel
} from '../../../services/evaluation';

export default function TeacherEvaluationPage() {
    const router = useRouter();
    return (
        <div>
            <h1>Evaluation ผู้สอน</h1>
            <p>ยินดีต้อนรับ...</p>
        </div>
    );
}