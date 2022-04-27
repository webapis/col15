require('dotenv').config()

const { refreshToken } = require('./google-refresh')
async function getGoogleToken() {

  if (process.env.access_token) {
    const issuetime = parseInt(process.env.expires_in) * 1000 + parseInt(process.env.lasttimestamp)
    const currenttimestamp = Date.now()
    if (issuetime < currenttimestamp) {
      console.log('old access token.......')
      return process.env.access_token
    } else {
      const authresponse = await refreshToken(process.env.GOOGLE_REFRESH_TOKEN)
      let authData = JSON.parse(authresponse)
      const {
        access_token,
        expires_in } = authData
      process.env.expires_in = expires_in
      process.env.access_token = access_token
      process.env.lasttimestamp = Date.now()
      console.log('refreshed access token.......')
      return access_token

    }


  } else {

    const authresponse = await refreshToken(process.env.GOOGLE_REFRESH_TOKEN)
    let authData = JSON.parse(authresponse)
    const {
      access_token,
      expires_in } = authData
    process.env.expires_in = expires_in
    process.env.access_token = access_token
    process.env.lasttimestamp = Date.now()
    console.log('first time refreshed access token.......')
    return access_token
  }






}

module.exports = { getGoogleToken }