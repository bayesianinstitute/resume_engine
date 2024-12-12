import { defaultResponse } from "./resume";

export interface UserInfo {
  email: string;
  name: string;
  phone: string;
}

interface UserData extends UserInfo {
  password: string;
}

interface data {
  token: string;
  user: UserData;
}
export interface loginResponse extends defaultResponse {
  data: data;
}

export interface SignupResponse extends defaultResponse {
  data: data;
}

export interface FetchUserInfo extends defaultResponse {
  data: UserInfo;
}
