import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { BadRequestError } from 'src/exceptions/BadRequestError';

export interface ApiResponse<T> {
    data: T;
    status: number;
    statusText: string;
}

export function createApiService(
    baseURL: string,
    authToken?: string,
    bearerTokenRetriever?: () => Promise<string>
): {
    get: <T>(url: string, config?: AxiosRequestConfig) => Promise<ApiResponse<T>>;
    post: <T>(url: string, data?: any, config?: AxiosRequestConfig) => Promise<AxiosResponse<T>>;
    put: <T>(url: string, data?: any, config?: AxiosRequestConfig) => Promise<AxiosResponse<T>>;
    delete: <T>(url: string, config?: AxiosRequestConfig) => Promise<AxiosResponse<T>>;
} {
    let bearerToken: string | null = null;
    let axiosInstance: AxiosInstance;

    if (bearerTokenRetriever) {
        bearerTokenRetriever().then((token) => {
            bearerToken = token;
            setupAxios();
        });
    } else {
        setupAxios();
    }

    function setupAxios(): void {
        const headers: any = {
            'Content-Type': 'application/json',
        };

        if (authToken) {
            headers['x-api-key'] = authToken;
        }

        axiosInstance = axios.create({
            baseURL,
            headers,
        });

        // If a bearerTokenRetriever is provided, setup an Axios request interceptor
        if (bearerTokenRetriever) {
            axiosInstance.interceptors.request.use(
                async (config) => {
                    // Get the token just before the request
                    bearerToken = await bearerTokenRetriever();
                    if (config.headers) {
                        config.headers['Authorization'] = `Bearer ${bearerToken}`;
                    }
                    return config;
                },
                (error) => {
                    return Promise.reject(error);
                }
            );
        }
    }

    async function request<T>(config: AxiosRequestConfig): Promise<AxiosResponse<T>> {
        return axiosInstance.request<T>(config);
    }

async function get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return await request<T>({ ...config, method: 'GET', url });
}

    async function post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
        try {
            console.log('post', url, data, config);
            return await request<T>({ ...config, method: 'POST', data, url });
        } catch (error) {
            if (error instanceof AxiosError) {
                const errorMessage =
                    'Message: ' + error.response?.data?.message + ' Error: ' + error.response?.data?.error;

                console.log('error in posting to api', error);
                throw new BadRequestError('error in posting to api', errorMessage);
            }
            throw new BadRequestError('error in posting to api', 'unknown error');
        }
    }

    async function put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
        return await request<T>({ ...config, method: 'PUT', data, url });
    }

    async function deleteReq<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
        return await request<T>({ ...config, method: 'DELETE', url });
    }

    return {
        get,
        post,
        put,
        delete: deleteReq, // Renamed because delete is a reserved keyword
    };
}
