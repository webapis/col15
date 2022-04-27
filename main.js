/**
 * This template is a production ready boilerplate for developing with `PuppeteerCrawler`.
 * Use this to bootstrap your projects using the most up-to-date code.
 * If you're looking for examples or want to learn more, see README.
 */
console.log('main.js is loading...')
require('dotenv').config()
const { getGoogleToken } = require('./google/google.oauth')


const { getSheetValues, setSheetValue, appendSheetValues } = require('./google.sheet.js')
const fs = require('fs')
const Apify = require('apify');


const { uploadToAtlas } = require('./atlas')
const { setInputs } = require('./inputConfig')

console.log('process.env.google_access_token', process.env.google_access_token)
console.log('refresh_token: process.env.google_refresh_token ', process.env.google_refresh_token)

Apify.main(async () => {
    const startDate = new Date().toLocaleDateString()
    console.log('apify.main.js is loading...')

    const google_access_token = await getGoogleToken(process.env.GOOGLE_REFRESH_TOKEN)

    console.log('google_access_token', google_access_token)


    await setInputs()
    const { utils: { log } } = Apify;




    //const dataset = await Apify.openDataset(`file-${Date.now()}`);
    const requestQueue = await Apify.openRequestQueue();
    requestQueue.addRequest({ url: process.env.startUrl, userData: { start: true } })
    const sheetDataset = await Apify.openDataset(`categorySheet`);
    const sheetData = await getSheetValues({ access_token: google_access_token, spreadsheetId: '1TVFTCbMIlLXFxeXICx2VuK0XtlNLpmiJxn6fJfRclRw', range: 'categories!A:C' })

    console.log('sheetData', sheetData)
    debugger;
    for (let value of sheetData.values.filter((c, i) => i > 0)) {
        const subcategory = value[0]
        const category = value[1]
        const regex = value[2]
        await sheetDataset.pushData({ subcategory, category, regex })
    }


    process.env.dataLength = 0
    const handlePageFunction = async (context) => {

        const { page, request: { userData: { start } } } = context

        const pageUrl = await page.url()
        const pageUrldataset = await Apify.openDataset(`${process.env.marka}`);

        await pageUrldataset.pushData({ marka: process.env.marka, pageUrl });
        const { handler, getUrls } = require(`./handlers/${process.env.marka}`);
        const { pageUrls, productCount, pageLength } = await getUrls(page)
        process.env.productCount = productCount

        if (start) {
            let order = 1
            for (let url of pageUrls) {
                if (pageUrls.length === order) {
                    requestQueue.addRequest({ url, userData: { start: false } })
                } else {
                    requestQueue.addRequest({ url, userData: { start: false } })
                }
                ++order;
            }
        }

        const dataCollected = await handler(page, context)
        const categoryData = await sheetDataset.getData()
        const google_access_token1 = await getGoogleToken(process.env.GOOGLE_REFRESH_TOKEN)
        const currentDate = new Date().toLocaleDateString()

        const categoryItems = categoryData.items
        const map1 = dataCollected.map((p, i) => {
            const procutTitle = p.title

            const productCategory = categoryItems.find(c => procutTitle.toLowerCase().includes(c.subcategory.toLowerCase()))
            if (productCategory) {
                return { ...p, category: productCategory.category, subcategory: productCategory.regex }
            } else {
                return { ...p, category: "undefined", subcategory: "undefined" }
            }
        })
        console.log('map1.length', map1.length)
        const map2 = map1.map((c, i, arr) => {


            const filteredData = arr.filter(obj => obj.subcategory === c.subcategory)
            let index;

            index = filteredData.findIndex(obj => obj.imageUrl === c.imageUrl)
            return { ...c, itemOrder: index }
        })
        console.log('uploading to atlas...')
        console.log('map2.length', map2.length)
        debugger;
        const table = map2.reduce((group, product) => {
            const values = Object.values(product)



            group.push(values);
            return group;
        }, []);
        debugger;
        //    const { result:dataUploaded, client } = await uploadToAtlas({ data: map2 })
        //    const { result: {
        //    nModified, upserted } } = result
        // client.close()
        // console.log('upsertedData', dataUploaded)
        //  console.log('result.upserted.length', dataUploaded.result.upserted.length)
        // const totalUploaded = nModified + upserted.length

        debugger;
        console.log('uploading to atlas complete...')
        console.log('uploading to excell....')

        const groupByCategory = map2.reduce((group, product) => {
            const { subcategory } = product;
            group[subcategory] = group[subcategory] ?? [];
            group[subcategory].push(product);
            return group;
        }, {});
        debugger;
        let colResulValues = []
        for (let cat in groupByCategory) {
            const curr = groupByCategory[cat]
            const gender = curr[0].gender
            const category = curr[0].category
            const subcategory = curr[0].subcategory

            colResulValues.push([`${process.env.marka}`, `${gender}`, `${category}`, `${subcategory}`, `${curr.length}`, startDate, currentDate])

        }
        debugger;
        await appendSheetValues({ access_token: google_access_token1, spreadsheetId: '1TVFTCbMIlLXFxeXICx2VuK0XtlNLpmiJxn6fJfRclRw', range: 'DATA!A:B', values: table })
        // await appendSheetValues({ access_token: google_access_token1, spreadsheetId: '1TVFTCbMIlLXFxeXICx2VuK0XtlNLpmiJxn6fJfRclRw', range: 'DETAILS!A:B', values: colResulValues })
        // await appendSheetValues({ access_token: google_access_token1, spreadsheetId: '1TVFTCbMIlLXFxeXICx2VuK0XtlNLpmiJxn6fJfRclRw', range: 'UPSERTED!A:B', values: [[process.env.startUrl, pageUrl, process.env.marka, process.env.productCount, map1.length, totalUploaded, startDate, currentDate]] })
        console.log('uploading to excell complete....')

        console.log('items...', map2.length);
        process.env.dataLength = parseInt(process.env.dataLength) + map2.length
        console.log('process.env.dataLength', process.env.dataLength)
        //   await dataset.pushData(data);
        //  const { items } = await dataset.getData()
        // const total = items.filter((item) => item.marka === process.env.marka)
        //  const response = await setSheetValue({ access_token: google_access_token, spreadsheetId: '1TVFTCbMIlLXFxeXICx2VuK0XtlNLpmiJxn6fJfRclRw', range: process.env.rangeG, value: total.length.toString() })
        //   const pageUrlsData = await pageUrldataset.getData()
        //    const totalScannedPages = pageUrlsData.items.length
        // if (totalScannedPages === pageLength) {      
        //     console.log('total length match')
        // }
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


    // const rawProductDataset = await dataset.getData()
    //  const rawProductItems = rawProductDataset.items
    //await appendSheetValues({ access_token: google_access_token1, spreadsheetId: '1TVFTCbMIlLXFxeXICx2VuK0XtlNLpmiJxn6fJfRclRw', range: 'TOTAL!A:B', values: [[`${process.env.startUrl}`, `${process.env.marka}`, `${process.env.productCount}`, `${rawProductItems.length}`, startDate, currentDate]] })


    //uploading to excell
    //console.log('uploading to excell....')
    // const groupByCategory = await map2.reduce((group, product) => {
    //     const { subcategory } = product;
    //     group[subcategory] = group[subcategory] ?? [];
    //     group[subcategory].push(product);
    //     return group;
    // }, {});

    // let colResulValues = []
    // for (let cat in groupByCategory) {
    //     const curr = groupByCategory[cat]
    //     const gender = curr[0].gender
    //     const category = curr[0].category
    //     const subcategory = curr[0].subcategory

    //     colResulValues.push([`${process.env.marka}`, `${gender}`, `${category}`, `${subcategory}`, `${curr.length}`, startDate, currentDate])

    // }
    debugger;
    // await appendSheetValues({ access_token: google_access_token1, spreadsheetId: '1TVFTCbMIlLXFxeXICx2VuK0XtlNLpmiJxn6fJfRclRw', range: 'DETAILS!A:B', values: colResulValues })
    // await appendSheetValues({ access_token: google_access_token1, spreadsheetId: '1TVFTCbMIlLXFxeXICx2VuK0XtlNLpmiJxn6fJfRclRw', range: 'UPSERTED!A:B', values: [[process.env.startUrl, process.env.marka, process.env.productCount, map1.length, totalUploaded, startDate, currentDate]] })
    //   console.log('uploading to excell complete....')

    // console.log('items...', map2.length);
    //   fs.writeFileSync(`${JSONfileName}.json`, JSON.stringify(ds.items))
    //const upload = await cloudinary.v2.uploader.upload(`${JSONfileName}.json`, { public_id: JSONfileName, resource_type: "auto", invalidate: true })

    // const errorDataSet = await Apify.openDataset(`error-data`);
    // const { items: errorItems } = await errorDataSet.getData()
    // if (errorItems && errorItems.length > 0) {
    //     errorItems.forEach(item => {

    //     })
    // }

    // fs.rmSync(`${process.cwd()}/apify_storage`, { recursive: true, force: true });
    console.log('Crawl finished.');

});


