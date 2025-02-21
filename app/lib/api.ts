import { config } from '@/app/config'

export const api = {
    baseUrl : config.apiUrl,
    settings: {
        get: async () => {
            const response = await fetch(`${config.apiUrl}/settings`, {
                credentials: 'include'  // Important for auth cookies
            })
            if (!response.ok) throw new Error('Failed to fetch settings')
            return response.json()
        },
        update: async (data: any) => {
            const response = await fetch(`${config.apiUrl}/settings`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })
            if (!response.ok) throw new Error('Failed to update settings')
            return response.json()
        }
    }
    // Add other API endpoints...
} 