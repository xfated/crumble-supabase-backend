import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

import { Photo, extractObj } from "../_places_service/interfaces.ts"
import { getImageBase64 } from "../_places_service/place_requests.ts"

export const PHOTO_TABLE = "photos"

export interface PhotoRow {
    id?: number;
    created_at?: number;
	place_id: string;
	data_url: string;
}

export async function addPhotos(supabaseClient: SupabaseClient, photos: Photo[], place_id: string) {
    var processedPhotos = []
    for (const photo of photos) {
        let data_url = await getImageBase64(photo.photo_reference)
        if (data_url.length > 0) {
            processedPhotos.push({
                place_id,
                data_url
            })
        }
    }
    
    const { error } = await supabaseClient.from(PHOTO_TABLE)
        .insert(processedPhotos)
    if (error) {
        console.error(error.message)
        throw error
    } 
    
    return
}

export async function deletePhotos(supabaseClient: SupabaseClient, place_id: string) {
    const { error } = await supabaseClient.from(PHOTO_TABLE)
        .delete()
        .eq("place_id", place_id)
    if (error) {
        console.error(error.message)
        throw error
    } 
    
    return
}

export async function getPhotos(supabaseClient: SupabaseClient, place_id: string): Promise<PhotoRow[]> {
    // Check database
    const { data, error } = await supabaseClient.from(PHOTO_TABLE)
        .select(`*`)
        .eq('place_id', place_id)

    if (error) {
        console.error(error.message)
        throw error
    } 

    return data as PhotoRow[]
}