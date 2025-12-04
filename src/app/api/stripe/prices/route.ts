import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createStripeClient, getProductsAndPrices } from '@/lib/stripe';

// Create Supabase client for auth
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: Request) {
  try {
    // Get auth token from header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];

    // Verify token and get user
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const organizationId = user.id;

    // Get organization's Stripe settings
    const { data: settings, error: settingsError } = await supabase
      .from('settings')
      .select('stripe_config')
      .eq('organization_id', organizationId)
      .single();

    if (settingsError) {
      console.error('Settings error:', settingsError);
      return NextResponse.json({ error: 'Settings not found' }, { status: 404 });
    }

    const stripeSecretKey = settings?.stripe_config?.secret_key;
    if (!stripeSecretKey) {
      return NextResponse.json({
        error: 'Stripe not connected',
        message: 'Please connect your Stripe account in Settings to import products.'
      }, { status: 400 });
    }

    // Create Stripe client with organization's key
    const stripeClient = createStripeClient(stripeSecretKey);

    // Fetch products and prices
    const products = await getProductsAndPrices(stripeClient);

    return NextResponse.json({ products });
  } catch (error) {
    console.error('Error fetching Stripe prices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products and prices' },
      { status: 500 }
    );
  }
}
