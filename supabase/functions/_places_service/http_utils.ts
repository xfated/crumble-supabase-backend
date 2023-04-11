export interface ApiResponse<T> {
    success: boolean;
    data: T | null;
    message: string | null
}

async function get<T>(url: string): Promise<ApiResponse<T>> {
    try {
        const resp = await fetch(url)
        const body = await resp.json()
        return { success: true, data: body, message: null}
    } catch (error: any) {
        console.error(error.message)
        return { success: false, data: null, message: error.message }
    }
}

export const httpUtils = {
    get
}