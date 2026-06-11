import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  updateUserProfile,
  changePassword,
  type ProfileUpdateValues,
  type PasswordChangeValues,
} from './api';

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: ProfileUpdateValues) => updateUserProfile(values),
    onSuccess: (result) => {
      if (result.data) {
        // Optimistically update the cached user
        queryClient.setQueryData(['user', 'current'], { data: result.data, error: null });
      }
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (values: PasswordChangeValues) => changePassword(values),
  });
}
