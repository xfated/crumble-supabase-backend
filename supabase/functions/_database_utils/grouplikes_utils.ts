import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { ICount } from './interfaces.ts'

const GROUPLIKES_TABLE = "grouplikes"

export interface GroupLikeRow {
    id?: number,
    created_at?: string,
    group_id: string,
    place_id: string
}

export async function addGroupLikeRow(supabaseClient: SupabaseClient, group_id: string, place_id: string) {
    const { data, error } = await supabaseClient.from(GROUPLIKES_TABLE)
        .insert({
            group_id,
            place_id
        })
    
    if (error) {
        console.error(error.message)
        throw error
    } 
    return
}

export async function countNumLikes(supabaseClient: SupabaseClient, group_id: string, place_id: string): Promise<number> {
    const { data, error } = await supabaseClient.from(GROUPLIKES_TABLE)
        .select(`count`)
        .eq("group_id", group_id)
        .eq("place_id", place_id)
    
    if (error) {
        console.error(error.message)
        throw error
    }
    const cnt = (data[0] as {"count": number})
    return cnt.count
}
