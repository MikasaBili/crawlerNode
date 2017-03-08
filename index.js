const cheerio = require('cheerio')
const request = require('superagent')
const fs = require('fs')
const SEARCH_URL = 'http://www.mzitu.com/'
// const keyword = 'japan'
let page = '22'
let content = []
//解析html
const setUrl = (keyword, page) => {
  let keywordG = keyword === '' ? keyword : keyword + '/'
  let url = `${SEARCH_URL}${keywordG}page/${page}`
  return new Promise((resolve, reject) => {
    request.get(url)
    .end(function(err, res){
      if (err) {
        reject(err)
      }
      resolve(res.text)
    })
  })
}

//取title和src
const setSrc = (html, keyword) => {
  let $ = cheerio.load(html)
  let src = $('ul#pins li a img')
  for (let data in src) {
    if (/^[0-9]*$/.test(data)) {
      let obj = {
      title: src[data].attribs.alt,
      src: src[data].attribs['data-original']
    }
    content.push(obj)
    }
  }
  let next = $('.nav-links .next.page-numbers').text()
  if (next) {
    lookUp(keyword, ++page)
  }
  console.log('解析完成')
}

//下载
const download = (title, src) => {
  console.log(`下载：${title}`)
  let file = `./img/${title}.jpg`
  request.get(src).pipe(fs.createWriteStream(file))
  console.log(`下载完成：${title}`)
}

//循环
const arrayEach = (fun) => {
  content.forEach((value) => {
    fun(value.title, value.src)
  })
}

const lookUp = async (keyword, page) => {
  try {
    console.log(`关键字${keyword},页数${page}`)
    let getHtml = await setUrl(keyword, page)
    console.log('解析')
    let getSrc = setSrc(getHtml, keyword, page)
  } catch (error) {
    console.error(error)
  }
}

(async function crawler() {
    let keyword = 'japan'
    try {
        let links = await lookUp(keyword, page)
        await arrayEach(download)
        console.log('完成！')
    } catch (err) {
        console.error(err)
    }
})()