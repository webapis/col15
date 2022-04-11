/**
 * This template is a production ready boilerplate for developing with `PuppeteerCrawler`.
 * Use this to bootstrap your projects using the most up-to-date code.
 * If you're looking for examples or want to learn more, see README.
 */
console.log('main.js is loading...')
require('dotenv').config()
const { getGoogleToken } = require('wflows')


const { getSheetValues, setSheetValue } = require('./google.sheet.js')
const fs = require('fs')
const Apify = require('apify');


//var cloudinary = require('cloudinary');
const { uploadToAtlas } = require('./atlas')
const { setInputs } = require('./inputConfig')

// cloudinary.config({
//     cloud_name: 'codergihub',
//     api_key: '583195742238215',
//     api_secret: process.env.cloudinary_api_secret
// });


console.log('process.env.google_access_token', process.env.google_access_token)
console.log('refresh_token: process.env.google_refresh_token ', process.env.google_refresh_token)

Apify.main(async () => {
    console.log('apify.main.js is loading...')

    const google_access_token = await getGoogleToken()
    console.log('google_access_token 1', google_access_token)

    const { values } = await getSheetValues({ access_token: google_access_token, spreadsheetId: '1TVFTCbMIlLXFxeXICx2VuK0XtlNLpmiJxn6fJfRclRw', range: 'FEMALE!A:E' })

    await setInputs()
    const { utils: { log } } = Apify;

    const input = await Apify.getInput();
    console.log(input);

    const dataset = await Apify.openDataset(`file-${Date.now()}`);
    const requestQueue = await Apify.openRequestQueue();
    console.log('values', values)
    values.forEach((value, i) => {
        if (i > 0) {
            log.info('value', value);
            const startUrl = value[0]
            const marka = value[1]
            requestQueue.addRequest({ url: startUrl, userData: { marka, start: true, end: false, rangeG: `G${i + 1}`, rangeF: `F${i + 1}`, startUrl } })
        }
    })

    const sheetDataset = await Apify.openDataset(`categorySheet`);
    const sheetData = await getSheetValues({ access_token: google_access_token, spreadsheetId: '1TVFTCbMIlLXFxeXICx2VuK0XtlNLpmiJxn6fJfRclRw', range: 'categories!A:C' })



    for (let value of sheetData.values.filter((c, i) => i > 0)) {
        const subcategory = value[0]
        const category = value[1]
        const regex = value[2]
        await sheetDataset.pushData({ subcategory, category, regex })

    }


    const handlePageFunction = async (context) => {



        const { page, request: { userData: { start, marka, rangeG, rangeF, end, startUrl }, url } } = context
        const pageUrl = await page.url()
        const pageUrldataset = await Apify.openDataset(`${marka}`);

        await pageUrldataset.pushData({ marka, pageUrl });
        const { handler, getUrls } = require(`./handlers/${marka}`);
        const { pageUrls, productCount, pageLength } = await getUrls(page)

        if (start) {
            const google_access_token = await getGoogleToken()
            console.log('google_access_token 2', google_access_token)


            const response = await setSheetValue({ access_token: google_access_token, spreadsheetId: '1TVFTCbMIlLXFxeXICx2VuK0XtlNLpmiJxn6fJfRclRw', range: rangeF, value: productCount.toString() })

            let order = 1
            for (let url of pageUrls) {

                if (pageUrls.length === order) {

                    requestQueue.addRequest({ url, userData: { marka, start: false, end: true, rangeG, rangeF, startUrl } })
                } else {

                    requestQueue.addRequest({ url, userData: { marka, start: false, end: false, rangeG, rangeF, startUrl } })
                }

                ++order;
            }

        }


        const data = await handler(page)





        await dataset.pushData(data);
        const { items } = await dataset.getData()

        const total = items.filter((item) => item.marka === marka)

        const response = await setSheetValue({ access_token: google_access_token, spreadsheetId: '1TVFTCbMIlLXFxeXICx2VuK0XtlNLpmiJxn6fJfRclRw', range: rangeG, value: total.length.toString() })

        const pageUrlsData = await pageUrldataset.getData()

        const totalScannedPages = pageUrlsData.items.length

        if (totalScannedPages === pageLength) {
            const google_access_token = await getGoogleToken()
            console.log('google_access_token 2', google_access_token)
            console.log('total length match')


        }
    }
    const crawler = new Apify.PuppeteerCrawler({
        //requestList,
        requestQueue,
        maxConcurrency: 10,
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
        ],
        handleFailedRequestFunction: async ({ request }) => {
            // This function is called when the crawling of a request failed too many times
            const errorDataSet = await Apify.openDataset(`error-data`);
            await errorDataSet.pushData({
                url: request.url,
                succeeded: false,
                errors: request.errorMessages,
            });
        },
    });

    log.info('Starting the crawl.');
    await crawler.run();
    const ds = await dataset.getData()
    const productItems = ds.items
    const categoryData = await sheetDataset.getData()

    const categoryItems = categoryData.items
    const categorizedProductItems = productItems.map((p, i) => {
        const procutTitle = p.title


        const productCategory = categoryItems.find(c => procutTitle.toLowerCase().includes(c.subcategory))
        if (productCategory) {
            return { ...p, category: productCategory.category, subcategory: productCategory.subcategory }

        } else {
            return { ...p, category: "undefined", subcategory: "undefined" }
        }

    })
    const sortedData = categorizedProductItems.sort((a, b) => (a.subcategory > b.subcategory) ? 1 : -1)
    const orderedProducts = sortedData.map((c, i, arr) => {
        const md = arr.map(el => el.subcategory)
        const filteredData = arr.filter(obj => obj.subcategory === c.subcategory)
        let index;
        if (filteredData.length > 1) {
            index = filteredData.findIndex(obj => obj.imageUrl === c.imageUrl)
        } else {
            index = arr.findIndex(obj => obj.imageUrl === c.imageUrl)
        }


        return { ...c, itemOrder: index }

    })
    debugger;
    console.log('items...', ds.items && ds.items.length);
    //   fs.writeFileSync(`${JSONfileName}.json`, JSON.stringify(ds.items))
    //const upload = await cloudinary.v2.uploader.upload(`${JSONfileName}.json`, { public_id: JSONfileName, resource_type: "auto", invalidate: true })
    await uploadToAtlas({ data: orderedProducts })
    const errorDataSet = await Apify.openDataset(`error-data`);
    const { items: errorItems } = await errorDataSet.getData()
    if (errorItems && errorItems.length > 0) {
        errorItems.forEach(item => {

        })
    }

    log.info('Crawl finished.');
    fs.rmSync(`${process.cwd()}/apify_storage`, { recursive: true, force: true });

});


