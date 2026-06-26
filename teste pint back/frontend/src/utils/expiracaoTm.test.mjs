import test from 'node:test';
import assert from 'node:assert/strict';
import { obterInfoExpiracao, filtrarBadgesProximosExpiracao } from './expiracaoTm.js';

function dataEmDias(dias) {
  const data = new Date();
  data.setDate(data.getDate() + dias);
  return data.toISOString();
}

test('obterInfoExpiracao devolve aviso para badges a expirar em poucos dias', () => {
  const info = obterInfoExpiracao(dataEmDias(2), 6, 3);

  assert.ok(info);
  assert.match(info.texto, /Expira em 2 dias/);
  assert.equal(info.cls, 'tm-estado-aviso');
});

test('filtrarBadgesProximosExpiracao devolve apenas badges dentro do limite', () => {
  const badges = [
    { idbadge: 1, dataconquista: dataEmDias(2), expiremeses: 6 },
    { idbadge: 2, dataconquista: dataEmDias(10), expiremeses: 6 },
    { idbadge: 3, dataconquista: dataEmDias(-5), expiremeses: 6 },
  ];

  const proximos = filtrarBadgesProximosExpiracao(badges, 3);

  assert.deepEqual(proximos.map((b) => b.idbadge), [1]);
});
