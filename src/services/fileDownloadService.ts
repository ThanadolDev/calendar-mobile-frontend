class FileDownloadService {
  private readonly baseUrl = 'http://192.168.55.37:18814/fileserver'

  /**
   * Get file display URL using file ID
   */
  getFileUrl(fileId: string): string {
    return `${this.baseUrl}/displayfile/${fileId}`
  }

  /**
   * Get file download URL using file ID
   */
  getFileDownloadUrl(fileId: string): string {
    return `${this.baseUrl}/download/${fileId}`
  }

  /**
   * Get file display URL using filepath (for files uploaded to our system)
   */
  getFileUrlByPath(filepath: string): string {
    // Convert Windows filepath to URL path
    const urlPath = filepath.replace(/\\/g, '/').replace(/^\\+/, '')

    return `${this.baseUrl}/displayfile/${encodeURIComponent(urlPath)}`
  }

  /**
   * Get file download URL using filepath
   */
  getFileDownloadUrlByPath(filepath: string): string {
    // Convert Windows filepath to URL path
    const urlPath = filepath.replace(/\\/g, '/').replace(/^\\+/, '')

    return `${this.baseUrl}/download/${encodeURIComponent(urlPath)}`
  }

  /**
   * Download file using file ID or filepath (forces download)
   */
  async downloadFile(fileIdOrPath: string, fileName?: string, isFilePath: boolean = false): Promise<void> {
    try {
      const url = isFilePath ? this.getFileDownloadUrlByPath(fileIdOrPath) : this.getFileDownloadUrl(fileIdOrPath)

      // Create a temporary link and trigger download
      const link = document.createElement('a')

      link.href = url
      link.download = fileName || 'download'
      link.target = '_blank'

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Download error:', error)
      throw new Error('Failed to download file')
    }
  }

  /**
   * Display/view file in new tab using file ID or filepath (uses displayfile endpoint)
   */
  viewFile(fileIdOrPath: string, isFilePath: boolean = false): void {
    const url = isFilePath ? this.getFileUrlByPath(fileIdOrPath) : this.getFileUrl(fileIdOrPath)

    window.open(url, '_blank')
  }

  /**
   * Check if file type can be previewed in browser
   */
  canPreview(mimeType?: string): boolean {
    if (!mimeType) return false

    const previewableTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/webm',
      'application/pdf',
      'text/plain'
    ]

    return previewableTypes.includes(mimeType)
  }

  /**
   * Get file icon based on type
   */
  getFileIcon(mimeType?: string): string {
    if (!mimeType) return '📄'

    if (mimeType.startsWith('image/')) return '🖼️'
    if (mimeType.startsWith('video/')) return '🎬'
    if (mimeType.includes('pdf')) return '📕'
    if (mimeType.includes('word')) return '📝'
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊'
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📽️'
    if (mimeType.includes('zip') || mimeType.includes('rar')) return '🗜️'
    if (mimeType.startsWith('text/')) return '📄'

    return '📎'
  }
}

export default new FileDownloadService()
