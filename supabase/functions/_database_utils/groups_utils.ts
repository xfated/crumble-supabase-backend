import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

const GROUP_TABLE = "groups"

export interface GroupRow {
    id: string,
    created_at?: string,
    category: string,
    min_match: number,
    lat: number,
    long: number,
    match: string,
    next_page_token: string
}

export async function addGroup(supabaseClient: SupabaseClient, 
        id: string,
        category: string,
        min_match: number,
        lat: number,
        long: number,
        radius: number,
        next_page_token: string
    ) {
    const { error } = await supabaseClient.from(GROUP_TABLE)
        .insert({
            id,
            category,
            min_match,
            lat,
            long,
            radius,
            next_page_token
        })

    if (error) {
        console.error(error.message)
        throw error
    } 
    return
} 

async function updateValue<T>(supabaseClient: SupabaseClient, 
        field: string,
        val: T,
        group_id: string
    ) {
    const { error } = await supabaseClient.from(GROUP_TABLE)
        .update({field: val})
        .eq('id', group_id)

    if (error) {
        console.error(error.message)
        throw error
    } 
    return    
}

export async function updateCurFetch(supabaseClient: SupabaseClient, curFetch: number, group_id: string) {
    await updateValue<number>(supabaseClient, "cur_fetch", curFetch, group_id)
}

export async function updateMatch(supabaseClient: SupabaseClient, place_id: string, group_id: string) {
    await updateValue<string>(supabaseClient, "place_id", place_id, group_id)
}

export async function deleteGroup(supabaseClient: SupabaseClient, group_id: string) {
    const { error } = await supabaseClient.from(GROUP_TABLE)
        .delete()
        .eq("id", group_id)

    if (error) {
        console.error(error.message)
        throw error
    } 
    return
}
    
export async function getGroupRow(supabaseClient: SupabaseClient, group_id: string): Promise<GroupRow | null> {
    const { data, error } = await supabaseClient.from(GROUP_TABLE)
        .select(`*`)
        .eq("id", group_id)
    
        if (error) {
            console.error(error.message)
            throw error
        } 
    
        // No details found
        if (data.length == 0) {
            return null
        }
        const groupRow = data[0] as GroupRow
        return groupRow
}