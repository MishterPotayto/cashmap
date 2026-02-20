module.exports = {
  apps: [
    {
      name: "cashmap",
      script: "npm",
      args: "start",
      cwd: "/home/cashmap/app/cashmap",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      instances: 1,
      autorestart: true,
      max_memory_restart: "500M",
      watch: false,
    },
  ],
};
