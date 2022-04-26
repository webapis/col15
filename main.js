/**
 * This template is a production ready boilerplate for developing with `PuppeteerCrawler`.
 * Use this to bootstrap your projects using the most up-to-date code.
 * If you're looking for examples or want to learn more, see README.
 */



(async () => {

    console.log('main.js is loading...')

    require('dotenv').config()
    const { getSheetValues, setSheetValue, appendSheetValues } = require('./google.sheet.js')
    const { getGoogleToken } = require('wflows')
    const puppeteer = require('puppeteer')
    var promiseLimit = require('promise-limit')

    const limit = promiseLimit(10);
    process.env.dataLength = 0

    console.log('process.env.google_access_token', process.env.google_access_token)
    console.log('refresh_token: process.env.google_refresh_token ', process.env.google_refresh_token)
    const google_access_token = await getGoogleToken()
    const startDate = new Date().toLocaleDateString()

    console.log('apify.main.js is loading...')
    const sheetData = await getSheetValues({ access_token: google_access_token, spreadsheetId: '1TVFTCbMIlLXFxeXICx2VuK0XtlNLpmiJxn6fJfRclRw', range: 'categories!A:C' })
    console.log('sheetData', sheetData)
    const categorizedDataSheet = []

    for (let value of sheetData.values.filter((c, i) => i > 0)) {
        const subcategory = value[0]
        const category = value[1]
        const regex = value[2]
        categorizedDataSheet.push({ subcategory, category, regex })
    }
    const browser = await puppeteer.launch({
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
    })

    const { handler, getUrls } = require(`./handlers/${process.env.marka}`)
    const firstPage = await browser.newPage()
    await firstPage.setRequestInterception(true);
    firstPage.on('request', req => {
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

    await firstPage.goto(process.env.startUrl)
    const { pageUrls, productCount, pageLength } = await getUrls(firstPage)
    process.env.productCount = productCount



    await Promise.all([limit(() => handlePage({ browser, handler, url: process.env.startUrl, categoryItems: categorizedDataSheet, context: { userData: { start: true } } })), pageUrls.map((url) => limit(() => handlePage({ browser, url, handler, categoryItems: categorizedDataSheet, context: { userData: { start: false } } })))])

    async function handlePage({ browser, url, context, handler, categoryItems }) {
        try {


            const newPage = await browser.newPage()

            await newPage.setRequestInterception(true);
            newPage.on('request', req => {
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

            await newPage.goto(url)
            debugger;
            const dataCollected = await handler(newPage, context)


            const google_access_token1 = await getGoogleToken()
            const currentDate = new Date().toLocaleDateString()


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

            console.log('map2.length', map2.length)

            const table = map2.reduce((group, product) => {
                const values = Object.values(product)



                group.push(values);
                return group;
            }, []);



            console.log('uploading to excell....')

            const groupByCategory = map2.reduce((group, product) => {
                const { subcategory } = product;
                group[subcategory] = group[subcategory] ?? [];
                group[subcategory].push(product);
                return group;
            }, {});

            let colResulValues = []
            for (let cat in groupByCategory) {
                const curr = groupByCategory[cat]
                const gender = curr[0].gender
                const category = curr[0].category
                const subcategory = curr[0].subcategory

                colResulValues.push([`${process.env.marka}`, `${gender}`, `${category}`, `${subcategory}`, `${curr.length}`, startDate, currentDate])

            }

            await appendSheetValues({ access_token: google_access_token1, spreadsheetId: '1TVFTCbMIlLXFxeXICx2VuK0XtlNLpmiJxn6fJfRclRw', range: 'DATA!A:B', values: table })
            // await appendSheetValues({ access_token: google_access_token1, spreadsheetId: '1TVFTCbMIlLXFxeXICx2VuK0XtlNLpmiJxn6fJfRclRw', range: 'DETAILS!A:B', values: colResulValues })
            // await appendSheetValues({ access_token: google_access_token1, spreadsheetId: '1TVFTCbMIlLXFxeXICx2VuK0XtlNLpmiJxn6fJfRclRw', range: 'UPSERTED!A:B', values: [[process.env.startUrl, pageUrl, process.env.marka, process.env.productCount, map1.length, totalUploaded, startDate, currentDate]] })
            console.log('uploading to excell complete....')

            console.log('items...', map2.length);
            process.env.dataLength = parseInt(process.env.dataLength) + map2.length
            console.log('process.env.dataLength', process.env.dataLength)

            return Promise.resolve(true)
        } catch (error) {
            const { name, message } = error
            const values = [url,name,message]
            const google_access_token2 = await getGoogleToken()
       
            await appendSheetValues({ access_token: google_access_token2, spreadsheetId: '1TVFTCbMIlLXFxeXICx2VuK0XtlNLpmiJxn6fJfRclRw', range: 'ERROR!A:B', values: [values] })
            debugger;
            return Promise.reject(error)
        }
    }//

})()


