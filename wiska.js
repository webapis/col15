/**
 * This template is a production ready boilerplate for developing with `PuppeteerCrawler`.
 * Use this to bootstrap your projects using the most up-to-date code.
 * If you're looking for examples or want to learn more, see README.
 */
console.log('main.js is loading...')
require('dotenv').config()
const { getGoogleToken } = require('./google/google.oauth')
const { uploadImageFile } = require('./google-drive')
const cloudinary = require('cloudinary')
cloudinary.config({
    cloud_name: 'codergihub',
    api_key: '583195742238215',
    api_secret: 'bToEovaKOPP3ihH6MFz2g_cy3VI',
    secure: true
});
const request = require('request')

const { getSheetValues, setSheetValue, appendSheetValues } = require('./google.sheet.js')
const { singleFileUpload } = require('./google-drive')
const fs = require('fs')
const Apify = require('apify');
const { utils: { log } } = Apify;

const { uploadToAtlas } = require('./atlas')
const { setInputs } = require('./inputConfig')



Apify.main(async () => {
    const startDate = new Date().toLocaleDateString()
    console.log('apify.main.js is loading...')
    const startURL = 'https://www.wiska.com/suche.php?suchbegriff='
    const google_access_token = await getGoogleToken(process.env.GOOGLE_REFRESH_TOKEN)
    // const google_access_token = await getGoogleToken(process.env.GOOGLE_REFRESH_TOKEN)
    const { values } = await getSheetValues({ access_token: google_access_token, spreadsheetId: '17Wq52aW0pER2zks66sPnJUhoQ09pDowGBJ_-U0-X9HE', range: 'CODE!A:A' })
    debugger;
    const requestQueue = await Apify.openRequestQueue();
    values.forEach(value => {
        const code = value[0]
        requestQueue.addRequest({ url: startURL + code, userData: { pageType: 'start', code } })
        debugger;
    })


    debugger;





    process.env.dataLength = 0
    const handlePageFunction = async (context) => {
        debugger;
        const { request: { userData: { pageType } }, page } = context
        debugger;
        await page.waitForSelector('.col-md-8.col-lg-9.inhalt a')
        const imageLink = await page.evaluate(() => document.querySelector('.col-md-8.col-lg-9.inhalt a').href)
        debugger;
        await page.goto(imageLink)
        debugger;




    }
    function download(uri, filename) {
        return new Promise((resolve, reject) => {
            request.head(uri, function (err, res, body) {
                request(uri).pipe(fs.createWriteStream(filename)).on('close', resolve);
            });
        });
    }
    const crawler = new Apify.PuppeteerCrawler({
        //requestList,
        requestQueue,
        maxConcurrency: 5,
        navigationTimeoutSecs: 120,
        launchContext: {
            // Chrome with stealth should work for most websites.
            // If it doesn't, feel free to remove this.
            // useChrome: true,
            launchOptions: {
                headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox', "--disable-web-security",
                    `--window-size=1200,1250`,
                    "--allow-insecure-localhost",
                    //  "--user-data-dir=/tmp/foo",
                    "--ignore-certificate-errors",
                    "--unsafely-treat-insecure-origin-as-secure=https://localhost:8888",
                    '--disable-gpu-rasterization',
                    '--disable-low-res-tiling',
                    '--disable-skia-runtime-opts',
                    '--disable-yuv420-biplanar'
                ]
            }

        },
        handlePageFunction,
        preNavigationHooks: [
            async (crawlingContext, gotoOptions) => {
                const { page, request: { userData: { code } } } = crawlingContext;

                await page.setRequestInterception(true);
                page.on('request', async req => {
                    const resourceType = req.resourceType();
                    const url = req._url

                    if (resourceType === 'image') {
                        if (url.includes("default")) {

                            const google_access_token1 = await getGoogleToken(process.env.GOOGLE_REFRESH_TOKEN)
                            debugger;
                            let imageUrl = `wiski/wiskiimage.jpg`
                            const res = await download(url, imageUrl)
                            debugger
                            await singleFileUpload({ filePath: imageUrl, access_token: google_access_token1, fileName: code, folderId: '1UOLlom1V7xdJ3MVVxvtf_Jh__j84PPHD' })
                            // const respose =  cloudinary.v2.uploader.upload(url, {
                            debugger;
                            //    // public_id: "wiski/dog_closeup",


                            // },(err,url)=>{
                            //     debugger;
                            // })

                            // debugger;
                        }

                        //  req.respond({

                        //      status: 200,
                        //      contentType: 'image/jpeg',
                        //      body: ''
                        //  });

                        req.continue();
                    } else {
                        req.continue();
                    }
                });
            },
        ],
        handleFailedRequestFunction: async ({ request: { errorMessages, url, userData: { gender, start } } }) => {
            //     const google_access_token1 = await getGoogleToken(process.env.GOOGLE_REFRESH_TOKEN)
            //     if (gender === 'MALE') {
            //         debugger;
            //       const response= await appendSheetValues({ access_token: google_access_token1, spreadsheetId: '1IeaYAURMnrbZAsQA_NO_LA_y_qq8MmwxjSo854vz5YM', range: 'ERROR!A:B', values: [[url,errorMessages[0].substring(0,150),gender,start]] })
            //    debugger;
            //     }
            //     if (gender === 'FEMALE') {
            //         debugger;
            //         const response= await appendSheetValues({ access_token: google_access_token1, spreadsheetId: '12mKtqxu5A-CVoXP_Kw36JxKiC69oPUUXVQmm7LUfh3s', range: 'ERROR!A:B', values:  [[url,errorMessages[0].substring(0,150),gender,start]] })
            //         debugger;
            //     }
            //     // This function is called when the crawling of a request failed too many times
            //     debugger;

        },
    });


    log.info('Starting the crawl.');
    await crawler.run();


    console.log('Crawl finished.');

});