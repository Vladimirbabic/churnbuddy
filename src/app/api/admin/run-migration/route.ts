import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'Missing Supabase config' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  // Check current subscriptions table structure
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .limit(1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Return column names
  const columns = data && data.length > 0 ? Object.keys(data[0]) : [];

  return NextResponse.json({
    message: 'Current subscriptions columns',
    columns,
    sampleData: data
  });
}
