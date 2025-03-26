import axios from "axios";



import type { AuthResponse } from "@/types/auth";
import { getUserProfile, Login } from "./apiService";


export const AuthLogin = async (email: string, password: string) => {
  try {
    // Check if email or password is missing
    if (!email || !password) {
      throw new Error("email_or_password_missing");
    }

    // Attempt to login
    const response = await Login(email, password);

    // Handle invalid login response
    if (response === 403) {
      throw new Error("invalid_credentials");
    }

    const { accessToken, refreshToken } = response;

    // Validate that the tokens exist
    if (!accessToken || !refreshToken) {
      throw new Error("invalid_credentials");
    }

    // Fetch the user profile using the access token
    const profile = await getUserProfile(accessToken);

    if (!profile) {
      throw new Error("profile_not_found");
    }

    // Extract user data
    const empId = profile.EMP_ID;
    const org = profile.ORG_ID;
    const fullName = `${profile.EMP_FNAME} ${profile.EMP_LNAME}`;


    const responseData = {
      id: empId,
      name: fullName,
      email: empId,
      image_id: empId,
      ORG_ID: org,
      accessToken: accessToken,
      refreshToken: refreshToken,
    }

    return responseData as AuthResponse;
  } catch (error: unknown) {
    // eslint-disable-next-line import/no-named-as-default-member
    if (axios.isAxiosError(error)) {
      const message = error?.response?.data?.error;

      throw new Error(message);
    } else {
      const { message } = error as Error;

      throw new Error(message);
    }
  }
}


