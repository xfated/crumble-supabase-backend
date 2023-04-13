// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createGroup } from "../_group_service/group_service.ts"
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit"

function ips(req: Request) {
  return req.headers.get('x-forwarded-for')?.split(/\s*,\s*/)
}

serve(async (req) => {
  try {
    // Handle rate limiting first
    const redis = new Redis({
      url: Deno.env.get("UPSTASH_REDIS_REST_URL")!,
      token: Deno.env.get("UPSTASH_REDIS_REST_TOKEN")!
    })
    const ratelimit = new Ratelimit({
      redis: redis,
      limiter: Ratelimit.slidingWindow(30, "60 s"),
      analytics: true
    })
    // use constant string to limit all requests with a single ratelimit
    // or use a userID, apiKey or ip address for individual limits
    const ipAddress = ips(req)
    const { success } = await ratelimit.limit(ipAddress);
    if (!success) {
      throw new Error("query limit exceeded")
    }

    const supabaseClient = createClient(
      // Supabase API URL - env var exported by default.
      Deno.env.get('SUPABASE_URL') ?? '',
      // Supabase API ANON KEY - env var exported by default.
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const { category, min_match, lat, long, radius } = await req.json()
    const createGroupRes = await createGroup(supabaseClient, min_match, category, lat, long, radius)

    return new Response(
      JSON.stringify(createGroupRes),
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
//   --data '{"category":"restaurant","min_match":"1","lat":"1.352690","long":"103.720740","radius":"500"}'
