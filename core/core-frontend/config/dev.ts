export default {
  server: {
    proxy: {
      '/api/f': {
        // target: 'http://localhost:8100',
        target: 'https://demo.dataease.cn',
        // target: 'http://10.193.131.27:8100',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api\/f/, '')
      },
      // 使用 proxy 实例
      '/api': {
        // target: 'http://localhost:8100',
        target: 'https://demo.dataease.cn',
        // target: 'http://10.193.131.27:8100',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api/, 'de2api')
      },
      '/sdar': {
        target: 'https://10.193.131.25',
        changeOrigin: true
      }
    },
    port: 8000
  }
}
