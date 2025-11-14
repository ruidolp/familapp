import { CapacitorConfig } from '@capacitor/cli'
import { appConfig } from './src/infrastructure/config/app.config'

const config: CapacitorConfig = {
  appId: appConfig.capacitor.appId,
  appName: appConfig.capacitor.appName,
  webDir: 'out',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
    hostname: 'app.wapp.com',
    // En desarrollo, apuntar al servidor local
    // url: 'http://localhost:3000',
    // cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
    },
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true,
    },
  },
}

export default config
