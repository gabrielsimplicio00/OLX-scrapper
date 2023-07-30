import puppeteer from "puppeteer";
import fs from "fs";

(async () => {
  // Launch the browser and open a new blank page
  const browser = await puppeteer.launch({
    headless: false,
  });

  const page = await browser.newPage();

  const nomeArquivo = "imoveis-recife.json";

  fs.access(nomeArquivo, fs.constants.F_OK, (err) => {
    if (err) {
      console.error(`O arquivo "${nomeArquivo}" não existe.`);
    } else {
      // Se o arquivo turtles-data.json existe, exclua-o antes de começar a coleta de dados
      fs.unlink(nomeArquivo, (err) => {
        if (err) {
          console.error(`Erro ao excluir o arquivo "${nomeArquivo}": ${err}`);
        } else {
          console.log(
            `O arquivo "${nomeArquivo}" foi excluído com sucesso, para ser reescrito.`
          );
        }
      });
    }
  });

  const url = "https://www.olx.com.br/imoveis/aluguel/estado-pe";
  await page.goto(url, { timeout: 180_000 });

  // Set screen size
  await page.setViewport({ width: 1080, height: 1024 });

  const elements = await page.$$(".sc-dRFtgE");

  console.log(
    "Aguarde enquanto coleto as informações, isso pode levar um tempo... (Max: 3 min)"
  );

  const urlsArray = [];
  for (let element of elements) {
    let href = await element.evaluate((el) => el.getAttribute("href"));

    urlsArray.push(href);
  }

  const imoveisArray = [];
  for (let url of urlsArray) {
    let newPage = await browser.newPage();

    await newPage.goto(url);
    await handleData(newPage, imoveisArray, url);

    await newPage.close();
  }

  const JSONData = JSON.stringify(imoveisArray, null, 2);

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

async function handleData(newPage, imoveisArray, url) {
  let areaDiv = await newPage.$$(".sc-bwzfXH.ad__h3us20-0.ikHgMx");
  let areaWanted = areaDiv[2];
  const areaContent = await areaWanted.evaluate((el) => {
    const children = Array.from(
      el.querySelectorAll(".ad__sc-1f2ug0x-1.cpGpXB.sc-hSdWYo.gwYTWo")
    );
    if (children.length >= 3) {
      return children[2].textContent;
    } else {
      return "Não informado";
    }
  });

  let aluguel;
  try {
    aluguel = await newPage.$eval(".ad__sc-1wimjbb-1", (el) => el.textContent);
  } catch (error) {
    if (error.message.includes("failed to find element matching selector")) {
      aluguel = "Não informado";
    } else {
      console.error("Erro ao extrair o texto do elemento:", error);
    }
  }

  let elements = await newPage.$$(".sc-EHOje.lePqYm");
  let quartos;
  if (elements.length === 3) {
    elements = await elements[elements.length - 1];
    quartos = await elements.evaluate((el) => el.textContent);
  } else {
    quartos = "Não informado";
  }

  imoveisArray.push({
    link: url,
    regiao: areaContent,
    preco_aluguel: aluguel,
    quartos: quartos,
  });
}
