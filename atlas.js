const { MongoClient } = require('mongodb');
const fs = require('fs')


async function uploadToAtlas({ data }) {


    debugger;
    const uri = process.env.MONGODB_URL
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('data.length...', data.length)
    const bulkData = data.map(d => {
      const { imageUrl } = d
      return {
        updateOne: {
          filter: { imageUrl },
          update: {
            $set: {
              ...d
            }
          },
          upsert: true,
        }
      }

    })

    const clnt = await client.connect()
    const collection = clnt.db("ecom").collection("collection2023");
    const result = await collection.bulkWrite(bulkData)
    clnt.close()
    return { result}


}

module.exports = { uploadToAtlas }
