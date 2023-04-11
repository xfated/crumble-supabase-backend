import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { cryptoRandomString } from "https://deno.land/x/crypto_random_string@1.0.0/mod.ts"
import { GroupRow, getGroupRow, addGroup, deleteGroup } from "../_database_utils/groups_utils.ts"
import { PlaceDetailRow } from "../_database_utils/placedetail_utils.ts"
import { addGroupPlaces } from "../_database_utils/groupplaces_utils.ts"
import { getNearbyPlacesWithDetails } from "../_places_service/places_service.ts"

export interface CreateGroupRes {
    results: PlaceDetailRow[],
    next_page_token: string,
    group_id: string
}

const TTL = 1
const isOutdated = (groupRow: GroupRow): boolean => {
    if (!groupRow.created_at) {
        return true
    }
    const created_at = new Date(groupRow.created_at)
    const ttl = new Date(new Date().setDate(new Date().getDate() - TTL))
    // check if is older than TTL
    return created_at < ttl
}

const getNewGroupId = async (supabaseClient: SupabaseClient): Promise<string> => {
    let group_id = cryptoRandomString({length: 6, type: 'alphanumeric'})
    let groupExists = true
    while (groupExists) {
        const groupRow = await getGroupRow(supabaseClient, group_id)
        if (groupRow === null) { // null or outdated
            groupExists = false
        } else if (isOutdated(groupRow)) { // outdated
            groupExists = false
            await deleteGroup(supabaseClient, group_id)
        } else { // exists, try another group id
            group_id = cryptoRandomString({length: 6, type: 'alphanumeric'})   
        }
    }
    return group_id
}

export const createGroup = async (supabaseClient: SupabaseClient, min_match: number, category: string, lat: number, long: number, radius: number): Promise<CreateGroupRes> => {
    // Get new group Id
    const group_id = await getNewGroupId(supabaseClient)

    // Get places for group
    const nearbyPlaces = await getNearbyPlacesWithDetails(supabaseClient, category, lat, long, radius, "")
    
    // Create group and add places
    await addGroup(supabaseClient, group_id, category, min_match, lat, long, radius)
    await addGroupPlaces(supabaseClient, nearbyPlaces.results.map((place: PlaceDetailRow) => ({
        "group_id": group_id,
        "place_id": place.place_id
    })))

    return {
        ...nearbyPlaces,
        group_id
    }
}