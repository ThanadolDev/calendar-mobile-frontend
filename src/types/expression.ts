export interface ExpressionAttachment {
  fileId: string
  fileName: string
  type?: string
  originalName?: string
  size?: number
  mimeType?: string
  url?: string
  isExisting?: boolean // Flag to indicate if this is an existing file (don't re-upload)
}

export interface CreateExpressionRequest {
  type: 'praise' | 'suggestion'
  recipient: string
  subject: string
  content: string
  privacy: 'public' | 'private'
  status: 'published' | 'draft' // 'draft' maps to 'P', 'published' to 'T', 'deleted' to 'F' in backend
  attachments?: ExpressionAttachment[]
}

export interface UpdateExpressionRequest extends Partial<CreateExpressionRequest> {
  id: string
}

export interface Expression {
  EXP_ID: string
  EXP_TYPE: string
  EXP_KIND: string
  EXP_DATE: string
  EXP_TO: string
  EXP_SUBJECT: string
  EXP_DETAIL: string
  STATUS: string
  CR_DATE: string
  CR_OID: string
  CR_UID: string
  UPDATE_DATE?: string
  UPDATE_OID?: string
  UPDATE_UID?: string
  CANCEL_DATE?: string
  CANCEL_OID?: string
  CANCEL_UID?: string

  // Transformed fields from backend
  TYPE: 'praise' | 'suggestion'
  privacy?: 'public' | 'private'
  expressionStatus?: 'published' | 'draft' | 'deleted'
  ISPUBLIC?: '1' | '0'
  date: string
  time?: string
  month: number
  year: number
  attachments: ExpressionAttachment[]
}

export interface ExpressionFilters {
  timePeriod?: 'monthly' | 'yearly'
  year?: number
  month?: number
}

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

export interface ExpressionListResponse {
  expressions: Expression[]
}

export interface ExpressionResponse {
  expression: Expression
}

// Stats for the dashboard
export interface ExpressionStats {
  praise: number
  suggestions: number
  public: number
  private: number
}
