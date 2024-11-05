interface data{
    token: string,
    user: object,
}
export interface loginResponse {
    success: boolean,
    message: string,
    data: data,
}