const puppeteer = require('puppeteer')
const fs = require('fs')

const productsArray = []

const scrapper = async (url) => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null
  })

  const page = await browser.newPage()

  await page.goto(url, { waitUntil: 'networkidle2' })

  const divBtnCookies = await page.$('#footer_tc_privacy_container_button')
  await divBtnCookies.$eval('#footer_tc_privacy_button_3', (el) => el.click())

  await page.waitForSelector('.view-more-section')
  await page.$eval('.see-more-button', (el) => el.click())

  let beforeProducts = 0
  let afterProducts
  let endOfPage

  while (!endOfPage) {
    console.log(`Productos antes de la carga: ${beforeProducts}`)

    await page.evaluate(
      () => {
        window.scrollBy(0, window.innerHeight)
      },
      { timeout: 5000 }
    )

    afterProducts = await page.$$eval(
      '.product-tile',
      (products) => products.length
    )

    console.log(`Productos después de la carga: ${afterProducts}`)

    if (afterProducts === beforeProducts) {
      endOfPage = true
    } else {
      beforeProducts = afterProducts
      endOfPage = false
    }
  }

  console.log('Scroll terminado')

  const divProductsArray = await page.$$('.product-tile')

  for (const divProduct of divProductsArray) {
    let brand = await divProduct.$eval('.product-brand', (el) => el.textContent)
    let name = await divProduct.$eval(
      '.product-title.bidirectional',
      (el) => el.title
    )
    let price = await divProduct.$eval(
      '.product-sales-price, .price-sales-standard',
      (el) => el.innerText
    )
    let img = await divProduct.$eval('.product-first-img', (el) => el.src)

    const product = {
      brand,
      name,
      price,
      img
    }

    productsArray.push(product)
  }
  fs.writeFile('productsMakeup.json', JSON.stringify(productsArray), () => {
    console.log('Archivo escrito')
  })

  await browser.close()

  console.log('Datos productos Make Up Sephora recogidos')
}

scrapper('https://www.sephora.es/todos-los-productos/maquillaje-c302/')
