import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '学習管理の要 - Forest Study',
    short_name: '学習の要',
    description: '日々の学習ノルマとスケジュールを可視化する学習管理アプリ',
    start_url: '/',
    display: 'standalone',
    background_color: '#020617',
    theme_color: '#059669',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  };
}
