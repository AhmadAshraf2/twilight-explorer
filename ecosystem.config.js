module.exports = {
  apps: [
    {
      name: 'twilight-api',
      script: 'packages/api/dist/index.js',
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'twilight-indexer',
      script: 'packages/indexer/dist/index.js',
      cwd: __dirname,
      instances: 1, // Must be 1 — advisory lock ensures single-writer
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'twilight-web',
      script: 'node_modules/.bin/next',
      args: 'start -p 3000',
      cwd: `${__dirname}/packages/web`,
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
};
