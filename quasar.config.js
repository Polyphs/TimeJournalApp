import 'dotenv/config'

export default function () {
  return {
    boot: [],
    css: ['app.css'],
    extras: ['material-icons'],
    build: {
      target: { browser: ['es2022', 'firefox115', 'chrome115', 'safari14'], node: 'node20' },
      vueRouterMode: 'hash', // hash mode works inside Capacitor webviews
      env: {
        SUPABASE_URL: process.env.SUPABASE_URL || '',
        SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || ''
      }
    },
    devServer: { open: false },
    framework: {
      config: { brand: { primary: '#1B2433', secondary: '#D8343F', accent: '#2F6FEB' } },
      plugins: ['Notify', 'Dialog']
    },
    animations: [],
    capacitor: { hideSplashscreen: true }
  }
}
