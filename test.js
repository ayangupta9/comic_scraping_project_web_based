const cheerio = require('cheerio')
const nodefetch = require('node-fetch')

const url = 'http://readallcomics.com/?story=the+killing+joke&s=&type=comic'

async function getData (url) {
  const response = await nodefetch(url)
  const body = await response.text()
  const $ = cheerio.load(body)

  const liAnchorEles = $('li a')
  for (let i = 0; i < liAnchorEles.length; i++) {
    console.log($(liAnchorEles[i]).attr('href'), ':', $(liAnchorEles[i]).text())
  }
}

getData(url)
