module.exports = {
  apps: [{
    name: "liberproof-api",
    cwd: "/var/www/liberproof/api",
    script: "dist/index.js",
    interpreter: "node",
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: "256M",
    env: { NODE_ENV: "production", PORT: 3000, HOST: "127.0.0.1" },
    env_file: "/var/www/liberproof/api/.env",
    error_file: "/var/log/pm2/liberproof-api-error.log",
    out_file: "/var/log/pm2/liberproof-api-out.log",
  }],
};
