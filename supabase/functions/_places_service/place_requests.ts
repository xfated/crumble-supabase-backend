import { encode } from "https://deno.land/std/encoding/base64.ts";
import { ApiResponse, httpUtils } from "./http_utils.ts"
import { Place, DetailRes, PlacesRes } from "./interfaces.ts"
import { createUrlWithKey } from "./google_api_utils.ts"

const NEARBY_PLACES_URL = "https://maps.googleapis.com/maps/api/place/nearbysearch/json?"
const DETAILS_URL = "https://maps.googleapis.com/maps/api/place/details/json?"
const IMAGE_URL = "https://maps.googleapis.com/maps/api/place/photo?"

const MAX_PHOTO_SIZE = 50000

const placeDetailFields = [
	"name",
    "place_id",
	"url",
    "geometry",
    "address_components",
	"formatted_address",
	"photos",
	"reviews",
	"dine_in",
	"takeout",
	"serves_breakfast",
	"serves_lunch",
	"serves_dinner",
]

export const getNearbyPlaces = async (category: string, lat: number, long: number, radius: number, nextPageToken: string): Promise<PlacesRes> => {
    const params = new Map();
    params.set("location", `${lat},${long}`);
    params.set("radius", radius);
    params.set("type", category);
    if (nextPageToken !== "") {
        params.set("pagetoken", nextPageToken)
    }   
    const url = createUrlWithKey(NEARBY_PLACES_URL, params);
    const res: ApiResponse<PlacesRes> = await httpUtils.get(url)
    if (!res.success || res.data === null) {
        throw new Error(res.message ?? "Unable to getNearbyPlaces")
    }
    
    return res.data;
}

export const queryPlaceDetails = async (placeData: Place): Promise<DetailRes> => {
    const params = new Map();
    params.set("place_id", placeData.place_id);
    params.set("reviews_sort", "newest");
    params.set("fields", placeDetailFields.join(","))
    const url = createUrlWithKey(DETAILS_URL, params);

    // Make request
    const res: ApiResponse<DetailRes> = await httpUtils.get(url)
    if (!res.success || res.data === null) {
        throw new Error(res.message ?? "Unable to getNearbyPlaces")
    }

    const placeDetails = res.data;

    console.log(placeDetails.result.address_components)
    return placeDetails
}

export const getImageBase64 = async (photoRes: string): Promise<String> => {
    const params = new Map()
    params.set("maxwidth", 250)
    params.set("photo_reference", photoRes)
    const url = createUrlWithKey(IMAGE_URL, params);
    
    // Make request (manually handle non-json)
    try {
        const resp = await fetch(url)
        const imgString = await resp.blob()
        
        // convert image to data url
        const reader = new FileReader()
        let dataUrl = ""
        reader.readAsDataURL(imgString)
        await new Promise<void>((resolve: () => void) => reader.onload = () => resolve());
        if (reader.result !== null) {
            dataUrl = reader.result as string
        } 

        // don't store images that are too large
        const size = (new Blob([dataUrl as string])).size 
        if (size > MAX_PHOTO_SIZE) {
            dataUrl = "" // don't store if too large 
        }

        return dataUrl
    } catch (error: any) {
        console.log(error.message)
        return ""
    }
}