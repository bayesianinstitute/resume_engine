interface UserData{
    email: string;
    password: string;
    name: string;
    phone: string;
}

interface data{
    token: string,
    user: UserData,
}
export interface loginResponse {
    success: boolean,
    message: string,
    data: data,
}

export interface SignupResponse {
    success: boolean,
    message: string,
    data: data,
}