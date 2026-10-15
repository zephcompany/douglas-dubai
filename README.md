# Kryptobit — Landing page

Site estático da Kryptobit (Global Crypto Exchange): landing page + páginas Mercados, Trade, Ganhe, Institucional e Mais.

## Estrutura

```
index.html, mercados.html, trade.html, ganhe.html, institucional.html, mais.html   ← páginas geradas
css/styles.css     ← tokens, componentes, responsividade
js/main.js         ← preloader, animações de entrada, reveals, parallax, cursor, header, menu mobile
assets/            ← logo oficial, símbolo, hero devices, banner do app (PNG + WebP)
src/pages/*.html   ← conteúdo de cada página (front-matter + corpo)
src/partials/      ← header/footer compartilhados
src/build.py       ← monta as páginas: `python3 src/build.py`
```

Para editar o header/rodapé, altere `src/partials/` e rode `python3 src/build.py`.
