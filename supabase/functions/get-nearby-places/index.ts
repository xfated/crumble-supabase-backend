// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getNearbyPlaces } from "../_places_service/places_service.ts"

serve(async (req) => {
  try {
    const supabaseClient = createClient(
      // Supabase API URL - env var exported by default.
      Deno.env.get('SUPABASE_URL') ?? '',
      // Supabase API ANON KEY - env var exported by default.
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const { category, lat, long, radius, nextPageToken } = await req.json()
    const nearbyPlaces = await getNearbyPlaces(category, lat, long, radius, nextPageToken)
    
    return new Response(
      JSON.stringify(nearbyPlaces),
      { headers: { "Content-Type": "application/json" } },
    )
  } catch (error) {
    console.error(error)

    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})

// To invoke:
// curl -i --location --request POST 'http://localhost:54321/functions/v1/' \
//   --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
//   --header 'Content-Type: application/json' \
//   --data '{"category":"restaurant","lat":"1.352690","long":"103.720740","radius":"500","nextPageToken":"AUjq9jlA7jTqyy2w_f5ha5zfTWoORc8Iyr7ti4pf9mDbDsyCcPNrYUCxsWUrZDenNk3YPWk7JPDdCzXUPogufnvQ8r9Gh2IKbvAS5XRypBsomrSwmoa3_Bd76FYb1rFJPElAiMGxFihXctsrA825k6T_oXGbYlIDsSWZs-i3SRk2jwoA-B0PsdzzgATHBN9sS2BgnzoUtlK8X7FImhaBpqslmvsVnnP0lE-D6WKUCb_rdRucQU7AIYOg5cW15H1AqoI1IUwtWBXhb7ienCQ9D5nuRNMw4S-vDHGAanOmyl1yhWIJ7U0Hewe5muFiFE8LXJL5a0IdGx3GBNcT8FrFpKWxPSiaxiZcYa5ZsqlRk6jdSqz2QKu0FrgLPOD93Juwv7IruX_iLokkgEmi8-aDGouqnrz_o62R7kzT6-D9GLYBTkIPnlkF6vQtXfLn9_Ms"}'

// "restaurant", 1.352690, 103.720740, 500, ""