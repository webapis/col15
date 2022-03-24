const { nodeFetch } = require('./node-fetch')
async function getSheetValues({ access_token, spreadsheetId, range,refresh_token }) {

    const response = await nodeFetch({ host: 'sheets.googleapis.com', path: `/v4/spreadsheets/${spreadsheetId}/values/${range}`, method: 'get', headers: { 'User-Agent': 'node.js', 'Content-Type': 'application/json', 'Authorization': `Bearer ${access_token}` } })

    debugger;

    let data = JSON.parse(response)
    const error = data['error']
    if (error) {
        debugger;
        //refresh token
       const response = await nodeFetch({ host: 'workflow-runner.netlify.app', path: `/.netlify/functions/google-refresh?refresh_token=${refresh_token}`, method: 'get', headers: { 'User-Agent': 'node.js', 'Content-Type': 'application/json' } }) 
       data = JSON.parse(response)
   }
    debugger;
    return data
}
module.exports = { getSheetValues }