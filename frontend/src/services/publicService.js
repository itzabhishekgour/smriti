import axios from 'axios'

// We create a fresh axios instance without interceptors
// so it doesn't try to send Auth headers or handle 401s by redirecting to login.
const publicApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json'
  }
})

export const publicService = {
  accessSharedSecrets: (token, password) => 
    publicApi.post(`/api/public/links/${token}/access`, { password }).then(r => r.data.data),
    
  verifyOtp: (token, otp) => 
    publicApi.post(`/api/public/links/${token}/verify-otp`, { otp }).then(r => r.data.data),
    
  resendOtp: (token) => 
    publicApi.post(`/api/public/links/${token}/resend-otp`).then(r => r.data.data)
}
