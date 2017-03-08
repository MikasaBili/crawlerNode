const cheerio = require('cheerio')
const request = require('superagent')
const fs = require('fs')
const SEARCH_URL = 'http://www.mzitu.com/'
const keyword = 'japan'
let page = '1'
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
  let setArr = []
  let src = $('ul#pins li a img')
  for (let data in src) {
    if (/^[0-9]*$/.test(data)) {
      let obj = {
      title: trims(src[data].attribs.alt),
      src: src[data].attribs['data-original']
    }
    setArr.push(obj)
    }
  }
  return setArr
}
//整理title
const trims= (str) => {  
  return str.replace(/[ ]|\?/g,"")
}
//查看是否下一页
const testNext =(html) => {
  let $ = cheerio.load(html)
  let next = $('.nav-links .next.page-numbers').text()
  return next === '' ? false : true
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
    value.forEach((val) => {
      fun(val.title, val.src)
    })
  })
}
const lookUp = async (keyword, page) => {
  try {
    console.log(`关键字${keyword},页数${page}`)
    let getHtml = await setUrl(keyword, page)
    console.log('开始解析')
    let getSrc = setSrc(getHtml, keyword, page)
    content.push(getSrc)
    console.log('下一页')
    if (testNext(getHtml)) {
      return lookUp(keyword, ++page)
    }else{
      return content
    }
  } catch (error) {
    console.error(error)
  }
}
(async function crawler() {
    try {
        let links = await lookUp(keyword, page)
        console.log(links.length)
        arrayEach(download)
        console.log('下载完成！')
    } catch (err) {
        console.error(err)
    }
})()

