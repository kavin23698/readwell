// The signed-in user's avatar: their photo if set (downloaded on a new device), else initials.
import { Initials } from '@/components/kit/Initials';
import { useAvatarUri } from './avatar';
import { useProfile } from './ProfileProvider';

export function ProfilePhoto({ size = 44, name }: { size?: number; name?: string | null }) {
  const { profile } = useProfile();
  const photo = useAvatarUri(profile?.avatar_path);
  return <Initials name={name ?? profile?.display_name} size={size} photo={photo} />;
}
