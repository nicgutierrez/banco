import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // I contenuti vengono letti da disco a runtime: vanno inclusi nel bundle delle funzioni.
  outputFileTracingIncludes: {
    '/**': ['./content/**/*'],
  },
}

export default nextConfig
