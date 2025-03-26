interface AuthResponse {
  id: string;
  name: string;
  email: string;
  image_id: string;
  ORG_ID: string;
  accessToken: string;
  refreshToken: string;
  sessionId: string;

  // authorizeSale: boolean;
  // authorizeAccountManager: boolean;
  // authorizeManager: boolean;
  // authorizeFactoryManager: boolean;
}

export type {
  AuthResponse
};
