import { NextResponse } from 'next/server';
import { fetchProductsAction } from '@/app/actions/fetch-products';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query') || '';
  const category = searchParams.get('category') || 'all';
  const gl = searchParams.get('gl') || 'us';
  const page = parseInt(searchParams.get('page') || '1', 10);

  try {
    const products = await fetchProductsAction(query, category, gl, page);
    return NextResponse.json(products);
  } catch (error) {
    console.error('Error in /api/products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}
