<div align="center">

# ZERATTA · Página de lançamento

**Captação da lista de espera, servida em [zeratta.com](https://zeratta.com).**

</div>

---

> ⚠️ **Este repositório é PÚBLICO e tem deploy.**
> Tudo que entra aqui fica visível na internet sob a marca Zeratta, e permanece no histórico
> do git mesmo se removido depois. Todo push na `main` publica em `zeratta.com`.
> Liste os arquivos e confirme antes de commitar.

---

## O que é

Página única de captação para o lançamento da Zeratta. Metade esquerda é a fotografia da
embalagem, metade direita é o convite e o formulário. Sem banco de dados, sem servidor e sem
processo de build: HTML estático com CSS e JavaScript embutidos, no mesmo idioma do site
institucional.

Não confundir com o repositório [`zeratta-lp`](https://github.com/paulozeratta/zeratta-lp), que
guarda o site institucional. São produtos distintos, e este aqui é o que ocupa o domínio.

## Estrutura

```
index.html                      a página inteira, CSS e JS embutidos
politica-de-privacidade.html    exigida pela LGPD, linkada no rodapé
CNAME                           zeratta.com
assets/images/
  embalagem-zeratta.webp        a fotografia do painel esquerdo
  og-zeratta.jpg                recorte 1200x630 para compartilhamento
integracao/apps-script/
  codigo.gs                     o Web App que recebe os cadastros
  README.md                     como publicar e obter a URL
```

## Rodar localmente

Qualquer servidor estático serve. Abrir o arquivo por `file://` também funciona, mas o envio
do formulário não, porque o navegador bloqueia a requisição.

```bash
python -m http.server 8080     # ou: npx serve .
```

## Antes de publicar

| Passo | Onde |
| :-- | :-- |
| Publicar o Web App e colar a URL em `ENDPOINT` | [integracao/apps-script/README.md](integracao/apps-script/README.md) |
| Confirmar que `CNAME` contém `zeratta.com` | [CNAME](CNAME) |
| Ligar o HTTPS forçado nas configurações do Pages | Settings → Pages |

> Enquanto `ENDPOINT` estiver vazio em [index.html](index.html), o formulário valida os campos
> mas recusa o envio com uma mensagem clara, em vez de engolir o cadastro em silêncio.

## A fotografia

Trocar a imagem é sobrescrever `assets/images/embalagem-zeratta.webp`. Nada no HTML muda.

| Atributo | Valor |
| :-- | :-- |
| Proporção | 5:6 (retrato) |
| Resolução ideal | 2000 × 2400 px |
| Formato | WebP, qualidade 92 |
| Peso alvo | abaixo de 350 KB |
| Composição | assunto centralizado, cerca de 15% de folga nas bordas |

A folga nas bordas não é capricho: o painel usa `object-fit: cover` e a proporção dele muda com
a tela, de cerca de 0,80 num notebook 16:10 a 1,19 num ultrawide. Sem folga, o corte decapita a
embalagem.

## Convenções

Valem as do ecossistema, descritas em
[zeratta-eco](https://github.com/paulozeratta/zeratta-eco). Em resumo: branch `main`,
Conventional Commits em inglês com escopo `launch-page`, documentação em português, sem
em-dash, LF no repositório e segredo nenhum versionado.

---

<div align="center">
<sub>Propriedade intelectual da Zeratta.</sub>
</div>
