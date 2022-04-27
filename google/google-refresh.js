require('dotenv').config()
const { nodeFetch } = require('../nodejs/node-fetch')
const CLIENT_ID = process.env.CLIENT_ID
console.log('CLIENT_ID', CLIENT_ID)
const CLIENT_SECRET = process.env.CLIENT_SECRET
console.log('CLIENT_SECRET', CLIENT_SECRET)


async function refreshToken(refresh_token) {

    const response = await nodeFetch({ host: 'oauth2.googleapis.com', path: `/token?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&grant_type=refresh_token&refresh_token=${refresh_token}`, method: 'post', headers: { 'User-Agent': 'node.js', 'Content-Type': 'application/json' } })
    debugger;
    return response
}

module.exports = { refreshToken }

