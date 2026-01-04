export interface ISpamAnalysis {
  text: string;
  is_spam: boolean;
  score: number;
}

export interface ISpamRequest {
  text: string;
}