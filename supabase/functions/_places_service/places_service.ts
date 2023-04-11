import { ApiResponse, httpUtils } from "./http_utils.ts"
import { Place, DetailRes, PlacesRes } from "./interfaces.ts"
import { addReviews, getReviews, deleteReviews, ReviewRow } from "../_database_utils/review_utils.ts"
import { addPhotos, getPhotos, deletePhotos, PhotoRow } from "../_database_utils/photo_utils.ts"
import { addPlaceDetails, deletePlaceDetails, fetchPlaceDetails, PlaceDetailRow } from "../_database_utils/placedetail_utils.ts"
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

const NEARBY_PLACES_URL = "https://maps.googleapis.com/maps/api/place/nearbysearch/json?"
const DETAILS_URL = "https://maps.googleapis.com/maps/api/place/details/json?"
const TTL = 7 // days
const API_KEY = Deno.env.get("PLACES_API_KEY") ?? ""

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

const createUrlWithKey = (base_url: string, params: Map<string, string>): string => {
    params.set("key", API_KEY);
    for (let [k, v] of params) {
        base_url = base_url + `&${k}=${v}`;
    };
    return base_url;
}

const getNearbyPlaces = async (supabaseClient: SupabaseClient, category: string, lat: number, long: number, radius: number, nextPageToken: string): Promise<PlacesRes> => {
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

interface GetNearbyPlacesWithDetailsRes {
    results: PlaceDetailRow[],
    next_page_token: string
}

export const getNearbyPlacesWithDetails = async (supabaseClient: SupabaseClient, category: string, lat: number, long: number, radius: number, nextPageToken: string): Promise<GetNearbyPlacesWithDetailsRes> => {
    const results = await getNearbyPlaces(supabaseClient, category, lat, long, radius, nextPageToken)
    let resWithDetails: Promise<PlaceDetailRow>[] = []
    for (const result of results.results) {
        resWithDetails.push(getPlaceDetails(supabaseClient, result))
    }
    return {
        "results": await Promise.all(resWithDetails),
        "next_page_token": results.next_page_token
    }
}


const isOutdated = (placeDetails: PlaceDetailRow): boolean => {
    if (!placeDetails.created_at) {
        return true
    }

    const created_at = new Date(placeDetails.created_at)
    const ttl = new Date(new Date().setDate(new Date().getDate() - TTL))

    // check if is older than TTL
    return created_at < ttl
}

export const getPlaceDetails = async (supabaseClient: SupabaseClient, placeData: Place): Promise<PlaceDetailRow> => {    
    // Check db
    let placeDetails = await fetchPlaceDetails(supabaseClient, placeData.place_id)

    let isValid = true
    if (!placeDetails) { // not found in db
        isValid = false
    } else if (isOutdated(placeDetails)) { // too old
        isValid = false
    }

    if (isValid && placeDetails !== null) {
        return placeDetails
    }

    // Get new results
    console.log("Fetching new results")
    await requestPlaceDetails(supabaseClient, placeData)

    // handle null so we don't have to handle nulls downstream
    const updatedResults = await fetchPlaceDetails(supabaseClient, placeData.place_id)
    if (!updatedResults) {
        throw new Error("Unable to getPlaceDetails")
    }
    return updatedResults
}

const requestPlaceDetails = async (supabaseClient: SupabaseClient, placeData: Place) => {
    const params = new Map();
    params.set("place_id", placeData.place_id);
    params.set("reviews_sort", "newest");
    params.set("fields", placeDetailFields.join(","))
    const url = createUrlWithKey(DETAILS_URL, params);

    // Make request
    const res: ApiResponse<DetailRes> = await httpUtils.get(url)
    const placeDetails = res.data;

    // Record PlaceDetail
    if (placeDetails == null || placeDetails.result == null) {
        throw new Error("Unable to fetch place details")
    }

    // Delete old data
    await deletePlaceDetails(supabaseClient, placeData.place_id)

    // Update placeDetails
    const processedPlaceDetail = await addPlaceDetails(supabaseClient, placeData, placeDetails.result)
    
    // Reinsert new data
    await addPhotos(supabaseClient, placeDetails?.result?.photos ? placeDetails.result.photos : [], placeData.place_id)
    await addReviews(supabaseClient, placeDetails?.result?.reviews ? placeDetails.result.reviews : [], placeData.place_id)

    return;
}