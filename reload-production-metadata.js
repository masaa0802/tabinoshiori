const fetch = require('node-fetch');

const HASURA_ENDPOINT = 'https://travel-planner.hasura.app/v1/graphql';
const ADMIN_SECRET = process.env.HASURA_GRAPHQL_ADMIN_SECRET;
if (!ADMIN_SECRET) {
  console.error('HASURA_GRAPHQL_ADMIN_SECRET を環境変数で指定してください');
  process.exit(1);
}

async function reloadMetadata() {
  try {
    console.log('Reloading Hasura metadata in production...');

    const response = await fetch(HASURA_ENDPOINT.replace('/v1/graphql', '/v1/metadata'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Hasura-Admin-Secret': ADMIN_SECRET
      },
      body: JSON.stringify({
        type: 'reload_metadata',
        args: {
          reload_remote_schemas: true
        }
      })
    });

    const result = await response.json();

    if (result.message === 'success' || !result.error) {
      console.log('✅ Metadata reloaded successfully!');
      console.log('Result:', result);
    } else {
      console.error('Error reloading metadata:', result.error || result);
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

reloadMetadata();
