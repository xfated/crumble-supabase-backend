import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

import { PlaceDetail, extractObj } from "../_places_service/interfaces.ts"
import { REVIEW_TABLE } from "./review_utils.ts"
import { PHOTO_TABLE } from "./photo_utils.ts"

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
	dine_in: boolean;
	takeout: boolean;
	serves_breakfast: boolean;
	serves_lunch: boolean;
	serves_dinner: boolean;
}

export async function addPlaceDetails(supabaseClient: SupabaseClient, placeDetails: PlaceDetail): Promise<PlaceDetailRow> {
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
    
    return processedPlaceDetail
}

export async function fetchPlaceDetails(supabaseClient: SupabaseClient, place_id: string): Promise<PlaceDetailRow | null> {
    // Check database
    const { data, error } = await supabaseClient.from(PLACE_DETAIL_TABLE)
        .select(`
            *
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


