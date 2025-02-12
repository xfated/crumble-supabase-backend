import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { PLACE_DETAIL_TABLE, PlaceDetailRow } from "./placedetail_utils.ts"
import { PHOTO_TABLE } from "./photo_utils.ts"
import { REVIEW_TABLE } from "./review_utils.ts"

const GROUPPLACE_TABLE = "groupplaces"

export interface GroupPlaceRow {
    created_at?: string,
    group_id: string,
    place_id: string,
    next_page_token: string
}

async function addGroupPlace(supabaseClient: SupabaseClient, group_id: string, place_id: string, next_page_token: string) {
    const { error } = await supabaseClient.from(GROUPPLACE_TABLE)
        .insert({
            group_id,
            place_id,
            next_page_token
        })
    if (error) {
        console.error(error.message)
        throw error
    } 
    return
}

export async function addGroupPlaces(supabaseClient: SupabaseClient, groupPlaces: GroupPlaceRow[]) {
    const { error } = await supabaseClient.from(GROUPPLACE_TABLE)
        .upsert(groupPlaces.map((row: GroupPlaceRow) => ({
            "group_id": row.group_id,
            "place_id": row.place_id,
            "next_page_token": row.next_page_token
        })))   
    if (error) {
        console.error(error.message)
        throw error
    } 
    return
}

interface GroupPlaceDetail {
    placedetails: any
}
export async function getGroupPlaces(supabaseClient: SupabaseClient, group_id: string): Promise<PlaceDetailRow[]> {
    const { data, error } = await supabaseClient.from(GROUPPLACE_TABLE)
        .select(
            `${PLACE_DETAIL_TABLE} (
                *,
                ${PHOTO_TABLE} (*),
                ${REVIEW_TABLE} (*)
            )`
        )
        .eq('group_id', group_id)
    
    if (error) {
        console.error(error.message)
        throw error
    } 

    return (data as GroupPlaceDetail[]).map((item: any) => { return (item.placedetails as PlaceDetailRow)})
}

export async function getGroupPlacesWithToken(supabaseClient: SupabaseClient, group_id: string, next_page_token: string): Promise<PlaceDetailRow[]> {
    const { data, error } = await supabaseClient.from(GROUPPLACE_TABLE)
        .select(
            `${PLACE_DETAIL_TABLE} (
                *,
                ${PHOTO_TABLE} (*),
                ${REVIEW_TABLE} (*)
            )`
        )
        .eq('group_id', group_id)
        .eq('next_page_token', next_page_token)

    if (error) {
        console.error(error.message)
        throw error
    } 
    return (data as GroupPlaceDetail[]).map((item: GroupPlaceDetail) => { return item.placedetails })
}