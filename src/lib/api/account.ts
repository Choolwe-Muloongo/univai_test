import { buildApiUrl } from '@/lib/api/client';

export type AvatarUploadResponse = {
  avatar: string;
  url: string;
};

export async function uploadAccountAvatar(file: File): Promise<AvatarUploadResponse> {
  const formData = new FormData();
  formData.append('avatar', file);

  const response = await fetch(buildApiUrl('/auth/profile/avatar'), {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });

  if (!response.ok) {
    let message = 'Unable to upload profile photo.';
    try {
      const payload = await response.json();
      if (payload && typeof payload.message === 'string') message = payload.message;
    } catch {
      const text = await response.text().catch(() => '');
      if (text) message = text;
    }
    throw new Error(message);
  }

  return response.json();
}
