const fetch = require('node-fetch');

const HASURA_ENDPOINT = 'https://travel-planner.hasura.app/v1/graphql';
const ADMIN_SECRET = 'cMv0MBpz27N2gf3eUEXdewaBqo1WK4t0yCZhEgXVyNHHXMiEdPONcCqAV9RrMKHb';

// Check current schema by querying introspection
const introspectionQuery = `
  query IntrospectionQuery {
    __schema {
      types {
        name
        kind
        fields {
          name
          type {
            name
            kind
          }
        }
      }
    }
  }
`;

async function checkProductionSchema() {
  try {
    console.log('Checking production Hasura schema...');
    console.log('Endpoint:', HASURA_ENDPOINT);

    const response = await fetch(HASURA_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Hasura-Admin-Secret': ADMIN_SECRET
      },
      body: JSON.stringify({
        query: introspectionQuery
      })
    });

    const result = await response.json();

    if (result.errors) {
      console.error('GraphQL Errors:', result.errors);
      return;
    }

    // Filter for user-defined types (tables)
    const userTypes = result.data.__schema.types.filter(type =>
      type.kind === 'OBJECT' &&
      !type.name.startsWith('__') &&
      !type.name.includes('mutation') &&
      !type.name.includes('subscription') &&
      !type.name.includes('query') &&
      type.name !== 'Query' &&
      type.name !== 'Mutation' &&
      type.name !== 'Subscription'
    );

    console.log('\n=== Production Schema Tables ===');
    if (userTypes.length === 0) {
      console.log('No user-defined tables found in production.');
      console.log('This means the database is empty or not properly connected.');
    } else {
      userTypes.forEach(type => {
        console.log(`\nTable: ${type.name}`);
        if (type.fields) {
          type.fields.forEach(field => {
            console.log(`  - ${field.name}: ${field.type.name || field.type.kind}`);
          });
        }
      });
    }

  } catch (error) {
    console.error('Error checking production schema:', error.message);
  }
}

checkProductionSchema();