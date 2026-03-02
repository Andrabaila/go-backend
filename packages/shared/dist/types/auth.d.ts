export interface IAuthResponse {
    access_token: string;
}
export interface ILoginRequest {
    email: string;
    password: string;
}
export interface IRegisterRequest {
    email: string;
    password: string;
}
export declare const AuthResponse: IAuthResponse;
export declare const LoginRequest: ILoginRequest;
export declare const RegisterRequest: IRegisterRequest;
export type AuthResponse = IAuthResponse;
export type LoginRequest = ILoginRequest;
export type RegisterRequest = IRegisterRequest;
