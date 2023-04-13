import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

const VERSION_TABLE = "version"

interface VersionRow {
    id: number,
    created_at: string,
    version: string
}

export async function checkVersion(supabaseClient: SupabaseClient, version_number: string): boolean {
    const { data, error } = await supabaseClient.from(VERSION_TABLE)
        .select(`*`)

    if (error) {
        console.error(error.message)
        throw error
    }   
    
    // Version not found
    if (data.length == 0) {
        return false
    }
    const versionRow = data[0] as VersionRow
    return versionRow.version === version_number
}