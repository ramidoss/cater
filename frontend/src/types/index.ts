export interface FeedbackCategory {
  strengths: string[];
  improvements: string[];
  score: number;
}

export interface DesignFeedback {
  ux_feedback: FeedbackCategory;
  ui_feedback: FeedbackCategory;
  behavioral_feedback: FeedbackCategory;
  overall_score: number;
  priority_recommendations: string[];
}

export interface AnalysisState {
  isLoading: boolean;
  feedback: DesignFeedback | null;
  error: string | null;
}