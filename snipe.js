


debugger;
(async () => {
    require('dotenv').config();

    const { getGoogleToken } = require('./google/google.oauth')
    const { getSheetValues } = require('./google.sheet.js')
    const google_access_token = await getGoogleToken(process.env.GOOGLE_REFRESH_TOKEN)


    const { values } = await getSheetValues({ access_token: google_access_token, spreadsheetId: '12mKtqxu5A-CVoXP_Kw36JxKiC69oPUUXVQmm7LUfh3s', range: 'NAV!A:C' })


    const mapValues = values.filter((f, i) => i > 0).map(v => {
        const subcategory = v[0]
        const category = v[1]
        const total = v[2]
        return { subcategory, category, total }

    })

    const groupByCategory = mapValues.reduce((group, product) => {
        const { category } = product;
        group[category] = group[category] ?? [];
        group[category].push(product);
        return group;
    }, {});

    const mapCategoryTotal = {}
    for (let o in groupByCategory) {

        const current = groupByCategory[o]
        const subcategories = Object.values(current)
        const totalSubcategories =subcategories.reduce((p,c,i)=>{
            return p+ parseInt(c.total)
        
        },0)
        mapCategoryTotal[o]={}
        mapCategoryTotal[o]['total']=totalSubcategories
        debugger;
        mapCategoryTotal[o]['subcategories']=subcategories
        debugger;
   
    }
    debugger;
})()


