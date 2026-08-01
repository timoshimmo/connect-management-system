import { createApiClient } from './apiClient';
import { getDrawingRegisterAccessToken, setDrawingRegisterAccessToken } from './drawingRegisterTokenStore';

/** The Drawing Register's own client — separate token store and refresh endpoint from MS Publishing's. */
const drawingRegisterClient = createApiClient({
  getAccessToken: getDrawingRegisterAccessToken,
  setAccessToken: setDrawingRegisterAccessToken,
  refreshPath: '/drawing-register-auth/refresh',
  authPathPrefix: '/drawing-register-auth/',
});

export const { apiRequest: drApiRequest, apiUpload: drApiUpload, refreshAccessToken: drRefreshAccessToken } =
  drawingRegisterClient;

export { ApiError } from './apiClient';
