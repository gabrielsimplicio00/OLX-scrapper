import puppeteer from "puppeteer";
import fs from "fs";

(async () => {
  // Launch the browser and open a new blank page
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 20,
  });

  const page = await browser.newPage();

  const nomeArquivo = "turtles-data.json";

  fs.access(nomeArquivo, fs.constants.F_OK, (err) => {
    if (err) {
      console.error(`O arquivo "${nomeArquivo}" não existe.`);
    } else {
      // Se o arquivo turtles-data.json existe, exclua-o antes de começar a coleta de dados
      fs.unlink(nomeArquivo, (err) => {
        if (err) {
          console.error(`Erro ao excluir o arquivo "${nomeArquivo}": ${err}`);
        } else {
          console.log(`O arquivo "${nomeArquivo}" foi excluído com sucesso.`);
        }
      });
    }
  });

  const url = "https://www.olx.com.br/imoveis/estado-pe";
  await page.goto(url);

  page.setDefaultTimeout(180_000)

  // Set screen size
  await page.setViewport({ width: 1080, height: 1024 });

  // a aplicação entra no contexto do iframe
//   const iframeElement = await page.$("iframe");
//   const iframe = await iframeElement.contentFrame();

  const elements = await page.$$(".sc-dRFtgE"); // Use o seletor correto para os links dentro do iframe

  const urlsArray = [];

  for (let element of elements) {
    // let learnMoreBtn = await element.$(".btn");

    let href = await element.evaluate((el) => el.getAttribute("href"));

    urlsArray.push(href);
  }
  console.log(urlsArray)
  const dataArray = [];

  for (let url of urlsArray) {
    let newPage = await browser.newPage();

    await newPage.goto(url);

    await handleData(newPage, dataArray);

    await newPage.close();
  }

  const JSONData = JSON.stringify(dataArray, null, 2);

  // cria um arquivo JSON e escreve os dados das tartarugas nesse arquivo
  fs.writeFile(nomeArquivo, JSONData, (err) => {
    if (err) {
      console.error("Erro ao salvar o arquivo:", err);
    } else {
      console.log(`Dados salvos com sucesso no arquivo ${nomeArquivo}`);
    }
  });

  await browser.close();
})();

async function handleData(newPage, dataArray) {
  let areaDiv = await newPage.$$(".jNyXWf");
  let area = areaDiv[areaDiv.length - 1]
  let areaContent = await area.evaluate((el) => el.textContent);
  console.log(areaContent)

//   let lead = await newPage.waitForSelector(".lead");
//   let descriptionContent = await lead.evaluate((el) => el.textContent);

//   let turtleImg = await newPage.waitForSelector(".turtle-image");
//   let imgUrl = await turtleImg.evaluate((el) => el.getAttribute("src"));

//   dataArray.push({
//     species: areaContent,
//     description: descriptionContent.trim(),
//     imageUrl: imgUrl,
//   });
}
