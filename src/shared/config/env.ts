const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() || 'http://localhost:8000/api/v1';
const mockScenario = import.meta.env.VITE_MOCK_SCENARIO?.trim() || 'default';
const adminLogin = import.meta.env.VITE_ADMIN_LOGIN?.trim() || 'admin';
const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD?.trim() || '123456';
const adminDisplayName = import.meta.env.VITE_ADMIN_DISPLAY_NAME?.trim() || 'Администратор';

export const env = {
  apiBaseUrl,
  useMocks: String(import.meta.env.VITE_USE_MOCKS ?? 'true').toLowerCase() === 'true',
  mockScenario,
  useEmptyMocks: mockScenario === 'empty',
  adminLogin,
  adminPassword,
  adminDisplayName,
};
