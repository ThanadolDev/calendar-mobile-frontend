import axios from 'axios';

import type { HeadPr, } from '@/models/PurchaseRequest';
import type { CategoryMenuUser, MenuUser } from '@/models/kmap';
import type { Released } from '@/models/released';
import type { AppTool, Comp } from '@/models/apptool';


const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:18814";

export const getComp = async (): Promise<Comp> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/comp`);

    return response.data;
  } catch (error) {
    console.error('Error fetching approval list:', error);
    throw error; // Rethrow the error to handle it in the calling function if needed
  }
};


export const getAppTools = async (): Promise<AppTool[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/app-tools`);

    return response.data;
  } catch (error) {
    console.error('Error fetching approval list:', error);
    throw error; // Rethrow the error to handle it in the calling function if needed
  }
};

export const getReleasedVersions = async (): Promise<Released[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/released-versions`);

    return response.data;
  } catch (error) {
    console.error('Error fetching approval list:', error);
    throw error; // Rethrow the error to handle it in the calling function if needed
  }
};

export const getMenuByUserId = async (userId: string,): Promise<MenuUser[]> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/menu-user`, {
      userId: userId,
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching approval list:', error);
    throw error; // Rethrow the error to handle it in the calling function if needed
  }
};


export const getCategoryMenuByUserId = async (userId: string,): Promise<CategoryMenuUser[]> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/category-menu-user`, {
      userId: userId,
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching approval list:', error);
    throw error; // Rethrow the error to handle it in the calling function if needed
  }
};


export const sentApproval = async (RA_ORG_ID: string, RA_USER_ID: string, items: HeadPr[]) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/request-approval`, {
      S_ORGID: RA_ORG_ID,
      S_USERID: RA_USER_ID,
      items: items,
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching approval list:', error);
    throw error; // Rethrow the error to handle it in the calling function if needed
  }
};


export const getApprovalList = async (RA_USER_ID: string, RA_ORG_ID: string): Promise<HeadPr[]> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/approval-list`, {
      RA_ORG_ID: RA_ORG_ID,
      RA_USER_ID: RA_USER_ID,
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching approval list:', error);
    throw error; // Rethrow the error to handle it in the calling function if needed
  }
};


// auth
export async function getUserProfile(accessToken: string) {
  try {
    const response = await axios.get('https://api.nitisakc.dev/auth/verify', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return response.data.profile[0];
  } catch (error: any) {
    // eslint-disable-next-line import/no-named-as-default-member
    if (axios.isAxiosError(error) && error.response && error.response.status === 401) {
      // Handle 401 Unauthorized
      console.error('Unauthorized access:', error);

      return error.response.status; // Sending the status out
    } else {
      console.error('Failed to get user profile:', error);
      throw error; // Re-throw other errors for the calling function to handle
    }
  }
}

export async function Login(username: string, password: string) {
  try {
    const response = await axios.post(`https://api.nitisakc.dev/auth/login`, {
      usr: username,
      pwd: password,
    });

    return response.data;
  } catch (error: any) {
    // eslint-disable-next-line import/no-named-as-default-member
    if (axios.isAxiosError(error) && error.response && error.response.status === 403) {
      // Handle 401 Unauthorized
      console.error('Unauthorized access:', error);

      return error.response.status; // Sending the status out
    } else {
      console.error('Failed to  Login :', error);
      throw error; // Re-throw other errors for the calling function to handle
    }
  }
}


export async function getCheckAuth(userId: string) {
  try {
    const response = await axios.post(`${process.env.REACT_APP_BACKEND_LOGIN}/checkAuth`,
      { uid: userId });

    return response.data;
  } catch (error) {
    console.error('Error creating requisition data:', error);

    // throw new Error('Failed to create requisition');
    throw error;
  }
}


export async function LogoutAuthSSO(userId: string) {
  try {
    const response = await axios.post(`${process.env.REACT_APP_BACKEND_LOGIN}/logout`,
      { uid: userId });

    return response.data;
  } catch (error) {
    console.error('Error creating requisition data:', error);

    // throw new Error('Failed to create requisition');
    throw error;
  }
}




// Verify and Refresh token
export interface UserProfile {
  ORG_ID: string;
  EMP_ID: string;
  EMP_FNAME: string;
  EMP_LNAME: string;
  POS_ID: string;
  ROLE_ID: number;
}

export interface VerifyTokenResponse {
  profile: UserProfile[];
  usr: string;
  iat: number;
  exp: number;
}


export async function getVerifyToken(accessToken: string): Promise<UserProfile | number> {
  try {
    const response = await axios.post(
      'https://api.nitisakc.dev/auth/verify',
      {}, // Empty request body
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );


    return response.data.profile[0]; // Assuming `profile` is an array
  } catch (error) {
    // eslint-disable-next-line import/no-named-as-default-member
    if (axios.isAxiosError(error)) {
      const { response } = error;

      if (response) {
        if (response.status === 401) {
          console.error('Unauthorized access:', response.data || error.message);

          return 401;
        }

        if (response.status === 403) {
          console.error('Forbidden access:', response.data || error.message);

          return 403;
        }
      }
    }

    // Log any other error and re-throw it
    console.error('An unexpected error occurred:', error);
    throw error;
  }
}





export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

export async function getRefreshToken(refreshToken: string): Promise<RefreshTokenResponse | number> {
  try {
    const response = await axios.post<RefreshTokenResponse>('https://api.nitisakc.dev/auth/refresh', null, {
      headers: {
        Authorization: `Bearer ${refreshToken}`,
      },
    });

    // Handle successful response (200 OK)
    return {
      accessToken: response.data.accessToken,
      refreshToken: response.data.refreshToken,
    };
  } catch (error) {
    // eslint-disable-next-line import/no-named-as-default-member
    if (axios.isAxiosError(error)) {
      const { response } = error;

      if (response) {
        if (response.status === 401) {
          console.error('jwt expired:', response.data || error.message);

          return 401;
        }

        if (response.status === 403) {
          console.error('invalid signature:', response.data || error.message);

          return 403;
        }
      }
    }

    // Log any other error and re-throw it
    console.error('An unexpected error occurred:', error);
    throw error;
  }
}



export interface TokenResponse {
  SESSION_ID: string;
  ACCESS_TOKEN: string;
  REFRESH_TOKEN: string;
  USER_ID: string;
  IS_LOGIN: string;
  genId: string;
}


export const getTokenBySessionIdAndUserId = async (
  SESSION_ID: string,
  USER_ID: string
): Promise<TokenResponse | null> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/user-refreshtoken`, {
      SESSION_ID,
      USER_ID,
    });

    if (response.data) {
      return response.data;
    }

    console.warn('No data received from the server');

    return null;
  } catch (error) {
    console.error('Error fetching token by session and user ID:', error);

    return null;
  }
};
