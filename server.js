const fetch = require('node-fetch')
const cheerio = require('cheerio')
const express = require('express')
const path = require('path')
const pdfkit = require('pdfkit')

const app = express()

const server = app.listen(process.env.PORT || 3000, () => {
  console.log('listening at 3000')
})

let fetchedComicImages = []
let comicIssue
let doc

const mainUrl = 'http://readallcomics.com'

app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))

server.on('close', () => {
  console.log('closed')
})

app.get('/', function (request, response) {
  response.render('homePage')
})

async function getData (url) {
  const response = await fetch(url)
  const body = await response.text()
  const $ = cheerio.load(body)

  let obj = []
  const liAnchorEles = $('li a')
  for (let i = 0; i < liAnchorEles.length; i++) {
    obj.push({
      link: $(liAnchorEles[i]).attr('href'),
      comicName: $(liAnchorEles[i]).text()
    })
  }
  return obj
}

async function getData2 (url) {
  const response = await fetch(url)
  const body = await response.text()
  const $ = cheerio.load(body)
  let obj = []
  const liAnchorEles = $('ul.list-story li a')

  for (let i = 0; i < liAnchorEles.length; i++) {
    obj.push({
      link: $(liAnchorEles[i]).attr('href'),
      comicName: $(liAnchorEles[i]).text()
    })
  }
  return obj
}

async function getData3 (url) {
  const response = await fetch(url)
  const body = await response.text()
  const $ = cheerio.load(body)

  let obj = {}
  const seriesName = $('div.pinbin-category p a').text()
  obj.seriesName = seriesName
  const issueName = $('div.pinbin-copy h1').text()
  obj.issueName = issueName
  comicIssue = issueName

  const imgEles = $('div.pinbin-copy p img')
  for (let i = 0; i < imgEles.length; i++) {
    if (obj.images === undefined) {
      obj.images = [$(imgEles[i]).attr('src')]
    } else {
      obj.images.push($(imgEles[i]).attr('src'))
    }
  }
  return obj
}

app.get('/search', async function (req, res) {
  const query = req.query.comicsearchname
  const requiredUrl = mainUrl + `/?story=${query}&s=&type=comic`
  let data = await getData(requiredUrl)
  for (let item of data) {
    item.link = '/category' + item.link.split('category')[1]
  }
  res.render('search', { data: data })
})

app.get('/category/:name', async function (req, res) {
  const requiredUrl = mainUrl + '/' + req.originalUrl
  let data = await getData2(requiredUrl)

  for (const item of data) {
    item.link = '/comic/' + item.link.split('.com/')[1]
  }
  res.render('category_issues', { data: data })
})

app.get('/comic/:name', async function (req, res) {
  finalcomicbookparam = req.params.name
  const requiredUrl = mainUrl + '/' + req.params.name
  let data = await getData3(requiredUrl)
  fetchedComicImages = data.images

  res.render('maincomicview', { data: data })
})

app.get('/downloadcomic', async function (req, res) {
  doc = new pdfkit({
    margins: {
      top: 20,
      left: 20,
      right: 20,
      bottom: 20
    }
  })

  doc.pipe(res)
  res.setHeader('Content-type', 'application/pdf')
  doc.text(
    `${comicIssue}\n\n\nComic Scraping project\nby Ayan Gupta\nGithub: @ayangupta9`,
    doc.page.width / 3,
    doc.page.width / 3
  )

  for (const item of fetchedComicImages) {
    const response = await fetch(item)
    const body = await response.buffer()

    doc.addPage().image(body, {
      fit: [doc.page.width - 50, doc.page.height - 50],
      align: 'center',
      valign: 'center'
    })
  }

  doc.end()
})
