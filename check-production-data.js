const fetch = require('node-fetch');

const HASURA_ENDPOINT = 'https://travel-planner.hasura.app/v1/graphql';
const ADMIN_SECRET = 'cMv0MBpz27N2gf3eUEXdewaBqo1WK4t0yCZhEgXVyNHHXMiEdPONcCqAV9RrMKHb';

async function checkData() {
  try {
    console.log('Checking converted data in production...');

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
          sql: 'SELECT id, title, destination, travel_purpose FROM itineraries LIMIT 5;'
        }
      })
    });

    const result = await response.json();

    if (result.error) {
      console.error('Error:', result.error);
    } else {
      console.log('✅ Sample data:');
      console.log(result.result);
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkData();
