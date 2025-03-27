// DiecutService.ts
import type { IDiecutResponse, IDiecut } from '../types/types'

const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.example.com'

export const getDiecutStatus = async (): Promise<IDiecut[]> => {
  try {
    const response = await fetch(`${baseUrl}/diecuts/status/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'

        // Add authentication headers if needed
      }
    })

    if (!response.ok) {
      throw new Error(`Error fetching diecuts: ${response.status}`)
    }

    const data: IDiecutResponse = await response.json()

    if (!data.success) {
      throw new Error(data.message || 'Failed to retrieve diecut data')
    }

    return data.data.diecuts
  } catch (error) {
    console.error('Error in getDiecutStatus:', error)
    throw error
  }
}

export const getDiecutDetail = async (diecutId: string): Promise<IDiecut | null> => {
  try {
    const response = await fetch(`${baseUrl}/diecuts/status/${diecutId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'

        // Add authentication headers if needed
      }
    })

    if (!response.ok) {
      throw new Error(`Error fetching diecut detail: ${response.status}`)
    }

    const data = await response.json()

    if (!data.success) {
      throw new Error(data.message || 'Failed to retrieve diecut detail')
    }

    return data.data.diecut || null
  } catch (error) {
    console.error('Error in getDiecutDetail:', error)
    throw error
  }
}
