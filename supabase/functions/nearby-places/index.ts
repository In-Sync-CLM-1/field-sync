import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Google Places API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { latitude, longitude, radius = 5000, includedTypes = [], maxResultCount = 20 } = await req.json();

    if (!latitude || !longitude) {
      return new Response(
        JSON.stringify({ error: "latitude and longitude are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: Record<string, unknown> = {
      locationRestriction: {
        circle: {
          center: { latitude, longitude },
          radius: Math.min(radius, 50000),
        },
      },
      maxResultCount: Math.min(maxResultCount, 20),
    };

    if (includedTypes.length > 0) {
      body.includedTypes = includedTypes;
    }

    const fieldMask = [
      "places.displayName",
      "places.formattedAddress",
      "places.location",
      "places.primaryType",
      "places.nationalPhoneNumber",
      "places.internationalPhoneNumber",
      "places.id",
    ].join(",");

    const response = await fetch(
      "https://places.googleapis.com/v1/places:searchNearby",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": fieldMask,
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Google Places API error:", errorText);
      return new Response(
        JSON.stringify({ error: "Google Places API error", details: errorText }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();

    // Normalize the response
    const places = (data.places || []).map((place: Record<string, unknown>) => ({
      id: place.id,
      displayName: (place.displayName as Record<string, string>)?.text || "",
      formattedAddress: place.formattedAddress || "",
      location: place.location || {},
      primaryType: place.primaryType || "",
      phoneNumber:
        (place as Record<string, string>).nationalPhoneNumber ||
        (place as Record<string, string>).internationalPhoneNumber ||
        "",
    }));

    return new Response(JSON.stringify({ places }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
