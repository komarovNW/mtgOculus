const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() || 'http://localhost:8000/api/v1';
const mockScenario = import.meta.env.VITE_MOCK_SCENARIO?.trim() || 'default';

export const env = {
  apiBaseUrl,
  // Kept only so dormant mock files continue to compile if we bring them back later.
  useEmptyMocks: mockScenario === 'empty',
};
