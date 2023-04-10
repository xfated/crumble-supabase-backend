import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

import { Photo, extractObj } from "../_places_service/interfaces.ts"

export const PHOTO_TABLE = "photos"

const extractPhoto = extractObj<Photo>([
	"height",
	"width",
	"photo_reference"
])

export interface PhotoRow {
    id?: number;
    created_at?: number;
	height: number;
	width: number;
	photo_reference: string;
}

export async function addPhotos(supabaseClient: SupabaseClient, photos: Photo[], place_id: string) {
    var processedPhotos = []
    for (const photo of photos) {
        const data = extractPhoto(photo)
        processedPhotos.push({
            ...data,
            place_id
        })
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