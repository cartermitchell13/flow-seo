import { redirect } from 'next/navigation';

/**
 * Authorize API Route Handler
 * --------------------------
 * This route generates and redirects to Webflow's authorization URL.
 */

export async function GET() {
  return redirect('/api/auth');
}
