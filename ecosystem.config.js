module.exports = {
  apps: [
    {
      name: "handbook-frontend",
      script: "node_modules/next/dist/bin/next", // Directly points to the Next.js binary
      args: "start -p 19931", // Start Next.js on port 19933
      instances: "1",
      exec_mode: "fork",
      watch: false,
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
