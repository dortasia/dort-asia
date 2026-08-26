import { getPublishedMarketplaceApps } from './src/lib/marketplace-data';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function run() {
  const apps = await getPublishedMarketplaceApps();
  console.log(JSON.stringify(apps, null, 2));
}

run();
