const { nodeFetch } = require('./node-fetch')
async function getSheetValues({ access_token, spreadsheetId, range }) {

  const sheetresponse = await nodeFetch({ host: 'sheets.googleapis.com', path: `/v4/spreadsheets/${spreadsheetId}/values/${range}`, method: 'get', headers: { 'User-Agent': 'node.js', 'Content-Type': 'application/json', 'Authorization': `Bearer ${access_token}` } })

  let data = JSON.parse(sheetresponse)


  return data

}

async function setSheetValue({ access_token, spreadsheetId, range, refresh_token, value }) {

  const sheetresponse = await nodeFetch({
    host: 'sheets.googleapis.com', path: `/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`, method: 'put', body: JSON.stringify({
      "values": [
        [
          value
        ]
      ]
    }), headers: { 'User-Agent': 'node.js', 'Content-Type': 'application/json', 'Authorization': `Bearer ${access_token}` }
  })



  let data = JSON.parse(sheetresponse)
  return data
}
async function appendSheetValues({ access_token, spreadsheetId, range, values }) {

  const sheetresponse = await nodeFetch({
    host: 'sheets.googleapis.com', path: `/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED`, method: 'post', body: JSON.stringify({
      "values":values
    }), headers: { 'User-Agent': 'node.js', 'Content-Type': 'application/json', 'Authorization': `Bearer ${access_token}` }
  })



  let data = JSON.parse(sheetresponse)
  
  return data
}



module.exports = { getSheetValues, setSheetValue,appendSheetValues }


