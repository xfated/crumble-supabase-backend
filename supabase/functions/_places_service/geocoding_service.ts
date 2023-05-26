import { ApiResponse, httpUtils } from "./http_utils.ts"
import { createUrlWithKey } from "./google_api_utils.ts"
import { Geometry } from "./interfaces.ts"

const AUTOCOMPLETE_URL = "https://maps.googleapis.com/maps/api/geocode/json?"

export interface GeocodingDetails {
    formatted_address: string
    geometry: Geometry
    place_id: string
}

interface GeocodingRes {
    results: GeocodingDetails[]
}

export const queryGeocodingForLatLong = async (address: string): GeocodingDetails => {
    const params = new Map();
    params.set("address", address.replace(" ", "+"))
    const url = createUrlWithKey(AUTOCOMPLETE_URL, params);

    // Make request
    const res: ApiResponse<any> = await httpUtils.get(url)
    if (!res.success || res.data === null) {
        throw new Error(res.message ?? "Unable to getNearbyPlaces")
    }   

    return (res.data as GeocodingRes).results[0]
}

// Address lookup
export const queryGeocodingForAddress = async (lat: number, lng: number): GeocodingDetails => {
    // Check is valid numbers
    if (Number.isNaN(Number(lat)) || Number.isNaN(Number(lng))) {
        throw new Error("Lat/long provided is invalid")
    }

    const params = new Map()
    params.set("latlng", `${lat},${lng}`)

    const url = createUrlWithKey(AUTOCOMPLETE_URL, params);

    // Make request
    const res: ApiResponse<any> = await httpUtils.get(url)
    if (!res.success || res.data === null) {
        throw new Error(res.message ?? "Unable to getNearbyPlaces")
    }   
    
    return (res.data as GeocodingRes).results[0]
}