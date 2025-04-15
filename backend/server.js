const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');

const app = express();
app.use(cors());

app.get('/api/missas', async (req, res) => {
  const { estado, cidade } = req.query;

  if (!estado || !cidade) {
    return res.status(400).json({ error: 'Informe estado e cidade.' });
  }

  const cidadeEncoded = encodeURIComponent(cidade);
  const url = `https://www.horariodemissa.com.br/search.php?uf=${estado}&cidade=${cidadeEncoded}&opcoes=cidade_opcoes&submit=15049935`;

  try {
const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
  executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined
});
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    const missas = await page.evaluate(() => {
      const dados = [];
      const tabelas = document.querySelectorAll('.resultado-busca table');
      tabelas.forEach((table) => {
        const igreja = table.querySelector('h4')?.innerText.trim();
        const linhas = Array.from(table.querySelectorAll('tr')).map(tr => tr.innerText.trim());
        dados.push({ igreja, horarios: linhas });
      });
      return dados;
    });

    await browser.close();
    res.json({ estado, cidade, missas });
  } catch (error) {
    console.error('Erro ao buscar missas:', error);
    res.status(500).json({ error: 'Erro ao buscar missas.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Backend rodando em http://localhost:${PORT}`);
});
