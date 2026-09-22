# Recepção da lista de espera

O formulário de `zeratta.com` envia os dados para um Web App do Google Apps Script, que grava
uma linha numa planilha do Google. Não há banco de dados, não há servidor nosso e não há custo.

```
Navegador  ──POST──►  Web App (Apps Script)  ──appendRow──►  Planilha
```

---

## Publicar, passo a passo

### 1. Crie a planilha

No Google Drive, crie uma planilha em branco e dê um nome que se explique sozinho daqui a um
ano, por exemplo `Zeratta · Lista de espera`.

### 2. Abra o editor de script a partir da planilha

Dentro da planilha: **Extensões → Apps Script**.

> **Isto não é um detalhe.** O script precisa nascer **de dentro** da planilha para ficar
> vinculado a ela. Um script criado solto no Apps Script não enxerga planilha nenhuma, e
> `SpreadsheetApp.getActiveSpreadsheet()` devolve `null`. Se você já criou solto, jogue fora e
> refaça por aqui.

### 3. Cole o código

Apague o conteúdo de `Código.gs` e cole o [`codigo.gs`](codigo.gs) inteiro deste diretório.
Salve.

### 4. Prepare a aba

No editor, escolha a função `configurar` na lista suspensa e clique em **Executar**. Ela cria a
aba `leads` com o cabeçalho e congela a primeira linha.

O Google vai pedir autorização na primeira execução. É esperado: o script está pedindo permissão
para escrever na sua própria planilha. Siga em **Avançado → Acessar o projeto**.

### 5. Publique como Web App

**Implantar → Nova implantação → tipo: App da Web.**

| Campo | Valor |
| :-- | :-- |
| Descrição | `lista de espera v1` |
| Executar como | **Eu** |
| Quem pode acessar | **Qualquer pessoa** |

> **"Qualquer pessoa" é obrigatório e é seguro aqui.** A página é pública e o visitante não tem
> conta Google, então qualquer outra opção rejeita todos os envios. O Web App só expõe
> `doPost`, que grava: ele não devolve nada da planilha. Ver a seção de segurança abaixo.

Copie a **URL do app da Web**. Ela termina em `/exec`.

### 6. Ligue a página ao endpoint

Em [`../../index.html`](../../index.html), encontre:

```js
var ENDPOINT = "";
```

E cole a URL:

```js
var ENDPOINT = "https://script.google.com/macros/s/AKfy.../exec";
```

Enquanto essa constante estiver vazia, o formulário valida os campos normalmente, mas ao enviar
mostra "O formulário ainda não foi conectado" e registra o motivo no console. É proposital: uma
página que engole o envio em silêncio perde leads sem ninguém perceber.

### 7. Teste antes de anunciar

Abra a página, envie um cadastro de verdade e confirme a linha na planilha. Depois teste os
caminhos tortos, que são os que quebram em produção:

- e-mail sem arroba, para ver `Confira o e-mail`
- o mesmo e-mail duas vezes, para ver `Este e-mail já está na lista`
- campo vazio, para ver `Preencha todos os campos`

Apague as linhas de teste da planilha ao terminar.

---

## Ao alterar o código depois

O Apps Script **não** republica sozinho ao salvar. Depois de editar:

**Implantar → Gerenciar implantações → ícone de lápis → Versão: Nova versão → Implantar.**

Isso mantém a mesma URL. Criar uma implantação nova em vez de versionar a existente gera outra
URL e deixa a página apontando para a versão velha, que continua funcionando: é uma falha
silenciosa, do tipo que só aparece quando alguém repara que os leads pararam.

E traga a alteração de volta para o [`codigo.gs`](codigo.gs) deste diretório.

---

## Exportar os leads

Na planilha: **Arquivo → Fazer download → CSV** (ou `.xlsx`).

Para JSON, a API do Sheets serve a aba direto, ou cole no editor e rode:

```js
function exportarJson() {
  var aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('leads');
  var linhas = aba.getDataRange().getValues();
  var chaves = linhas.shift();
  var saida = linhas.map(function (linha) {
    var obj = {};
    chaves.forEach(function (chave, i) { obj[chave] = linha[i]; });
    return obj;
  });
  console.log(JSON.stringify(saida, null, 2));
}
```

> Arquivos exportados contêm **dado pessoal de terceiros**. O `.gitignore` deste repositório já
> bloqueia `leads*.csv` e `leads*.json` na raiz, mas o repositório é público: confira antes de
> commitar qualquer coisa que tenha saído da planilha.

---

## Segurança, com honestidade

**A URL do endpoint fica visível no HTML.** Isso é inerente a formulário em página estática, e
não tem como esconder. Ela não é uma chave secreta e não deve ser tratada como tal.

O que ela permite e o que não permite:

| | |
| :-- | :-- |
| Ler a planilha | **Não.** O Web App só expõe `doPost`, que grava, e `doGet`, que devolve um sinal de vida |
| Gravar linha | Sim. É exatamente para isso que ela existe |
| Descobrir quem já se cadastrou | **Não.** A resposta `duplicado` confirma um e-mail por vez, e só |

O pior caso realista é alguém inserir linhas falsas. Contido por três camadas: o campo-armadilha
invisível, a recusa de e-mail duplicado e a validação de formato no servidor. Nenhuma delas
impede um atacante determinado, e nenhuma precisa: o prejuízo de uma linha falsa numa lista de
espera é uma linha a apagar.

**O que não fazer:** guardar qualquer segredo de verdade neste script, ou dar a ele permissão
sobre outra coisa além desta planilha. O escopo dele deve continuar sendo uma planilha só.

---

## Limites do Google

Cota de conta gratuita, com folga larga para uma campanha de lançamento:

| Limite | Valor |
| :-- | :-- |
| Execuções por dia | 20.000 |
| Tempo por execução | 6 minutos (usamos milissegundos) |
| Linhas por planilha | 10 milhões de células |

A primeira execução do dia tem partida a frio e pode levar alguns segundos. É por isso que o
botão mostra `Enviando` em vez de parecer travado.
