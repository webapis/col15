

// (async ()=>{
//     require('dotenv').config()
//     const fs =require('fs')
//     const {multipartUpload}=require('./google-drive')
//     const { getGoogleToken } = require('./google/google.oauth')
//     const access_token= await getGoogleToken()
//     var fileMetadata = {
//         'title': 'photo.jpg',
//          mimeType: 'image/jpeg',
       
          
//       };
//    const response = await multipartUpload({filePath:'./wiski/wiskiimage.jpg',access_token,metadata:fileMetadata})

//    debugger;
// })()

(async ()=>{

//https://gist.github.com/tanaikech/33563b6754e5054f3a5832667100fe91
require('dotenv').config()
const fs =require('fs')
const { getGoogleToken } = require('./google/google.oauth')
const {singleFileUpload}=require('./google-drive')


const filePath = "./wiski/wiskiimage.jpg";
const access_token= await getGoogleToken()
const accessToken =access_token

    await singleFileUpload({filePath,access_token,fileName:'sample.jpg',folderId:'1UOLlom1V7xdJ3MVVxvtf_Jh__j84PPHD'})

})()