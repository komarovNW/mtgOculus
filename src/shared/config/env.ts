const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() || 'http://localhost:8000/api/v1';
const mockScenario = import.meta.env.VITE_MOCK_SCENARIO?.trim() || 'default';

export const env = {
  apiBaseUrl,
  useMocks: String(import.meta.env.VITE_USE_MOCKS ?? 'true').toLowerCase() === 'true',
  mockScenario,
  useEmptyMocks: mockScenario === 'empty',
};
