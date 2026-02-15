// scripts/check-chroma.js
const { ChromaClient } = require('chromadb');

async function checkChroma() {
  const client = new ChromaClient({
    path: 'http://localhost:8000',
  });

  try {
    // List all collections
    const collections = await client.listCollections();
    console.log('\n📊 Collections in ChromaDB:');
    console.log('='.repeat(50));

    if (collections.length === 0) {
      console.log('❌ No collections found!');
      return;
    }

    for (const collection of collections) {
      const count = await collection.count();
      console.log(`\n✅ Collection: ${collection.name}`);
      console.log(`   Documents: ${count}`);

      if (count > 0) {
        // Get a sample document
        const results = await collection.peek({ limit: 1 });
        console.log(`   Sample metadata:`, results.metadatas?.[0]);
      }
    }
    console.log('\n' + '='.repeat(50));
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkChroma();
