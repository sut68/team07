export interface News {
    ID: number;
    Title: string;
    Description: string;
    File: string;
    Category: string; // "General" | "Advisor"
    Status: string;
    TeacherID: number;
    Teacher?: {
        ID: number;
        FirstName: string;
        LastName: string;
    };
    CreatedAt: string;
    UpdatedAt: string;
}
