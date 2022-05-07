// const { fbDatabase } = require('../utils/firebase/firebaseInit')
// const { walkSync } = require('./walkSync');

const fs = require('fs')
const path = require('path')
const fetch = require('node-fetch')

const request = require("request");
async function uploadExcelFile({ access_token, filePath, parentFolder }) {
    const fileName = path.basename(filePath)
    const metadata = { name: fileName, mymeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', parents: [parentFolder] }
    //HEALP FROM: https://stackoverflow.com/questions/44021538/how-to-send-a-file-in-request-node-fetch-or-node
    const response = await multipartUpload({ access_token, filePath, parentFolder, metadata })
    const status = response.status

    if (status === 200) {

        //create permission
        const data = await response.json()
        const { id } = data;
        await createPermission({ fileId: id, access_token })
        const publicLinkReponse = await getPublicLink({ fileId: id, access_token })
        const {
            webViewLink, webContentLink } = await publicLinkReponse.json()


        //get public link

    }
    else {
        console.log('Error:Unhandled status code')

        throw 'Unhandled status code'
    }


}
async function uploadImageFile({ access_token, files, parentFolder }) {
    try {


        let promises = []
        files.forEach(filePath => {
            let fileName = path.basename(filePath)
            let metadata = { name: fileName, mymeType: 'image/jpeg', parents: [parentFolder] }
            debugger;
            promises.push((async () => await multipartUpload({ access_token, filePath, parentFolder, metadata }))())
        })

        const response = await Promise.all(promises)
        debugger;
        console.log('upload response', response)
        // //HEALP FROM: https://stackoverflow.com/questions/44021538/how-to-send-a-file-in-request-node-fetch-or-node



        // //create permission
        await createPermission({ fileId: parentFolder, access_token })
        const publicLinkReponse = await getPublicLink({ fileId: parentFolder, access_token })
        // get public link
        const {
            webViewLink } = await publicLinkReponse.json()




        return



    } catch (error) {
        console.log('error', error)



    }

}
async function multipartUpload({ access_token, filePath, metadata }) {
    try {
        debugger;
        const fileData = fs.readFileSync(filePath)
        debugger;
        const apiendpoint = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart'
        debugger;
        return await fetch(apiendpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'multipart/related; boundary=boudaryWord', 'Authorization': `Bearer ${access_token}` },
            body: buildMultipartRelatedBody({ fileData, metadata })
        })
    } catch (error) {
        debugger;
    }

}
async function createPermission({ fileId, access_token }) {
    const apiendpoint = `https://www.googleapis.com/drive/v3/files/${fileId}`

    return fetch(apiendpoint, {
        method: 'post',
        headers: { 'Content-Type': 'application/json;', 'Authorization': `Bearer ${access_token}` },
        body: JSON.stringify({
            "role": "reader",
            "type": "anyone"
        })
    })
}

async function getPublicLink({ fileId, access_token }) {
    const apiendpoint = `https://www.googleapis.com/drive/v3/files/${fileId}?fields=webViewLink%2CwebContentLink`
    return fetch(apiendpoint, {
        method: 'get',
        headers: { 'Content-Type': 'application/json;', 'Authorization': `Bearer ${access_token}` }
    })
}

function buildMultipartRelatedBody({ metadata, fileData }) {

    const { mymeType } = metadata
    const boundary = 'boudaryWord'
    const delimiter = "\r\n--" + boundary + "\r\n"
    const close_delim = "\r\n--" + boundary + "--"
    // const body = delimiter +
    //     'Content-Type:application/json; charset=UTF-8\r\n\r\n' +
    //     JSON.stringify(metadata) +
    //     delimiter +
    //     'Content-Type:' + mymeType + '\r\n\r\n' +
    //     fileData + '\r\n' +
    //     close_delim
    return Buffer.concat([Buffer.from(delimiter +
        'Content-Type:application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type:' + mymeType + '\r\n\r\n', 'utf-8'), Buffer.from(fileData, 'utf-8'), Buffer.from(JSON.stringify(metadata) +
            delimiter, 'utf-8')])

}


async function createFolder({ folderName, access_token }) {

    const apiendpoint = `https://www.googleapis.com/drive/v3/files`

    return fetch(apiendpoint, {
        method: 'post',
        headers: { 'Content-Type': 'application/json;', 'Authorization': `Bearer ${access_token}` },
        body: JSON.stringify({
            mimeType: "application/vnd.google-apps.folder",
            name: folderName
        })
    })

}


async function folderExist({ folderName, access_token, refresh_token }) {
    const apiendpoint = `https://www.googleapis.com/drive/v3/files?q=name%20%3D'${folderName}'%20and%20mimeType%20%3D%20'application%2Fvnd.google-apps.folder'`

    const response = await fetch(apiendpoint, {
        method: 'get',
        headers: { 'Content-Type': 'application/json;', 'Authorization': `Bearer ${access_token}` }
    })

    const status = response.status
    if (status === 200) {

        return { access_token }

    } else if (status === 401) {
        console.log('error')
        throw 'unhandled error'
    }
}

async function deleteFolder({ fileId, access_token }) {

    const apiendpoint = `https://www.googleapis.com/drive/v3/files/${fileId}`

    return await fetch(apiendpoint, {
        method: 'delete',
        headers: { 'Content-Type': 'application/json;', 'Authorization': `Bearer ${access_token}` }
    })


}

async function singleFileUpload({ filePath, access_token, fileName, folderId }) {
    const content = fs.readFileSync(filePath)

    const metadata = {
        name: fileName,
        "parents": [
            folderId
            // "1UOLlom1V7xdJ3MVVxvtf_Jh__j84PPHD"
        ]
    };


    const boundary = "xxxxxxxxxx";
    let data = "--" + boundary + "\r\n";
    data += 'Content-Disposition: form-data; name="metadata"\r\n';
    data += "Content-Type: application/json; charset=UTF-8\r\n\r\n";
    data += JSON.stringify(metadata) + "\r\n";
    data += "--" + boundary + "\r\n";
    data += 'Content-Disposition: form-data; name="file"\r\n\r\n';
    const payload = Buffer.concat([
        Buffer.from(data, "utf8"),
        Buffer.from(content, "binary"),
        Buffer.from("\r\n--" + boundary + "--\r\n", "utf8"),
    ]);
   await request(
        {
            method: "POST",
            url:
                "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
            headers: {
                Authorization: "Bearer " + access_token,
                "Content-Type": "multipart/form-data; boundary=" + boundary,
            },
            body: payload,
        }
        // (err, res, body) => {
        //     if (err) {
        //         console.log(body);
        //         return;
        //     }
        //     console.log(body);
        // }
    );
        console.log('upload complete')
}


module.exports = { folderExist, createFolder, uploadExcelFile, uploadImageFile, deleteFolder, singleFileUpload, multipartUpload }





