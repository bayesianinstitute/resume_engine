interface UserData{
    email: string;
    password: string;
    firstname: string;
    lastname: string;
    phone: string;
    keywords: string[];

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