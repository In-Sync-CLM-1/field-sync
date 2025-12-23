import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CRM_BASE_URL = Deno.env.get('CRM_BASE_URL');
const CRM_API_KEY = Deno.env.get('CRM_API_KEY');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[CRM Bridge API] Request received:', {
      method: req.method,
      url: req.url,
      timestamp: new Date().toISOString(),
    });

    // Validate environment variables
    if (!CRM_BASE_URL || !CRM_API_KEY) {
      console.error('[CRM Bridge API] Missing CRM credentials');
      throw new Error('CRM credentials not configured');
    }

    // Parse the request URL to extract the path
    const url = new URL(req.url);
    let pathParts = url.pathname.split('/').filter(Boolean);
    
    // Remove function name from path if present (when called from other edge functions)
    if (pathParts[0] === 'crm-bridge-api') {
      pathParts = pathParts.slice(1);
    }
    
    // Build the CRM API URL
    let crmPath = '';
    let crmUrl = '';

    // Route based on path pattern
    if (pathParts[0] === 'contacts') {
      // GET /contacts with query params (including organization_id)
      if (req.method === 'GET' && pathParts.length === 1) {
        crmPath = '/contacts';
        crmUrl = `${CRM_BASE_URL}${crmPath}${url.search}`;
      }
    } else if (pathParts[0] === 'users') {
      // GET /users or /users with query params
      if (req.method === 'GET' && pathParts.length === 1) {
        crmPath = '/users';
        crmUrl = `${CRM_BASE_URL}${crmPath}${url.search}`;
      }
      // GET /users/:id
      else if (req.method === 'GET' && pathParts.length === 2) {
        const userId = pathParts[1];
        crmPath = `/users/${userId}`;
        crmUrl = `${CRM_BASE_URL}${crmPath}`;
      }
      // PATCH /users/:id
      else if (req.method === 'PATCH' && pathParts.length === 2) {
        const userId = pathParts[1];
        crmPath = `/users/${userId}`;
        crmUrl = `${CRM_BASE_URL}${crmPath}`;
      }
      // GET /users/:id/roles
      else if (req.method === 'GET' && pathParts.length === 3 && pathParts[2] === 'roles') {
        const userId = pathParts[1];
        crmPath = `/users/${userId}/roles`;
        crmUrl = `${CRM_BASE_URL}${crmPath}`;
      }
      // POST /users/:id/roles
      else if (req.method === 'POST' && pathParts.length === 3 && pathParts[2] === 'roles') {
        const userId = pathParts[1];
        crmPath = `/users/${userId}/roles`;
        crmUrl = `${CRM_BASE_URL}${crmPath}`;
      }
      // DELETE /users/:id/roles/:role_id
      else if (req.method === 'DELETE' && pathParts.length === 4 && pathParts[2] === 'roles') {
        const userId = pathParts[1];
        const roleId = pathParts[3];
        crmPath = `/users/${userId}/roles/${roleId}`;
        crmUrl = `${CRM_BASE_URL}${crmPath}`;
      }
    } 
    // GET /roles
    else if (req.method === 'GET' && pathParts[0] === 'roles' && pathParts.length === 1) {
      crmPath = '/roles';
      crmUrl = `${CRM_BASE_URL}${crmPath}${url.search}`;
    }

    if (!crmUrl) {
      console.error('[CRM Bridge API] Unsupported endpoint:', {
        method: req.method,
        path: url.pathname,
      });
      return new Response(
        JSON.stringify({ error: 'Unsupported endpoint' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('[CRM Bridge API] Proxying to CRM:', {
      method: req.method,
      crmUrl,
      crmPath,
    });

    // Prepare request options
    const requestOptions: RequestInit = {
      method: req.method,
      headers: {
        'X-API-Key': CRM_API_KEY,
        'Content-Type': 'application/json',
      },
    };

    // Add body for POST/PATCH requests
    if (req.method === 'POST' || req.method === 'PATCH') {
      const body = await req.text();
      if (body) {
        requestOptions.body = body;
        console.log('[CRM Bridge API] Request body:', body);
      }
    }

    // Make request to CRM API
    const crmResponse = await fetch(crmUrl, requestOptions);
    
    console.log('[CRM Bridge API] CRM response:', {
      status: crmResponse.status,
      statusText: crmResponse.statusText,
    });

    // Handle error responses
    if (!crmResponse.ok) {
      const errorBody = await crmResponse.text();
      console.error('[CRM Bridge API] CRM API error:', {
        status: crmResponse.status,
        statusText: crmResponse.statusText,
        body: errorBody,
      });
      
      return new Response(
        JSON.stringify({ 
          error: `CRM API error: ${crmResponse.status} ${crmResponse.statusText}`,
          details: errorBody 
        }),
        { 
          status: crmResponse.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Return successful response
    const responseData = await crmResponse.text();
    
    return new Response(responseData, {
      status: crmResponse.status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('[CRM Bridge API] Fatal error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        stack: errorStack 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
