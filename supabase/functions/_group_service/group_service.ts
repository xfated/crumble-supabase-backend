import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { cryptoRandomString } from "https://deno.land/x/crypto_random_string@1.0.0/mod.ts"
import { GroupRow, getGroupRow, addGroup, deleteGroup, updateNextPageToken } from "../_database_utils/groups_utils.ts"
import { PlaceDetailRow } from "../_database_utils/placedetail_utils.ts"
import { addGroupPlaces, getGroupPlaces, getGroupPlacesWithToken } from "../_database_utils/groupplaces_utils.ts"
import { getNearbyPlacesWithDetails } from "../_places_service/places_service.ts"

// const TTL = 1
// const isOutdated = (groupRow: GroupRow): boolean => {
//     if (!groupRow.created_at) {
//         return true
//     }
//     const created_at = new Date(groupRow.created_at)
//     const ttl = new Date(new Date().setDate(new Date().getDate() - TTL))
//     // check if is older than TTL
//     return created_at < ttl
// }

const getNewGroupId = async (supabaseClient: SupabaseClient): Promise<string> => {
    let group_id = cryptoRandomString({length: 6, type: 'alphanumeric'})
    let groupExists = true
    while (groupExists) {
        const groupRow = await getGroupRow(supabaseClient, group_id)
        if (groupRow === null) { // null or outdated
            groupExists = false
        } else { // exists, try another group id
            group_id = cryptoRandomString({length: 6, type: 'alphanumeric'})   
        }
        //  else if (isOutdated(groupRow)) { // outdated
        //     groupExists = false
        //     await deleteGroup(supabaseClient, group_id)
        // } 
    }
    return group_id
}

interface CreateGroupRes {
    results: PlaceDetailRow[],
    next_page_token: string,
    group_id: string,
}

export const createGroup = async (supabaseClient: SupabaseClient, min_match: number, category: string, lat: number, long: number, radius: number): Promise<CreateGroupRes> => {
    // Get new group Id
    const group_id = await getNewGroupId(supabaseClient)

    // Get places for group
    const nearbyPlaces = await getNearbyPlacesWithDetails(supabaseClient, category, lat, long, radius, "")
    
    // Create group and add places
    await addGroup(supabaseClient, group_id, category, min_match, lat, long, radius, nearbyPlaces.next_page_token ?? "")
    await addGroupPlaces(supabaseClient, nearbyPlaces.results.map((place: PlaceDetailRow) => ({
        "group_id": group_id,
        "place_id": place.place_id,
        "next_page_token": "" // no next_page_token for first group of places
    })))

    return {
        ...nearbyPlaces,
        group_id,
    }
}

interface JoinGroupRes {
    results: PlaceDetailRow[],
    next_page_token: string,
    group_id: string,
}

export const joinGroup = async (supabaseClient: SupabaseClient, group_id: string): Promise<JoinGroupRes> => {
    // find existing group
    const groupRow = await getGroupRow(supabaseClient, group_id)
    if (groupRow === null) {
        throw new Error("Unable to find group")
    }

    // get places in group
    const nearbyPlaces = await getGroupPlaces(supabaseClient, group_id)

    return {
        group_id,
        next_page_token: groupRow.next_page_token,
        results: nearbyPlaces,
    }
}

interface GetGroupNextPlacesRes {
    results: PlaceDetailRow[],
    next_page_token: string,
    group_id: string,
}

export const getGroupNextPlaces = async (supabaseClient: SupabaseClient, group_id: string, next_page_token: string): Promise<GetGroupNextPlacesRes> => {
    // find existing group
    const groupRow = await getGroupRow(supabaseClient, group_id)
    if (groupRow === null) {
        throw new Error("Unable to find group")
    }
    
    // Check if places already requested
    let nearbyPlaces = await getGroupPlacesWithToken(supabaseClient, group_id, next_page_token)
    if (nearbyPlaces.length > 0) { // if already have results, return
        return {
            group_id,
            "next_page_token": groupRow.next_page_token, // update existing
            results: nearbyPlaces
        }
    }

    // fetch with next page token
    const newNearbyPlaces = await getNearbyPlacesWithDetails(supabaseClient, "", 0, 0, 0, next_page_token)
    
    // update newly fetched places
    await addGroupPlaces(supabaseClient, newNearbyPlaces.results.map((place: PlaceDetailRow) => ({
        "group_id": group_id,
        "place_id": place.place_id,
        "next_page_token": next_page_token // update next_page_token used to fetch
    })))

    // update next_page_token for group
    await updateNextPageToken(supabaseClient, group_id, newNearbyPlaces.next_page_token ?? null)
    return {
        group_id,
        next_page_token,
        results: newNearbyPlaces.results
    } 
}


