module.exports = {
  apps: [
    {
      name: 'praecox',
      script: 'node_modules/.bin/next',
      args: 'start',
      cwd: '/var/www/praecox',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: '/var/log/praecox/error.log',
      out_file: '/var/log/praecox/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
}
