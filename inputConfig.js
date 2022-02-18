require('dotenv').config()
const Apify = require('apify');

module.exports= async()=>{
    if (process.env.CLOUD){

        const {startUrl,JSONfileName,marka,gender,category,subcategory}=await Apify.getInput();
        process.env.startUrl=startUrl
        process.env.JSONfileName=JSONfileName
        process.env.marka=marka
        process.env.gender=gender
        process.env.category=category
        process.env.subcategory=subcategory
    } 
}