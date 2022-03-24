/**
 * This template is a production ready boilerplate for developing with `PuppeteerCrawler`.
 * Use this to bootstrap your projects using the most up-to-date code.
 * If you're looking for examples or want to learn more, see README.
 */
require('dotenv').config()
const { getSheetValues } = require('./google.sheet.js')
const fs = require('fs')
const Apify = require('apify');
var cloudinary = require('cloudinary');
const { uploadToAtlas } = require('./atlas')
const { setInputs } = require('./inputConfig')
cloudinary.config({
    cloud_name: 'codergihub',
    api_key: '583195742238215',
    api_secret: process.env.cloudinary_api_secret
});


Apify.main(async () => {
    const { values } = await getSheetValues({ access_token: process.env.google_access_token, spreadsheetId: '1dLiWW6P__hkmG68tnnqHZyxICwUL2CgDk1sxnmVkCKI', range: 'FEMALE!A:E', refresh_token: process.env.google_refresh_token })
    debugger;
    await setInputs()
    const { utils: { log } } = Apify;

    const input = await Apify.getInput();
    console.log(input);
    debugger;

    const requestQueue = await Apify.openRequestQueue();
    values.forEach((value, i) => {
        if (i > 0) {
            const startUrl = value[0]
            const gender = value[1]
            const category = value[2]
            const subcategory = value[3]
            const marka = value[4]

            requestQueue.addRequest({ url: startUrl, userData: { marka, category, subcategory, gender, start: true } })
        }
        debugger;

    })


    const dataset = await Apify.openDataset(`file-${Date.now()}`);

    const handlePageFunction = async (context) => {
        const { page, request: { userData: { start, marka, gender, category, subcategory },url } } = context
        const pageUrl = await page.url()

        const { handler, getUrls } = require(`./handlers/${marka}`);

        debugger;
        if (start) {
            const nextPageUrl = url.substring(0, url.indexOf("=") + 1)
            const pageUrls = await getUrls(page, nextPageUrl)

            for (let url of pageUrls) {
                requestQueue.addRequest({ url, userData: { marka, category, subcategory, gender, start: false } })
            }

        }
        const data = await handler(page)
        const mappedData = data.map(d => {
            return {
                ...d, marka,
                gender,
                category, subcategory
            }
        })
        await dataset.pushData(mappedData);


        //  return   
    }
    const crawler = new Apify.PuppeteerCrawler({
        //requestList,
        requestQueue,
        maxConcurrency: 15,
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
                const { page } = crawlingContext;
                await page.setRequestInterception(true);
                page.on('request', req => {
                    const resourceType = req.resourceType();
                    if (resourceType === 'image') {
                        req.respond({
                            status: 200,
                            contentType: 'image/jpeg',
                            body: ''
                        });


                    } else {
                        req.continue();
                    }
                });
            },
        ]
    });

    log.info('Starting the crawl.');
    await crawler.run();
    const ds = await dataset.getData()


    log.info('items...', ds.items && ds.items.length);
    //   fs.writeFileSync(`${JSONfileName}.json`, JSON.stringify(ds.items))
    //const upload = await cloudinary.v2.uploader.upload(`${JSONfileName}.json`, { public_id: JSONfileName, resource_type: "auto", invalidate: true })
    await uploadToAtlas({ data: ds.items })

    log.info('Crawl finished.');
    fs.rmSync(`${process.cwd()}/apify_storage`, { recursive: true, force: true });

});


