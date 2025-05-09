/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: process.env.BASEPATH,
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    REACT_APP_URLMAIN_LOGIN: process.env.REACT_APP_URLMAIN_LOGIN,
    REACT_APP_BACKEND_LOGIN: process.env.REACT_APP_BACKEND_LOGIN,
    MODE_TITLE: process.env.MODE_TITLE
  },
  redirects: async () => {
    return [
      {
        source: '/',
        destination: '/login-og',
        permanent: true,
        locale: false
      }
    ]
  }
}

export default nextConfig
