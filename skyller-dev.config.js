module.exports = {
  apps: [
    {
      name: "skyller-dev",
      cwd: "/opt/skills-ia-platform/skyller",
      script: "pnpm",
      args: "dev --port 3005",
      interpreter: "none",
      instances: 1,
      exec_mode: "fork",

      // Restart strategy
      autorestart: true,
      max_restarts: 10,
      min_uptime: "10s",

      // Logs
      error_file: "/root/.pm2/logs/skyller-dev-error.log",
      out_file: "/root/.pm2/logs/skyller-dev-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      merge_logs: true,

      // Environment
      env: {
        NODE_ENV: "development",
        PORT: 3005,
      },

      // Health monitoring
      kill_timeout: 10000,
      listen_timeout: 5000,

      // Watch mode (opcional - reinicia se alterar arquivos)
      // watch: true,
      // ignore_watch: ["node_modules", ".next", ".git"],
    },
  ],
};
