require('dotenv').config()

const { refreshToken } = require('./google-refresh')
async function getGoogleToken() {
  

    const authresponse = await refreshToken(process.env.GOOGLE_REFRESH_TOKEN)


    let authData = JSON.parse(authresponse)
    const {
      access_token } = authData


    return access_token
    //update firebase

  
}

module.exports = { getGoogleToken }