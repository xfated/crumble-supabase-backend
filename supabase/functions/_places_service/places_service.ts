import { Place, DetailRes, PlacesRes } from "./interfaces.ts"
import { addReviews, getReviews, deleteReviews, ReviewRow } from "../_database_utils/review_utils.ts"
import { addPhotos, getPhotos, deletePhotos, PhotoRow } from "../_database_utils/photo_utils.ts"
import { addPlaceDetails, deletePlaceDetails, fetchPlaceDetails, PlaceDetailRow } from "../_database_utils/placedetail_utils.ts"
import { getNearbyPlaces, queryPlaceDetails } from "./place_requests.ts"
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

const TTL = 7 // days

interface GetNearbyPlacesWithDetailsRes {
    results: PlaceDetailRow[],
    next_page_token: string
}

export const getNearbyPlacesWithDetails = async (supabaseClient: SupabaseClient, category: string, lat: number, long: number, radius: number, nextPageToken: string): Promise<GetNearbyPlacesWithDetailsRes> => {
    const results = await getNearbyPlaces(category, lat, long, radius, nextPageToken)
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

    // if is valid, return
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
    const placeDetails = await queryPlaceDetails(placeData);

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