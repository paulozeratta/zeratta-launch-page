/**
 * ZERATTA · recepção da lista de espera
 * ---------------------------------------------------------------
 * Web App do Google Apps Script que recebe os envios do formulário
 * em zeratta.com e grava uma linha na planilha vinculada.
 *
 * Este arquivo é a FONTE. O que roda é a cópia colada no editor do
 * Apps Script. Ao alterar lá, traga a alteração para cá: código que
 * existe só dentro do painel do Google é código que ninguém revisa
 * e que se perde junto com o acesso à conta.
 *
 * Passo a passo de publicação: ./README.md
 */

var ABA = 'leads';
var CABECALHO = ['timestamp', 'nome', 'email', 'origem'];

/** Aceita qualquer coisa com uma arroba e um ponto depois dela. */
var RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;


/**
 * Rode UMA VEZ, à mão, pelo editor do Apps Script.
 * Cria a aba e escreve o cabeçalho. Rodar de novo não duplica nada.
 */
function configurar() {
  var planilha = SpreadsheetApp.getActiveSpreadsheet();
  var aba = planilha.getSheetByName(ABA) || planilha.insertSheet(ABA);

  if (aba.getLastRow() === 0) {
    aba.appendRow(CABECALHO);
    aba.getRange(1, 1, 1, CABECALHO.length).setFontWeight('bold');
    aba.setFrozenRows(1);
  }
  return 'Aba "' + ABA + '" pronta.';
}


/**
 * Visitar a URL no navegador cai aqui. Serve para confirmar que o
 * Web App está no ar sem precisar enviar um lead de verdade.
 */
function doGet() {
  return json({ ok: true, servico: 'zeratta-lista-de-espera' });
}


function doPost(e) {
  // Sem corpo não há o que gravar. Acontece com varredura automática.
  if (!e || !e.postData || !e.postData.contents) {
    return json({ ok: false, erro: 'campos_obrigatorios' });
  }

  var dados;
  try {
    dados = JSON.parse(e.postData.contents);
  } catch (err) {
    return json({ ok: false, erro: 'campos_obrigatorios' });
  }

  // Armadilha para robô. Campo escondido preenchido significa que
  // não foi gente. Responde ok e descarta: dizer "recusado" só
  // ensina o robô a passar na próxima tentativa.
  if (dados.hp) {
    return json({ ok: true });
  }

  var nome  = String(dados.nome  || '').trim().slice(0, 80);
  var email = String(dados.email || '').trim().toLowerCase();

  // O cliente já validou, mas validação de cliente é conveniência e
  // não segurança: qualquer um pode chamar esta URL direto.
  if (!nome || !email)        return json({ ok: false, erro: 'campos_obrigatorios' });
  if (!RE_EMAIL.test(email))  return json({ ok: false, erro: 'email_invalido' });

  // O campo `origem` é declarado pelo cliente e por isso NÃO vale
  // como segurança: qualquer um pode forjá-lo. Serve só para separar
  // tráfego de teste do real na planilha. O Apps Script não dá
  // acesso aos cabeçalhos da requisição, então não existe verificação
  // de origem confiável deste lado.
  var origem = String(dados.origem || '').trim().slice(0, 60);

  // A checagem de duplicado lê a planilha e só então grava. Sem trava,
  // dois envios simultâneos passam os dois pela leitura antes de
  // qualquer um gravar, e a mesma pessoa entra duas vezes. Em pico de
  // campanha isso deixa de ser hipótese.
  var trava = LockService.getScriptLock();
  try {
    trava.waitLock(20000);
  } catch (err) {
    return json({ ok: false, erro: 'servidor' });
  }

  try {
    var planilha = SpreadsheetApp.getActiveSpreadsheet();
    var aba = planilha.getSheetByName(ABA);
    if (!aba) {
      aba = planilha.insertSheet(ABA);
      aba.appendRow(CABECALHO);
      aba.setFrozenRows(1);
    }

    if (jaExiste(aba, email)) {
      return json({ ok: false, erro: 'duplicado' });
    }

    aba.appendRow([new Date().toISOString(), nome, email, origem]);
    return json({ ok: true });

  } catch (err) {
    console.error(err);
    return json({ ok: false, erro: 'servidor' });

  } finally {
    trava.releaseLock();
  }
}


/**
 * Procura o e-mail na coluna dele, pulando a linha de cabeçalho.
 * A coluna sai do CABECALHO, e não de um número cravado aqui: com o
 * número fixo, reordenar as colunas faria esta função comparar a
 * coluna errada em silêncio, e o duplicado passaria despercebido.
 */
function jaExiste(aba, email) {
  var ultima = aba.getLastRow();
  if (ultima < 2) return false;

  var colEmail = CABECALHO.indexOf('email') + 1;
  var coluna = aba.getRange(2, colEmail, ultima - 1, 1).getValues();
  for (var i = 0; i < coluna.length; i++) {
    if (String(coluna[i][0]).trim().toLowerCase() === email) return true;
  }
  return false;
}


function json(objeto) {
  return ContentService
    .createTextOutput(JSON.stringify(objeto))
    .setMimeType(ContentService.MimeType.JSON);
}
