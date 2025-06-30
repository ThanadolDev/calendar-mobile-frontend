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
  async uploadFiles(files: File[]): Promise<UploadResponse> {
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
        timeout: 30000, // 30 second timeout for file uploads
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
    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File size exceeds 10MB limit. File: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`
      }
    }

    // Check file type (allow common file types)
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/webm',
      'application/pdf',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain', 'text/csv',
      'application/zip', 'application/x-rar-compressed',
    ]

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `File type not allowed: ${file.type}. File: ${file.name}`
      }
    }

    return { valid: true }
  }

  /**
   * Validate multiple files
   */
  validateFiles(files: File[]): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    
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