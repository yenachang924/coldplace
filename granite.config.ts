import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'coldplace',
  brand: {
    displayName: '콜드플레이스',
    primaryColor: '#3182F6',
    icon: 'https://static.toss.im/appsintoss/73/3fd33774-eb24-4e22-b9ec-8d34cbb04046.png',
  },
  web: {
    host: 'localhost',
    port: 5173,
    commands: {
      dev: 'vite dev',
      build: 'vite build',
    },
  },
  permissions: [
    {
      name: 'geolocation',
      access: 'access',
    },
  ],
});
