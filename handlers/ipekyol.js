const Apify = require('apify');
async function handler(page, context) {
    
    const { request: { userData: { start } } } = context
    const url = await page.url()

    debugger;//
    await page.waitForSelector('.prd-list .prd')
    debugger;
    const data = await page.evaluate(() => {
        function extractPercentage(val1, val2) {


            const value1ll = parseInt(val1.substring(0, leftLastIndex(val1)).replace('.', ''))

            const value2ll = parseInt(val2.substring(0, leftLastIndex(val2)).replace('.', ''))


            const percentage = Math.floor((((value1ll) - (value2ll)) * 100) / (value1ll))
            return percentage
        }
        function leftLastIndex(value) {
            return value.lastIndexOf(',') !== -1 ? value.lastIndexOf(',') : value.length
        }
        const items = Array.from(document.querySelectorAll('.prd-list .prd'))
        return items.map(item => {
            const priceOld = item.querySelector('.prd-list .prd-price .urunListe_brutFiyat') && item.querySelector('.prd-list .prd-price .urunListe_brutFiyat').textContent.replace('\n', '').replace('₺', '').trim()
            const priceNew = item.querySelector('.prd-list .prd-price .urunListe_satisFiyat') && item.querySelector('.prd-list .prd-price .urunListe_satisFiyat').textContent.replace('\n', '').replace('₺', '').trim()

            debugger;
            const discPerc = priceOld ? extractPercentage(priceOld, priceNew) : null

            return {
                title: item.querySelector('.prd-name').innerText,
                priceOld,
                priceNew,
                priceBasket: null,
                basketDiscount: null,
                imageUrl: item.querySelector('[data-image-src]') && item.querySelector('[data-image-src]').getAttribute('data-image-src'),
                link: item.querySelector('.prd-lnk').href,
                timestamp: Date.now(),
                timestamp2: new Date().toISOString(),
                plcHolder: 'https://img1-ipekyol.mncdn.com/images/lazyload/placeHolder.gif',
                discPerc,
                gender: 'kadın',
                marka: 'ipekyol',

             

            }
        }).filter(f => f.imageUrl !== null)
    })

    console.log('data length_____', data.length)
    const nextPageExists = await page.$('.btnDefault.load-next')
    debugger;
    if (nextPageExists && start) {
       
     
        const nextPage = `${url}?page=2`
        const requestQueue = await Apify.openRequestQueue();
        debugger;
        requestQueue.addRequest({ url: nextPage, userData: {  start: false } })
    } else if (nextPageExists && !start){
        debugger;
        const pageUrl = url.slice(0, url.lastIndexOf("=") + 1)
        const pageNumber = parseInt(url.substr(url.indexOf("=") + 1)) + 1
        const nextPage = pageUrl + pageNumber
        const requestQueue = await Apify.openRequestQueue();
        debugger;
        requestQueue.addRequest({ url: nextPage, userData: {  start: false } })

    }

    console.log('data length_____', data.length, 'url:', url)
    return data
}

async function getUrls(page, param) {

    return { pageUrls: [], productCount: 0, pageLength: 0 }
}
module.exports = { handler, getUrls }