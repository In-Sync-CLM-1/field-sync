import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface ParseRequest {
  image_base64: string;
  parse_type: 'business_card' | 'invoice' | 'order' | 'receipt' | 'product_list' | 'notes';
  context?: Record<string, string>;
}

const PROMPTS: Record<string, string> = {
  business_card: `Extract the following from this business card image. Return ONLY valid JSON:
{
  "name": "full name",
  "phone": "phone number with country code if visible",
  "email": "email address",
  "company": "company/organization name",
  "designation": "job title/designation",
  "address": "full address",
  "city": "city",
  "state": "state",
  "website": "website URL"
}
If a field is not visible, use empty string. Do not guess or infer.`,

  invoice: `Extract the following from this invoice image. Return ONLY valid JSON:
{
  "vendor_name": "seller/vendor company name",
  "invoice_number": "invoice/bill number",
  "date": "invoice date in YYYY-MM-DD format",
  "items": [{"description": "item name", "quantity": "qty", "amount": "amount"}],
  "subtotal": "subtotal amount as number",
  "tax_amount": "tax/GST amount as number",
  "total": "total amount as number",
  "gst_number": "GST/tax registration number if visible"
}
If a field is not visible, use empty string or 0 for numbers. Parse all line items.`,

  order: `Extract order details from this image (could be handwritten or printed). Return ONLY valid JSON:
{
  "items_text": "list all items with quantities as readable text, one per line",
  "estimated_total": "total amount if visible, as number, or 0",
  "customer_name": "customer name if visible",
  "date": "date if visible in YYYY-MM-DD format",
  "notes": "any additional notes"
}`,

  receipt: `Extract payment/receipt details from this image. Return ONLY valid JSON:
{
  "amount": "payment amount as number",
  "date": "date in YYYY-MM-DD format if visible",
  "description": "what the payment is for",
  "receipt_number": "receipt/reference number if visible",
  "payer_name": "who paid, if visible"
}`,

  product_list: `Extract product catalog details from this image (could be a price list, menu, or catalog page). Return ONLY valid JSON:
{
  "products": [
    {"name": "product name", "price": "price as number", "description": "brief description if available"}
  ]
}
Extract ALL products visible in the image.`,

  notes: `Extract and transcribe the text content from this image (could be handwritten notes). Return ONLY valid JSON:
{
  "text": "the full transcribed text content",
  "summary": "a brief 1-line summary of the content"
}`,
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image_base64, parse_type, context } = await req.json() as ParseRequest;

    if (!image_base64 || !parse_type) {
      return new Response(
        JSON.stringify({ error: 'image_base64 and parse_type are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const prompt = PROMPTS[parse_type];
    if (!prompt) {
      return new Response(
        JSON.stringify({ error: `Invalid parse_type: ${parse_type}. Valid types: ${Object.keys(PROMPTS).join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine media type from base64 header or default to jpeg
    let mediaType = 'image/jpeg';
    let cleanBase64 = image_base64;
    if (image_base64.startsWith('data:')) {
      const match = image_base64.match(/^data:(image\/\w+);base64,/);
      if (match) {
        mediaType = match[1];
        cleanBase64 = image_base64.split(',')[1];
      }
    }

    const contextHint = context ? `\nAdditional context: ${JSON.stringify(context)}` : '';

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2048,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mediaType,
                  data: cleanBase64,
                },
              },
              {
                type: 'text',
                text: prompt + contextHint,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API error:', errorText);
      return new Response(
        JSON.stringify({ error: 'AI parsing failed', details: errorText }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResponse = await response.json();
    const content = aiResponse.content?.[0]?.text || '';

    // Extract JSON from the response (handle markdown code blocks)
    let parsed;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        parsed = JSON.parse(content);
      }
    } catch (parseError) {
      return new Response(
        JSON.stringify({
          error: 'Could not parse AI response as JSON',
          raw_response: content,
          parse_type
        }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: parsed,
        parse_type
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
