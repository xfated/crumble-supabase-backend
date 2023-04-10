import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

import { PlaceDetail, extractObj } from "../_places_service/interfaces.ts"
import { REVIEW_TABLE, ReviewRow } from "./review_utils.ts"
import { PHOTO_TABLE, PhotoRow } from "./photo_utils.ts"

const PLACE_DETAIL_TABLE = "placedetails"

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
    created_at?: string,
	name: string,
	url: string,
	lat: number,
    long: number,
	formatted_address: string;
    photos: PhotoRow[];
    reviews: ReviewRow[];
	dine_in: boolean;
	takeout: boolean;
	serves_breakfast: boolean;
	serves_lunch: boolean;
	serves_dinner: boolean;
}

export async function addPlaceDetails(supabaseClient: SupabaseClient, placeDetails: PlaceDetail) {
    const data = extractPlaceDetail(placeDetails)
    
    const processedPlaceDetail = {
        ...data,
        "lat": placeDetails.geometry.location.lat,
        "long": placeDetails.geometry.location.lng
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


