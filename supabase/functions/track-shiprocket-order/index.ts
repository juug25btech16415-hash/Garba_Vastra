// Supabase Edge Function: track-shiprocket-order
// Securely communicates with Shiprocket API to fetch real-time tracking information.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

interface RequestBody {
  order_id?: string
  phone_number?: string
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ success: false, error: "Method not allowed. Use POST." }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const body: RequestBody = await req.json().catch(() => ({}))
    const { order_id, phone_number } = body

    if (!order_id || !order_id.trim()) {
      return new Response(
        JSON.stringify({ success: false, error: "Order ID is required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const cleanOrderId = order_id.trim()
    const cleanPhone = phone_number ? phone_number.trim() : ""

    // Optional DB Validation: Check order and phone in Supabase orders table if configured
    const supabaseUrl = Deno.env.get("SUPABASE_URL")
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

    let dbOrderRecord: any = null
    if (supabaseUrl && supabaseServiceKey && cleanPhone) {
      try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey)
        // Check if cleanOrderId is a UUID or matches order ID
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanOrderId)
        
        let query = supabase.from("orders").select("*")
        if (isUuid) {
          query = query.eq("id", cleanOrderId)
        } else {
          // If custom tracking_id or razorpay_order_id
          query = query.or(`tracking_id.eq.${cleanOrderId},razorpay_order_id.eq.${cleanOrderId}`)
        }

        const { data: orders, error: dbError } = await query
        if (!dbError && orders && orders.length > 0) {
          dbOrderRecord = orders[0]
          // Normalize phone number comparison (removing spaces, leading +91 / 0 if any)
          const stripPhone = (p: string) => p.replace(/\D/g, "").slice(-10)
          if (stripPhone(dbOrderRecord.phone) !== stripPhone(cleanPhone)) {
            return new Response(
              JSON.stringify({
                success: false,
                error: "The phone number does not match our records for this order ID.",
              }),
              { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            )
          }
        }
      } catch (err) {
        console.warn("Database validation warning (continuing to Shiprocket):", err)
      }
    }

    // Shiprocket API Credentials
    const shiprocketEmail = Deno.env.get("SHIPROCKET_EMAIL")
    const shiprocketPassword = Deno.env.get("SHIPROCKET_PASSWORD")

    if (!shiprocketEmail || !shiprocketPassword) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Shiprocket API credentials (SHIPROCKET_EMAIL, SHIPROCKET_PASSWORD) are not configured.",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Step 1: Authenticate with Shiprocket
    const authResponse = await fetch("https://apiv2.shiprocket.in/v1/external/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: shiprocketEmail,
        password: shiprocketPassword,
      }),
    })

    if (!authResponse.ok) {
      const authError = await authResponse.text()
      console.error("Shiprocket Authentication Failed:", authError)
      return new Response(
        JSON.stringify({
          success: false,
          error: "Authentication with shipping provider failed. Please verify credentials.",
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const authData = await authResponse.json()
    const token = authData.token

    if (!token) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to retrieve Shiprocket access token.",
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Step 2: Fetch Tracking Information by Order ID
    // If order record has a specific tracking_id or awb_code, we can also use that if needed
    const targetOrderId = (dbOrderRecord && dbOrderRecord.tracking_id) ? dbOrderRecord.tracking_id : cleanOrderId

    const trackResponse = await fetch(
      `https://apiv2.shiprocket.in/v1/external/courier/track/order/${encodeURIComponent(targetOrderId)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      }
    )

    const trackData = await trackResponse.json()

    if (!trackResponse.ok || (trackData && trackData.status_code === 404)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: trackData?.message || "No tracking details found for this Order ID.",
          data: trackData,
        }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Extract normalized tracking details from Shiprocket response structure
    const trackingObj = trackData.tracking_data || trackData
    const shipmentTracks = trackingObj.shipment_track || []
    const trackDetails = Array.isArray(shipmentTracks) && shipmentTracks.length > 0 ? shipmentTracks[0] : shipmentTracks
    const activities = trackingObj.shipment_track_activities || []

    const responsePayload = {
      success: true,
      order_id: cleanOrderId,
      current_status: trackDetails?.current_status || trackingObj.track_status_description || "Processing",
      status_code: trackingObj.track_status || trackDetails?.status,
      courier_name: trackDetails?.courier_name || trackingObj.courier_name || "Shiprocket Partner",
      awb_code: trackDetails?.awb_code || trackingObj.awb_code || "",
      origin: trackDetails?.origin || "",
      destination: trackDetails?.destination || "",
      pickup_date: trackDetails?.pickup_date || "",
      delivered_date: trackDetails?.delivered_date || "",
      edd: trackDetails?.edd || trackingObj.edd || "",
      track_url: trackingObj.track_url || "",
      activities: Array.isArray(activities)
        ? activities.map((act: any) => ({
            date: act.date || act["sr-date"] || "",
            status: act.status || act["sr-status"] || "",
            activity: act.activity || act.status || "",
            location: act.location || act["sr-location"] || "",
          }))
        : [],
      raw_data: trackData,
      db_order: dbOrderRecord
        ? {
            total: dbOrderRecord.total,
            created_at: dbOrderRecord.created_at,
            customer_name: dbOrderRecord.customer_name,
            order_status: dbOrderRecord.order_status,
          }
        : null,
    }

    return new Response(JSON.stringify(responsePayload), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (error: any) {
    console.error("Unexpected Error in track-shiprocket-order:", error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error?.message || "Internal server error occurred while tracking order.",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
