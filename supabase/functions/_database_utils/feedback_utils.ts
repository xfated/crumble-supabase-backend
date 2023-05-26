import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

const FEEDBACK_TABLE = "feedback"

export interface FeedbackRow {
    id?: number,
    created_at?: string,
    rating: number,
    description: string
}

export async function addFeedbackRow(supabaseClient: SupabaseClient, rating: number, description: string) {
    const { data, error } = await supabaseClient.from(FEEDBACK_TABLE)
        .insert({
            rating,
            description
        })
    
    if (error) {
        console.error(error.message)
        throw error
    }
}