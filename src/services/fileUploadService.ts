import axios from 'axios'

export interface UploadedFile {
  fileId: string
  fileName: string
  originalName: string
  size: number
  mimeType: string
  url?: string
}

export interface UploadResponse {
  success: boolean
  message: string
  data?: {
    files: UploadedFile[]
  }
  error?: string
}

class FileUploadService {
  private readonly uploadUrl = 'http://192.168.55.37:18814/fileserver/upload'

  /**
   * Upload single or multiple files
   */
  async uploadFiles(files: File[], onProgress?: (progress: number) => void): Promise<UploadResponse> {
    try {
      const formData = new FormData()
      
      // Add all files to form data with key 'upload'
      files.forEach((file) => {
        formData.append('upload', file)
      })

      const response = await axios.post(this.uploadUrl, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60 second timeout for file uploads
        onUploadProgress: onProgress ? (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(progress);
          }
        } : undefined,
      })

      // Transform the response to match our expected format
      if (response.data && Array.isArray(response.data)) {
        return {
          success: true,
          message: 'Files uploaded successfully',
          data: {
            files: this.transformUploadResponse(response.data, files)
          }
        }
      } else {
        throw new Error('Invalid response from upload server')
      }
    } catch (error) {
      console.error('File upload error:', error)
      
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          message: error.response?.data?.message || error.message || 'Upload failed',
          error: error.response?.data?.error || error.message
        }
      }
      
      return {
        success: false,
        message: 'An unexpected error occurred during upload',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Upload a single file
   */
  async uploadFile(file: File): Promise<UploadResponse> {
    return this.uploadFiles([file])
  }

  /**
   * Transform the upload server response to our expected format
   * Expected server response format:
   * [
   *   {
   *     "id": "000000000004720",
   *     "name": "Download_-2023-09-30T083140.032d-_2023-09-30T0.mp4",
   *     "server_name": "2025\06\",
   *     "filepath": "\\192.168.55.37\cloud$\2025\06\1751269917793.mp4",
   *     "size": 2123397,
   *     "mimetype": "video/mp4",
   *     "thumbnail": "resized_1751269917793.png"
   *   }
   * ]
   */
  private transformUploadResponse(serverResponse: any, originalFiles: File[]): UploadedFile[] {
    if (Array.isArray(serverResponse)) {
      return serverResponse.map((file) => ({
        fileId: file.id,
        fileName: file.name,
        originalName: file.name,
        size: file.size,
        mimeType: file.mimetype,
        url: file.filepath // Store the server filepath for download
      }))
    } else {
      // Fallback: create file info from original files with generated IDs
      console.warn('Unexpected server response format:', serverResponse)
      return originalFiles.map((file, index) => ({
        fileId: `${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
        fileName: file.name,
        originalName: file.name,
        size: file.size,
        mimeType: file.type,
      }))
    }
  }

  /**
   * Validate file before upload
   */
  validateFile(file: File): { valid: boolean; error?: string } {
    // Check for empty files
    if (file.size === 0) {
      return {
        valid: false,
        error: `ไฟล์ว่างเปล่า: ${file.name}`
      }
    }

    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `ขนาดไฟล์เกิน 10MB: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`
      }
    }

    // Check file type with both MIME type and extension fallback
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/tiff',
      'video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/webm', 'video/mkv',
      'application/pdf',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain', 'text/csv',
      'application/zip', 'application/x-rar-compressed', 'application/x-zip-compressed',
      'application/json', 'application/xml'
    ]

    const allowedExtensions = [
      '.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff',
      '.mp4', '.avi', '.mov', '.wmv', '.webm', '.mkv',
      '.pdf',
      '.doc', '.docx',
      '.xls', '.xlsx',
      '.ppt', '.pptx',
      '.txt', '.csv',
      '.zip', '.rar',
      '.json', '.xml'
    ]

    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
    const isValidMimeType = allowedTypes.includes(file.type)
    const isValidExtension = allowedExtensions.includes(fileExtension)

    if (!isValidMimeType && !isValidExtension) {
      return {
        valid: false,
        error: `ประเภทไฟล์ไม่ได้รับอนุญาต: ${file.name} (${file.type || fileExtension})`
      }
    }

    return { valid: true }
  }

  /**
   * Validate multiple files
   */
  validateFiles(files: File[], existingAttachments: any[] = []): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    
    // Check file count limits (1-10 files)
    if (files.length === 0) {
      errors.push('กรุณาเลือกไฟล์อย่างน้อย 1 ไฟล์')
    } else if (files.length > 10) {
      errors.push(`เลือกไฟล์มากเกินไป สูงสุด 10 ไฟล์ (เลือก: ${files.length} ไฟล์)`)
    }
    
    // Check for duplicate file names within the selected files
    const fileNames = files.map(file => file.name.toLowerCase())
    const duplicateNames = fileNames.filter((name, index) => fileNames.indexOf(name) !== index)
    if (duplicateNames.length > 0) {
      errors.push(`พบไฟล์ชื่อซ้ำในการเลือก: ${[...new Set(duplicateNames)].join(', ')}`)
    }
    
    // Check for duplicate file names with existing attachments
    const existingNames = existingAttachments.map(att => 
      typeof att === 'string' ? att.toLowerCase() : att.fileName?.toLowerCase()
    ).filter(Boolean)
    
    const conflictingNames = fileNames.filter(name => existingNames.includes(name))
    if (conflictingNames.length > 0) {
      errors.push(`พบไฟล์ชื่อซ้ำกับไฟล์ที่มีอยู่: ${[...new Set(conflictingNames)].join(', ')}`)
    }
    
    // Check total size (100MB total limit for all selected files)
    const totalSize = files.reduce((sum, file) => sum + file.size, 0)
    const maxTotalSize = 100 * 1024 * 1024 // 100MB total limit
    if (totalSize > maxTotalSize) {
      errors.push(`ขนาดไฟล์รวมเกิน 100MB (รวม: ${(totalSize / 1024 / 1024).toFixed(2)}MB)`)
    }
    
    // Validate each individual file
    files.forEach(file => {
      const validation = this.validateFile(file)
      if (!validation.valid && validation.error) {
        errors.push(validation.error)
      }
    })

    return {
      valid: errors.length === 0,
      errors
    }
  }
}

export default new FileUploadService()