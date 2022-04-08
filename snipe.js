

const data =require('./collection2023.json')

const sortedData =data.sort((a, b) => (a.subcategory > b.subcategory) ? 1 : -1)

const mappedData =sortedData.map((c,i,arr)=>{
    const md = arr.map(el=>el.subcategory)
    const filteredData =arr.filter(obj=>obj.subcategory===c.subcategory)
    const index =filteredData.findIndex(obj=> obj.title===c.title)

    return {...c,itemOrder:index}


})
debugger;