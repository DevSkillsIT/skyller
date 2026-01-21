module.exports = {
  apps: [
    {
      name: "skyller",
      cwd: "/opt/skills-ia-platform/skyller",
      script: "npm",
      args: "start",
      instances: 1,
      exec_mode: "fork",

      // Restart strategy
      autorestart: true,
      max_restarts: 10,
      min_uptime: "10s",

      // Logs
      error_file: "/root/.pm2/logs/skyller-error.log",
      out_file: "/root/.pm2/logs/skyller-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      merge_logs: true,

      // Environment
      env_production: {
        NODE_ENV: "production",
        PORT: 3004,
      },

      // Health monitoring
      kill_timeout: 5000,
      listen_timeout: 3000,

      // Cache management
      // Para limpar cache e rebuild antes de restart, use: ./scripts/deploy-skyller.sh
      max_memory_restart: "1G",
    },
  ],
};
