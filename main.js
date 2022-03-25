/**
 * This template is a production ready boilerplate for developing with `PuppeteerCrawler`.
 * Use this to bootstrap your projects using the most up-to-date code.
 * If you're looking for examples or want to learn more, see README.
 */
require('dotenv').config()
const { getSheetValues, setSheetValue } = require('./google.sheet.js')
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

console.log('process.env.google_access_token', process.env.google_access_token)
console.log('refresh_token: process.env.google_refresh_token ', process.env.google_refresh_token)

Apify.main(async () => {
    const { values } = await getSheetValues({ access_token: process.env.google_access_token, spreadsheetId: '1TVFTCbMIlLXFxeXICx2VuK0XtlNLpmiJxn6fJfRclRw', range: 'FEMALE!A:E', refresh_token: process.env.google_refresh_token })
    debugger;
    await setInputs()
    const { utils: { log } } = Apify;

    const input = await Apify.getInput();
    console.log(input);
    debugger;
    const dataset = await Apify.openDataset(`file-${Date.now()}`);
    const requestQueue = await Apify.openRequestQueue();
    console.log('values', values)
    values.forEach((value, i) => {
        if (i > 0) {
            log.info('value', value);
            const startUrl = value[0]
            const gender = value[1]
            const category = value[2]
            const subcategory = value[3]
            const marka = value[4]
            console.log('startUrl.', startUrl);
            console.log('gender.', gender);
            console.log('category.', category);
            console.log('subcategory.', subcategory);
            console.log('marka.', marka);

            requestQueue.addRequest({ url: startUrl, userData: { marka, category, subcategory, gender, start: true, end: false, range: `F${i + 1}` } })
        }


    })




    const handlePageFunction = async (context) => {
        const { page, request: { userData: { start, marka, gender, category, subcategory, range, end }, url } } = context
        const pageUrl = await page.url()

        const { handler, getUrls } = require(`./handlers/${marka}`);


        if (start) {
            const nextPageUrl = url.substring(0, url.indexOf("=") + 1)
            const pageUrls = await getUrls(page, nextPageUrl)
            let order = 1
            for (let url of pageUrls) {

                if (pageUrls.length === order) {

                    requestQueue.addRequest({ url, userData: { marka, category, subcategory, gender, start: false, end: true, range } })
                } else {

                    requestQueue.addRequest({ url, userData: { marka, category, subcategory, gender, start: false, end: false, range } })
                }

                ++order;
            }

        }
        const data = await handler(page)
        if (end) {
            debugger;
            const { items } = await dataset.getData()
            debugger;
            const total = items.filter((item) => item.marka === marka && item.subcategory === subcategory)
            const response = await setSheetValue({ access_token: process.env.google_access_token, spreadsheetId: '1TVFTCbMIlLXFxeXICx2VuK0XtlNLpmiJxn6fJfRclRw', range, refresh_token: process.env.google_refresh_token, value: total.length.toString() })
            debugger;
        }

        const mappedData = data.map(d => {
            return {
                ...d, marka,
                gender,
                category, subcategory
            }
        })


        await dataset.pushData(mappedData);



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


    console.log('items...', ds.items && ds.items.length);
    //   fs.writeFileSync(`${JSONfileName}.json`, JSON.stringify(ds.items))
    //const upload = await cloudinary.v2.uploader.upload(`${JSONfileName}.json`, { public_id: JSONfileName, resource_type: "auto", invalidate: true })
    await uploadToAtlas({ data: ds.items })

    log.info('Crawl finished.');
    fs.rmSync(`${process.cwd()}/apify_storage`, { recursive: true, force: true });

});


