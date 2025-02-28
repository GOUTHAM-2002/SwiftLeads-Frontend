// export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://swiftleads-ai-ssb-bd74536c3008.herokuapp.com/api'

export const config = {
    apiUrl: 'http://127.0.0.1:5001',
    // wsUrl: http://localhost:5000.replace('http', 'ws'),  // for websocket connections if needed
    environment: process.env.NODE_ENV || 'development'
} 