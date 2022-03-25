const { nodeFetch } = require('./node-fetch')
async function getSheetValues({ access_token, spreadsheetId, range, refresh_token }) {

  const sheetresponse = await nodeFetch({ host: 'sheets.googleapis.com', path: `/v4/spreadsheets/${spreadsheetId}/values/${range}`, method: 'get', headers: { 'User-Agent': 'node.js', 'Content-Type': 'application/json', 'Authorization': `Bearer ${access_token}` } })



  let data = JSON.parse(sheetresponse)
  const error = data['error']
  if (error) {
    debugger;
    //refresh token
    const authresponse = await nodeFetch({ host: 'workflow-runner.netlify.app', path: `/.netlify/functions/google-refresh?refresh_token=${refresh_token}`, method: 'get', headers: { 'User-Agent': 'node.js', 'Content-Type': 'application/json' } })
    let authData = JSON.parse(authresponse)

    const sheetresponse = await nodeFetch({ host: 'sheets.googleapis.com', path: `/v4/spreadsheets/${spreadsheetId}/values/${range}`, method: 'get', headers: { 'User-Agent': 'node.js', 'Content-Type': 'application/json', 'Authorization': `Bearer ${authData.access_token}` } })
    return JSON.parse(sheetresponse)

  } else {
    debugger;
    console.log('sheet data', data)
    return data

  }

}

async function setSheetValue({ access_token, spreadsheetId, range, refresh_token,value }){

  const sheetresponse = await nodeFetch({ host: 'sheets.googleapis.com', path: `/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`, method: 'put', body:JSON.stringify({
    "values": [
      [
        value
      ]
    ]
  }),headers: { 'User-Agent': 'node.js', 'Content-Type': 'application/json', 'Authorization': `Bearer ${access_token}` } })



  let data = JSON.parse(sheetresponse)
  const error = data['error']
  if (error) {
    debugger;
    //refresh token
    const authresponse = await nodeFetch({ host: 'workflow-runner.netlify.app', path: `/.netlify/functions/google-refresh?refresh_token=${refresh_token}`, method: 'get', headers: { 'User-Agent': 'node.js', 'Content-Type': 'application/json' } })
    let authData = JSON.parse(authresponse)

    const sheetresponse = await nodeFetch({ host: 'sheets.googleapis.com', path: `/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`, method: 'put', body:JSON.stringify({
      "values": [
        [
          value
        ]
      ]
    }),headers: { 'User-Agent': 'node.js', 'Content-Type': 'application/json', 'Authorization': `Bearer ${authData.access_token}` } })
    return JSON.parse(sheetresponse)

  } else {
    debugger;
    console.log('sheet data', data)
    return data

  }
}
module.exports = { getSheetValues,setSheetValue }