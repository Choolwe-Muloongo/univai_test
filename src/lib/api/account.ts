import { buildApiUrl } from '@/lib/api/client';

export type AvatarUploadResponse = {
  avatar: string;
  url: string;
};

export type ChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

async function readError(response: Response, fallback: string) {
  let message = fallback;
  try {
    const payload = await response.json();
    if (payload && typeof payload.message === 'string') message = payload.message;
  } catch {
    const text = await response.text().catch(() => '');
    if (text) message = text;
  }
  return message;
}

export async function uploadAccountAvatar(file: File): Promise<AvatarUploadResponse> {
  const formData = new FormData();
  formData.append('avatar', file);

  const response = await fetch(buildApiUrl('/auth/profile/avatar'), {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(await readError(response, 'Unable to upload profile photo.'));
  }

  return response.json();
}

export async function changeAccountPassword(payload: ChangePasswordPayload): Promise<{ message: string }> {
  const response = await fetch(buildApiUrl('/auth/profile/password'), {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      currentPassword: payload.currentPassword,
      newPassword: payload.newPassword,
      newPassword_confirmation: payload.confirmPassword,
    }),
  });

  if (!response.ok) {
    throw new Error(await readError(response, 'Unable to change password.'));
  }

  return response.json();
}
