import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

import { Review, extractObj } from "../_places_service/interfaces.ts"

export const REVIEW_TABLE = "reviews"

const extractReview = extractObj<Review>([
	"author_name",
	"time",
	"rating",
	"relative_time_description",
	"profile_photo_url",
	"language",
	"original_language",
	"text",
])

export interface ReviewRow {
    id?: number,
    created_at?: number;
	author_name: string;
	time: string;
	rating: number;
	relative_time_description: string;
	profile_photo_url: string;
	language: string;
	original_language: string;
	text: string;
}

export async function addReviews(supabaseClient: SupabaseClient, reviews: Review[], place_id: string) {
    var processedReviews = []
    for (const review of reviews) {
        const data = extractReview({
            ...review,
            "time": (new Date(review.time * 1000)).toISOString()
        })
        processedReviews.push({
            ...data,
            place_id,
        })   
    }
    const { error } = await supabaseClient.from(REVIEW_TABLE)
        .insert(processedReviews)
    if (error) {
        console.error(error.message)
        throw error
    } 
    
    return
}

export async function deleteReviews(supabaseClient: SupabaseClient, place_id: string) {
    const { error } = await supabaseClient.from(REVIEW_TABLE)
        .delete()
        .eq("place_id", place_id)
    if (error) {
        console.error(error.message)
        throw error
    } 
    
    return
}

export async function getReviews(supabaseClient: SupabaseClient, place_id: string): Promise<ReviewRow[]> {
    // Check database
    const { data, error } = await supabaseClient.from(REVIEW_TABLE)
        .select(`*`)
        .eq('place_id', place_id)

    if (error) {
        console.error(error.message)
        throw error
    } 

    return data as ReviewRow[]
}

