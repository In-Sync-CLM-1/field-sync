import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CRM_API_KEY = Deno.env.get('CRM_API_KEY');
const CRM_BASE_URL = Deno.env.get('CRM_BASE_URL');

// Rate limiting: 100 requests per minute
const rateLimiter = {
  requests: 0,
  resetTime: Date.now() + 60000,
};

function checkRateLimit(): boolean {
  if (Date.now() > rateLimiter.resetTime) {
    rateLimiter.requests = 0;
    rateLimiter.resetTime = Date.now() + 60000;
  }
  return rateLimiter.requests < 100;
}

async function fetchWithRetry(url: string, options: RequestInit, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      if (!checkRateLimit()) {
        console.warn('Rate limit reached, waiting...');
        await new Promise(resolve => setTimeout(resolve, 60000));
      }
      
      rateLimiter.requests++;
      const response = await fetch(url, options);
      
      if (response.status === 429) {
        const backoff = Math.pow(2, i) * 1000;
        console.log(`Rate limited, retrying in ${backoff}ms...`);
        await new Promise(resolve => setTimeout(resolve, backoff));
        continue;
      }
      
      return response;
    } catch (error) {
      if (i === retries - 1) throw error;
      const backoff = Math.pow(2, i) * 1000;
      console.log(`Request failed, retrying in ${backoff}ms...`);
      await new Promise(resolve => setTimeout(resolve, backoff));
    }
  }
  throw new Error('Max retries exceeded');
}

serve(async (req) => {
  const requestId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const startTime = Date.now();
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, data } = await req.json();
    console.log(`[${requestId}] CRM Sync request:`, { 
      action, 
      timestamp: new Date().toISOString(),
      hasData: !!data 
    });

    if (!CRM_API_KEY || !CRM_BASE_URL) {
      throw new Error('CRM credentials not configured');
    }

    const headers = {
      'X-API-Key': CRM_API_KEY,
      'Content-Type': 'application/json',
    };

    switch (action) {
      case 'test_connection': {
        console.log(`[${requestId}] Testing CRM connection...`, {
          baseUrl: CRM_BASE_URL,
          hasApiKey: !!CRM_API_KEY
        });
        
        // Try multiple common endpoint patterns
        const endpoints = [
          '/api/v1/contacts',
          '/api/contacts',
          '/contacts',
          '/api/v1/customers',
          '/api/customers',
          '/customers'
        ];

        const results = [];
        
        for (const endpoint of endpoints) {
          try {
            const testUrl = `${CRM_BASE_URL}${endpoint}?limit=1`;
            console.log(`[${requestId}] Testing endpoint: ${testUrl}`);
            
            const response = await fetch(testUrl, { 
              headers,
              signal: AbortSignal.timeout(5000) // 5 second timeout
            });

            results.push({
              endpoint,
              status: response.status,
              statusText: response.statusText,
              success: response.ok
            });

            if (response.ok) {
              const data = await response.json();
              console.log(`[${requestId}] ✅ Working endpoint found:`, {
                endpoint,
                status: response.status,
                dataKeys: Object.keys(data || {})
              });
              return new Response(
                JSON.stringify({ 
                  success: true,
                  workingEndpoint: endpoint,
                  fullUrl: testUrl,
                  status: response.status,
                  message: 'CRM connection successful!',
                  sampleData: data,
                  allResults: results,
                  requestId
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              );
            }
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            console.log(`[${requestId}] ❌ Endpoint failed:`, { endpoint, error: errorMsg });
            results.push({
              endpoint,
              error: errorMsg,
              success: false
            });
          }
        }

        // No working endpoint found
        console.error(`[${requestId}] ❌ No working endpoint found`, {
          baseUrl: CRM_BASE_URL,
          testedEndpoints: endpoints.length,
          results
        });
        
        return new Response(
          JSON.stringify({ 
            success: false,
            baseUrl: CRM_BASE_URL,
            message: 'No working endpoint found. Check the results below.',
            allResults: results,
            suggestion: 'Please verify your CRM_BASE_URL and check the API documentation for correct endpoint paths.',
            requestId
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }


      case 'push_visit': {
        console.log(`[${requestId}] Pushing visit to CRM:`, { 
          visitId: data?.id,
          customerId: data?.customerId,
          timestamp: new Date().toISOString()
        });
        
        // Create activity in CRM
        const activity = {
          activity_type: 'field_visit',
          subject: data.purpose || 'Field Visit',
          description: data.notes,
          scheduled_at: data.checkInTime,
          completed_at: data.checkOutTime,
          check_in_latitude: data.checkInLatitude,
          check_in_longitude: data.checkInLongitude,
          check_out_latitude: data.checkOutLatitude,
          check_out_longitude: data.checkOutLongitude,
          location_accuracy: data.locationAccuracy,
        };

        const pushStartTime = Date.now();
        const activityResponse = await fetchWithRetry(
          `${CRM_BASE_URL}/activities`,
          {
            method: 'POST',
            headers,
            body: JSON.stringify(activity)
          }
        );

        if (!activityResponse.ok) {
          const errorBody = await activityResponse.text();
          console.error(`[${requestId}] Failed to create activity:`, {
            status: activityResponse.status,
            statusText: activityResponse.statusText,
            body: errorBody
          });
          throw new Error(`Failed to create activity: ${activityResponse.statusText}`);
        }

        const activityResult = await activityResponse.json();
        console.log(`[${requestId}] Activity created:`, {
          activityId: activityResult.id || activityResult.activity_id,
          duration: `${Date.now() - pushStartTime}ms`
        });

        // Update contact location if available
        if (data.checkOutLatitude && data.checkOutLongitude) {
          console.log(`[${requestId}] Updating contact location...`);
          const locationStartTime = Date.now();
          const updateResponse = await fetchWithRetry(
            `${CRM_BASE_URL}/contacts/${data.customerId}`,
            {
              method: 'PATCH',
              headers,
              body: JSON.stringify({
                latitude: data.checkOutLatitude,
                longitude: data.checkOutLongitude,
                last_verified_location_at: data.checkOutTime || data.checkInTime,
              })
            }
          );

          if (!updateResponse.ok) {
            const errorBody = await updateResponse.text();
            console.error(`[${requestId}] Failed to update contact location:`, {
              status: updateResponse.status,
              statusText: updateResponse.statusText,
              body: errorBody
            });
          } else {
            console.log(`[${requestId}] Contact location updated:`, {
              duration: `${Date.now() - locationStartTime}ms`
            });
          }
        }

        const totalDuration = Date.now() - startTime;
        console.log(`[${requestId}] ✅ Visit push completed:`, {
          totalDuration: `${totalDuration}ms`,
          activityId: activityResult.id || activityResult.activity_id
        });
        
        return new Response(
          JSON.stringify({ 
            success: true,
            activityId: activityResult.id || activityResult.activity_id,
            requestId
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'push_photo': {
        console.log(`[${requestId}] Pushing photo to CRM:`, { 
          photoId: data?.id,
          visitId: data?.visitId
        });
        
        const photo = data;
        const activityData = {
          activity_type: 'photo',
          subject: `Photo: ${photo.caption || 'Field visit photo'}`,
          description: photo.notes || photo.caption,
          scheduled_at: photo.timestamp,
          metadata: {
            photo_url: photo.photoUrl,
            latitude: photo.latitude,
            longitude: photo.longitude,
            visit_id: photo.visitId,
          },
        };

        const response = await fetchWithRetry(
          `${CRM_BASE_URL}/contacts/${photo.customerId}/activities`,
          {
            method: 'POST',
            headers,
            body: JSON.stringify(activityData),
          }
        );

        if (!response.ok) {
          console.error(`[${requestId}] Failed to sync photo:`, {
            status: response.status,
            statusText: response.statusText
          });
          throw new Error(`Failed to sync photo: ${response.statusText}`);
        }

        const activity = await response.json();
        console.log(`[${requestId}] ✅ Photo synced:`, { activityId: activity.id });

        return new Response(
          JSON.stringify({ success: true, activityId: activity.id, requestId }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'push_form': {
        console.log(`[${requestId}] Pushing form to CRM:`, { 
          formId: data?.formId,
          visitId: data?.visitId
        });
        
        const form = data;
        const activityData = {
          activity_type: 'form_submission',
          subject: `Form: ${form.formName || 'Submission'}`,
          description: JSON.stringify(form.responses, null, 2),
          scheduled_at: form.completedAt,
          metadata: {
            form_id: form.formId,
            responses: form.responses,
            visit_id: form.visitId,
          },
        };

        const response = await fetchWithRetry(
          `${CRM_BASE_URL}/contacts/${form.customerId}/activities`,
          {
            method: 'POST',
            headers,
            body: JSON.stringify(activityData),
          }
        );

        if (!response.ok) {
          console.error(`[${requestId}] Failed to sync form:`, {
            status: response.status,
            statusText: response.statusText
          });
          throw new Error(`Failed to sync form: ${response.statusText}`);
        }

        const activity = await response.json();
        console.log(`[${requestId}] ✅ Form synced:`, { activityId: activity.id });

        return new Response(
          JSON.stringify({ success: true, activityId: activity.id, requestId }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'fetch_contacts': {
        const organizationId = data?.organization_id;
        
        if (!organizationId) {
          console.error(`[${requestId}] Missing organization_id in request`);
          return new Response(
            JSON.stringify({ error: 'organization_id is required', requestId }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log(`[${requestId}] Fetching contacts from CRM for org:`, organizationId);
        
        // Call CRM Bridge API with organization filter
        const bridgeUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/crm-bridge-api/contacts?organization_id=${organizationId}`;
        
        const response = await fetchWithRetry(bridgeUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[${requestId}] CRM Bridge API error:`, response.status, errorText);
          throw new Error(`CRM Bridge API error: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        
        console.log(`[${requestId}] Contacts fetched successfully:`, result.data?.contacts?.length || 0);

        return new Response(
          JSON.stringify({ 
            contacts: result.data?.contacts || [],
            meta: result.meta 
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        );
      }

      case 'fetch_users': {
        const organizationId = data?.organization_id;
        
        if (!organizationId) {
          console.error(`[${requestId}] Missing organization_id in request`);
          return new Response(
            JSON.stringify({ error: 'organization_id is required', requestId }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log(`[${requestId}] Fetching users from CRM for org:`, organizationId);
        
        const bridgeUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/crm-bridge-api/users?organization_id=${organizationId}`;
        
        const response = await fetchWithRetry(bridgeUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[${requestId}] CRM Bridge API error:`, response.status, errorText);
          throw new Error(`CRM Bridge API error: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        
        console.log(`[${requestId}] Users fetched successfully:`, result.data?.users?.length || 0);

        return new Response(
          JSON.stringify({ 
            users: result.data?.users || [],
            meta: result.meta 
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        );
      }

      case 'fetch_roles': {
        console.log(`[${requestId}] Fetching roles from CRM`);
        
        const bridgeUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/crm-bridge-api/roles`;
        
        const response = await fetchWithRetry(bridgeUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[${requestId}] CRM Bridge API error:`, response.status, errorText);
          throw new Error(`CRM Bridge API error: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        
        console.log(`[${requestId}] Roles fetched successfully:`, result.data?.roles?.length || 0);

        return new Response(
          JSON.stringify({ 
            roles: result.data?.roles || [],
            meta: result.meta 
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        );
      }

      case 'fetch_organizations': {
        const url = `${CRM_BASE_URL}/organizations`;
        
        console.log(`[${requestId}] Fetching organizations from CRM:`, url);
        
        const response = await fetchWithRetry(url, {
          method: 'GET',
          headers,
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[${requestId}] CRM API error:`, response.status, errorText);
          throw new Error(`CRM API error: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        
        console.log(`[${requestId}] Organizations fetched successfully:`, result.data?.organizations?.length || 0);

        // Validate response structure
        if (!result.success || !result.data?.organizations) {
          throw new Error('Invalid organizations response format');
        }

        return new Response(
          JSON.stringify({ 
            organizations: result.data.organizations,
            meta: result.meta 
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        );
      }

      default:
        console.error(`[${requestId}] Invalid action:`, { action });
        return new Response(
          JSON.stringify({ error: 'Invalid action', requestId }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[${requestId}] ❌ Error in crm-sync function:`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'An error occurred',
        requestId,
        duration
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
