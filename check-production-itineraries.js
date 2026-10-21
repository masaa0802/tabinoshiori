const fetch = require('node-fetch');

const HASURA_ENDPOINT = 'https://travel-planner.hasura.app/v1/graphql';
const ADMIN_SECRET = process.env.HASURA_GRAPHQL_ADMIN_SECRET;
if (!ADMIN_SECRET) {
  console.error('HASURA_GRAPHQL_ADMIN_SECRET を環境変数で指定してください');
  process.exit(1);
}

async function checkItinerariesTable() {
  try {
    console.log('Checking itineraries table structure in production...');

    const response = await fetch(HASURA_ENDPOINT.replace('/v1/graphql', '/v2/query'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Hasura-Admin-Secret': ADMIN_SECRET
      },
      body: JSON.stringify({
        type: 'run_sql',
        args: {
          source: 'travel-planner-prd',
          sql: `
            SELECT column_name, data_type, udt_name
            FROM information_schema.columns 
            WHERE table_name = 'itineraries'
            ORDER BY ordinal_position;
          `
        }
      })
    });

    const result = await response.json();

    if (result.error) {
      console.error('Error:', result.error);
    } else {
      console.log('✅ Itineraries table structure:');
      console.log(result.result);
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkItinerariesTable();
