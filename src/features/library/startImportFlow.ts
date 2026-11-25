import { router } from 'expo-router';
import { pickBookFiles } from './importBooks';
import { startImport } from './importStore';

/** "Add book": open the Android file picker, then show the Importing screen. */
export async function startImportFlow() {
  const files = await pickBookFiles();
  if (!files.length) return;
  startImport(files); // runs in the background; the screen shows progress
  router.push('/import');
}
