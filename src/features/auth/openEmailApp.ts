import * as IntentLauncher from 'expo-intent-launcher';
import { Linking } from 'react-native';

/** Opens the phone's default email app (inbox), falling back to a mailto: link. */
export async function openEmailApp() {
  try {
    await IntentLauncher.startActivityAsync('android.intent.action.MAIN', {
      category: 'android.intent.category.APP_EMAIL',
      flags: 0x10000000, // FLAG_ACTIVITY_NEW_TASK
    });
  } catch {
    await Linking.openURL('mailto:');
  }
}
