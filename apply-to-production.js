const fetch = require('node-fetch');
const fs = require('fs');

const HASURA_ENDPOINT = 'https://travel-planner.hasura.app/v1/graphql';
const ADMIN_SECRET = 'cMv0MBpz27N2gf3eUEXdewaBqo1WK4t0yCZhEgXVyNHHXMiEdPONcCqAV9RrMKHb';

// Read the SQL migration file
const migrationSQL = fs.readFileSync('/Users/gm510/Dev/travel-planner/hasura-project/migrations/default/4_add_token_to_groups/up.sql', 'utf8');

// Execute SQL via run_sql API
async function applyMigrationToProduction() {
  try {
    console.log('Applying token column to groups table in production...');

    const query = `
      mutation RunSQL($sql: String!) {
        run_sql(args: {sql: $sql}) {
          result_type
          result
        }
      }
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

applyMigrationToProduction();