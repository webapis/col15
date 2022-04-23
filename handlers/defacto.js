
async function handler(page) {

    const url = await page.url()

    await page.waitForSelector('.catalog-products')


    const data = await page.$$eval('.catalog-products .product-card', (productCards) => {
        return productCards.map(productCard => {

            const imageUrl = productCard.querySelector('.catalog-products .product-card .product-card__image .image-box .product-card__image--item.swiper-slide img').getAttribute('data-srcset')
            const title = productCard.querySelector('.product-card__title a').getAttribute('title')
            const priceOld = productCard.querySelector('.product-card__price--old') && productCard.querySelector('.product-card__price--old').textContent.trim().replace('₺', '').replace('TL', '')
            const priceNew = productCard.querySelector('.product-card__price--new') && productCard.querySelector('.product-card__price--new').textContent.trim().replace('₺', '').replace('TL', '')
            const priceBasket = productCard.querySelector('.product-card__price--basket>.sale') && productCard.querySelector('.product-card__price--basket>.sale').textContent.trim().replace('₺', '').replace('TL', '')
            const basketDiscount = productCard.querySelector('.product-card__price--basket span') && productCard.querySelector('.product-card__price--basket span').innerText.replace(/(\D+)/g, '')
            const discPerc = priceOld ? Math.floor(((parseInt(priceOld) - parseInt(priceNew)) * 100) / parseInt(priceOld)) : null
            const gender =productCard.querySelector('[data-category]').getAttribute('data-gender').toLowerCase()
           
                return {
                title,
                priceOld: priceOld ? priceOld.replace(',', '.').trim() : 0,
                priceNew: priceNew ? priceNew.replace(',', '.').trim() : 0,
                priceBasket: priceBasket ? priceBasket.replace(',', '.').trim() : 0,
                basketDiscount: basketDiscount ? basketDiscount : 0,
                imageUrl: imageUrl && 'https:' + imageUrl.substring(imageUrl.lastIndexOf('//'), imageUrl.lastIndexOf('.jpg') + 4),
                link: productCard.querySelector('.catalog-products .product-card .product-card__image .image-box a').href,
                timestamp2: new Date().toISOString(),
                timestamp: Date.now(),
                plcHolder: "https://dfcdn.defacto.com.tr/AssetsV2/dist/img/placeholders/placeholder.svg",
                discPerc: discPerc ? discPerc : 0,
                marka:'defacto',
                gender
            }
        }).filter(f => f.imageUrl !== null)
    })

    console.log('data length_____', data.length, 'url:', url)



    return data
}
//document.querySelector('.catalog__meta--product-count span').textContent
async function getUrls(page) {
    const url = await page.url()
    await page.waitForSelector('.catalog__meta--product-count span')
    const productCount = await page.$eval('.catalog__meta--product-count span', element => parseInt(element.innerHTML))
    const totalPages = Math.ceil(productCount / 60)
    const pageUrls = []

    let pagesLeft = totalPages
    for (let i = 2; i <= totalPages; i++) {

       // if (pagesLeft > 0) {

            pageUrls.push(`${url}?page=` + i)
            --pagesLeft
       // }
     
    }

    return { pageUrls, productCount, pageLength: pageUrls.length + 1 }
}
module.exports = { handler, getUrls }