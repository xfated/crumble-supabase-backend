import { ApiResponse, httpUtils } from "./http_utils.ts"
import { DetailRes, PlacesRes } from "./interfaces.ts"
import { addReviews, getReviews, deleteReviews, ReviewRow } from "../_database_utils/review_utils.ts"
import { addPhotos, getPhotos, deletePhotos, PhotoRow } from "../_database_utils/photo_utils.ts"
import { addPlaceDetails, fetchPlaceDetails, PlaceDetailRow } from "../_database_utils/placedetail_utils.ts"
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

export const getNearbyPlaces = async (category: string, lat: number, long: number, radius: number, nextPageToken: string): Promise<PlacesRes | null> => {
    const params = new Map();
    params.set("location", `${lat},${long}`);
    params.set("radius", radius);
    params.set("type", category);
    if (nextPageToken !== "") {
        params.set("pageToken", nextPageToken)
    }   
    const url = createUrlWithKey(NEARBY_PLACES_URL, params);
    
    // Make request
    const res: ApiResponse<PlacesRes> = await httpUtils.get(url)
    return res.data;
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

interface GetPlaceDetailsRes {
    place_id: string;
	name: string;
	url: string;
	lat: number,
    long: number,
    created_at?: string,
	formatted_address: string;
	photos: PhotoRow[];
	reviews: ReviewRow[];
	dine_in: boolean;
	takeout: boolean;
	serves_breakfast: boolean;
	serves_lunch: boolean;
	serves_dinner: boolean;	
}

export const getPlaceDetails = async (supabaseClient: SupabaseClient, place_id: string): Promise<GetPlaceDetailsRes> => {    
    // Check db
    let placeDetails = await fetchPlaceDetails(supabaseClient, place_id)
    let result

    let isValid = true
    if (!placeDetails) { // not found in db
        isValid = false
    } else if (isOutdated(placeDetails)) { // too old
        isValid = false
    }

    if (isValid && placeDetails !== null) {
        result = placeDetails
    } else {
        // Get new results
        result = await requestPlaceDetails(supabaseClient, place_id)
    }
    
    const photos = await getPhotos(supabaseClient, place_id)
    const reviews = await getReviews(supabaseClient, place_id)
    return {
        ...result,
        photos,
        reviews
    }
}

const requestPlaceDetails = async (supabaseClient: SupabaseClient, place_id: string): Promise<PlaceDetailRow> => {
    const params = new Map();
    params.set("place_id", place_id);
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

    // Update placeDetails
    const processedPlaceDetail = await addPlaceDetails(supabaseClient, placeDetails.result)

    // Update photos
    await deletePhotos(supabaseClient, place_id)
    await addPhotos(supabaseClient, placeDetails?.result?.photos ? placeDetails.result.photos : [], place_id)

    // Update reviews
    await deleteReviews(supabaseClient, place_id)
    await addReviews(supabaseClient, placeDetails?.result?.reviews ? placeDetails.result.reviews : [], place_id)

    return processedPlaceDetail;
}