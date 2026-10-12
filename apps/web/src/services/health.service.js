import { apiClient } from '@/lib/api-client';

/**
 * Health service — thin API wrapper kept outside UI components.
 */
export async function fetchHealth() {
  const { data } = await apiClient.get('/health');
  return data;
}
