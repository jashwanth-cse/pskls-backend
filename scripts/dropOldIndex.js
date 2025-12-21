// Script to drop the old 'id' index from products collection
require('dotenv').config();
const mongoose = require('mongoose');

const dropOldIndex = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce');
        console.log('✅ Connected to MongoDB');

        // Get the products collection
        const db = mongoose.connection.db;
        const collection = db.collection('products');

        // List all indexes
        console.log('\n📋 Current indexes:');
        const indexes = await collection.indexes();
        indexes.forEach(idx => {
            console.log(`  - ${idx.name}:`, idx.key);
        });

        // Drop the id_1 index if it exists
        console.log('\n🗑️  Dropping id_1 index...');
        try {
            await collection.dropIndex('id_1');
            console.log('✅ Successfully dropped id_1 index');
        } catch (err) {
            if (err.code === 27) {
                console.log('⚠️  Index id_1 does not exist (already dropped)');
            } else {
                throw err;
            }
        }

        // List indexes after dropping
        console.log('\n📋 Indexes after cleanup:');
        const updatedIndexes = await collection.indexes();
        updatedIndexes.forEach(idx => {
            console.log(`  - ${idx.name}:`, idx.key);
        });

        console.log('\n✅ Done! You can now add products without errors.');

        // Close connection
        await mongoose.connection.close();
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
};

dropOldIndex();
