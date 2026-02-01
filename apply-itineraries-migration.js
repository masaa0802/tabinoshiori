const fetch = require('node-fetch');

const HASURA_ENDPOINT = 'https://travel-planner.hasura.app/v1/graphql';
const ADMIN_SECRET = 'cMv0MBpz27N2gf3eUEXdewaBqo1WK4t0yCZhEgXVyNHHXMiEdPONcCqAV9RrMKHb';

async function updateItinerariesColumns() {
  try {
    console.log('Converting destination and travel_purpose from ARRAY to VARCHAR in production...');

    // まず既存のデータを確認
    const checkResponse = await fetch(HASURA_ENDPOINT.replace('/v1/graphql', '/v2/query'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Hasura-Admin-Secret': ADMIN_SECRET
      },
      body: JSON.stringify({
        type: 'run_sql',
        args: {
          source: 'travel-planner-prd',
          sql: 'SELECT COUNT(*) FROM itineraries;'
        }
      })
    });

    const checkResult = await checkResponse.json();
    console.log('Current itineraries count:', checkResult.result);

    // カラムの型を変更
    const migrationSQL = `
      -- destination列を配列から文字列に変換
      ALTER TABLE itineraries 
        ALTER COLUMN destination TYPE VARCHAR 
        USING array_to_string(destination, ', ');

      -- travel_purpose列を配列から文字列に変換
      ALTER TABLE itineraries 
        ALTER COLUMN travel_purpose TYPE VARCHAR 
        USING array_to_string(travel_purpose, ', ');
    `;

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
          sql: migrationSQL
        }
      })
    });

    const result = await response.json();

    if (result.error) {
      console.error('Error applying migration:', result.error);
    } else {
      console.log('✅ Migration applied successfully!');
      console.log('Result:', result);
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

updateItinerariesColumns();
