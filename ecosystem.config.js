module.exports = {
  apps: [
    {
      name: "web",
      cwd: "/home/xxxo/xxxo-game",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000 -H 127.0.0.1",
      env: {
        NODE_ENV: "production",
        PORT: "3000",
        NEXT_PUBLIC_SOCKET_URL: "https://xxxo.bothosts.com",
      },
      autorestart: true,
    },
    {
      name: "socket",
      cwd: "/home/xxxo/xxxo-game",
      script: "socket-server.js",
      env: { NODE_ENV: "production", SOCKET_PORT: "3001" },
      autorestart: true,
    },
  ],
};
