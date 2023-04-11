// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getNearbyPlacesWithDetails } from "../_places_service/places_service.ts"

serve(async (req) => {
  try {
    const supabaseClient = createClient(
      // Supabase API URL - env var exported by default.
      Deno.env.get('SUPABASE_URL') ?? '',
      // Supabase API ANON KEY - env var exported by default.
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const { category, lat, long, radius, nextPageToken } = await req.json()
    const nearbyPlaces = await getNearbyPlacesWithDetails(supabaseClient, category, lat, long, radius, nextPageToken)
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
//   --data '{"category":"restaurant","lat":"1.352690","long":"103.720740","radius":"500","nextPageToken":"AUjq9jnRW21IqEHdo1bK1V4N8JvuWRjTcN91RBmtCUPP72i_uJWOk_rESCmQDucrX-b4R0jJ_-o3kxNt6A3FCb7WM0PrkleIu5BGTHtXt1x7swiTeNMqqnJ93A1XaWizU27EPZYR9NF_AJtSS2Uoa3PkzztU1NHYwgjRlPOxgCjW1qyfnxG5wz5X_agu2PJ4tW7gyfVaaD-xlnF1Wt17Cn1FdCE65k51enGb9e1ky4febPh-ALelAPG1dU3V3cttCXpGAfveoe-jJecgmXbeQQrqh8Ykb_j8670jyZn4OT9P2L_b20XFIKzrvSpaljpryd_ug-Up97Fl5tsFD4x36Jz4w7027skX0wWYRLjSgSXQPqjQRhdLMbw0es4L-YkzuDnMLmdS-Nh0YALHXd5iUhg96fYGrpom4qcgpl_6mZAFaS3ORywYdUecxr9MhgOe3v9AerF__SplOD0krh2UZzac1N4E28gt-vP217DplBp7aIUJPaAuarbeDLXKN8vz6-ZkQ0fyyBGbo3mczjZhNyfpgw9XAiU7ohYn5Hic9RdIO_Ui6oVQacKK5gl6Oz9ucJ3Bq-r1CehJ1GZ4TJQy8cx_l9i5L0fSfsI3lhSvqsKoRGvFB-16TS5QZY-DSWL9fp7ualdLWb4S92KqkhP0JQ"}'

// "restaurant", 1.352690, 103.720740, 500, ""
// "nextPageToken": AUjq9jnRW21IqEHdo1bK1V4N8JvuWRjTcN91RBmtCUPP72i_uJWOk_rESCmQDucrX-b4R0jJ_-o3kxNt6A3FCb7WM0PrkleIu5BGTHtXt1x7swiTeNMqqnJ93A1XaWizU27EPZYR9NF_AJtSS2Uoa3PkzztU1NHYwgjRlPOxgCjW1qyfnxG5wz5X_agu2PJ4tW7gyfVaaD-xlnF1Wt17Cn1FdCE65k51enGb9e1ky4febPh-ALelAPG1dU3V3cttCXpGAfveoe-jJecgmXbeQQrqh8Ykb_j8670jyZn4OT9P2L_b20XFIKzrvSpaljpryd_ug-Up97Fl5tsFD4x36Jz4w7027skX0wWYRLjSgSXQPqjQRhdLMbw0es4L-YkzuDnMLmdS-Nh0YALHXd5iUhg96fYGrpom4qcgpl_6mZAFaS3ORywYdUecxr9MhgOe3v9AerF__SplOD0krh2UZzac1N4E28gt-vP217DplBp7aIUJPaAuarbeDLXKN8vz6-ZkQ0fyyBGbo3mczjZhNyfpgw9XAiU7ohYn5Hic9RdIO_Ui6oVQacKK5gl6Oz9ucJ3Bq-r1CehJ1GZ4TJQy8cx_l9i5L0fSfsI3lhSvqsKoRGvFB-16TS5QZY-DSWL9fp7ualdLWb4S92KqkhP0JQ