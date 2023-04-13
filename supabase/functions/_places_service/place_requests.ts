import { ApiResponse, httpUtils } from "./http_utils.ts"
import { Place, DetailRes, PlacesRes } from "./interfaces.ts"

const NEARBY_PLACES_URL = "https://maps.googleapis.com/maps/api/place/nearbysearch/json?"
const DETAILS_URL = "https://maps.googleapis.com/maps/api/place/details/json?"
const API_KEY = Deno.env.get("PLACES_API_KEY") ?? ""

const createUrlWithKey = (base_url: string, params: Map<string, string>): string => {
    params.set("key", API_KEY);
    for (let [k, v] of params) {
        base_url = base_url + `&${k}=${v}`;
    };
    return base_url;
}

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
    
    return placeDetails
}