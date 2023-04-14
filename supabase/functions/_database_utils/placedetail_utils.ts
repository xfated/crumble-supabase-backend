import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

import { Place, PlaceDetail, AddressComponent, extractObj } from "../_places_service/interfaces.ts"
import { REVIEW_TABLE, ReviewRow } from "./review_utils.ts"
import { PHOTO_TABLE, PhotoRow } from "./photo_utils.ts"
import { getImageBase64 } from "../_places_service/place_requests.ts"

export const PLACE_DETAIL_TABLE = "placedetails"

const extractNearbyPlaceData = extractObj<Place>([
    "name",
    "place_id",
    "vicinity",
	"price_level",
	"rating",
	"user_ratings_total",
	"business_status"
])
const extractPlaceDetail = extractObj<PlaceDetail>([
    "place_id",
    "name",
    "url",
    "formatted_address",
    "dine_in",
    "takeout",
    "serves_breakfast",
    "serves_lunch",
    "serves_dinner"
])

export interface PlaceDetailRow {
    place_id: string,
    created_at: string,
	name: string,
	url: string,
	lat: number,
    long: number,
	formatted_address: string;
    photo: string;
    photos: PhotoRow[];
    reviews: ReviewRow[];
	dine_in: boolean;
	takeout: boolean;
	serves_breakfast: boolean;
	serves_lunch: boolean;
	serves_dinner: boolean;
    country_long: string;
    country_short: string;
    locality: string;
    route: string;
    postal_code: string;
    neighbourhood: string;

    // info from Place
    vicinity: string;
    types: string;
    price_level: number;
    rating: number;
    user_ratings_total: number;
    business_status: string;
}

const extractAddresses = (placeDetail: PlaceDetail, fields: string[]): {[address: string]: AddressComponent} => {
    const locations: {[address: string]: AddressComponent} = {}
    if (!placeDetail.address_components) {
        return locations
    }
    for (let field of fields) {
        const loc = placeDetail.address_components.filter(x => x.types.includes(field))
        if (loc.length > 0) {
            locations[field] = loc[0]
        }
    }
    return locations
}

export async function addPlaceDetails(supabaseClient: SupabaseClient, nearbyPlaceData: Place, placeDetails: PlaceDetail) {
    const placeData = extractPlaceDetail(placeDetails)
    const extractedNearbyPlaceData = extractNearbyPlaceData(nearbyPlaceData)

    const locations = extractAddresses(placeDetails, ["country", "locality", "route", "postal_code", "neighborhood"])

    // get photo dataurl
    let photoDataUrl = nearbyPlaceData.photos?.length > 0 ? await getImageBase64(nearbyPlaceData.photos[0].photo_reference) : ""
    
    const processedPlaceDetail = {
        ...extractedNearbyPlaceData,
        ...placeData,
        "lat": placeDetails.geometry.location.lat,
        "long": placeDetails.geometry.location.lng,
        "country_long": locations["country"]?.long_name ?? "",
        "country_short": locations["country"]?.short_name ?? "",
        "locality": locations["locality"]?.short_name ?? "",
        "route": locations["route"]?.short_name ?? "",
        "postal_code": locations["postal_code"]?.short_name ?? "",
        "neighborhood": locations["neighborhood"]?.short_name ?? "",
        "types": nearbyPlaceData.types.join(","),
        "photo": photoDataUrl
    }

    const { error } = await supabaseClient.from(PLACE_DETAIL_TABLE)
        .upsert(processedPlaceDetail)

    if (error) {
        console.error(error.message)
        throw error
    } 
    
    return
}

export async function deletePlaceDetails(supabaseClient: SupabaseClient, place_id: string) {
    const { error } = await supabaseClient.from(PLACE_DETAIL_TABLE)
        .delete()
        .eq("place_id", place_id)

    if (error) {
        console.error(error.message)
        throw error
    } 
    
    return
}

export async function fetchPlaceDetails(supabaseClient: SupabaseClient, place_id: string): Promise<PlaceDetailRow | null> {
    // Check database
    const { data, error } = await supabaseClient.from(PLACE_DETAIL_TABLE)
        .select(`
            *,
            ${PHOTO_TABLE} (*),
            ${REVIEW_TABLE} (*)
        `)
        .eq('place_id', place_id)

    if (error) {
        console.error(error.message)
        throw error
    } 

    // No details found
    if (data.length == 0) {
        return null
    }
    const placeDetails = data[0] as PlaceDetailRow
    return placeDetails
}


