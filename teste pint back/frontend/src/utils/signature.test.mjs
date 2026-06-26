import test from 'node:test';
import assert from 'node:assert/strict';
import { buildEmailSignatureHtml } from './signature.js';

test('buildEmailSignatureHtml includes the selected badge and user details', () => {
  const html = buildEmailSignatureHtml({
    nome: 'Ana Silva',
    cargo: 'Consultor',
    email: 'ana@empresa.pt',
    badgeName: 'Azure Fundamentals',
    badgeImage: 'https://cdn.example/badge.png',
  });

  assert.match(html, /Ana Silva/);
  assert.match(html, /Consultor/);
  assert.match(html, /ana@empresa.pt/);
  assert.match(html, /Azure Fundamentals/);
  assert.match(html, /badge\.png/);
});

test('buildEmailSignatureHtml omits the badge block when no badge is selected', () => {
  const html = buildEmailSignatureHtml({
    nome: 'Ana Silva',
    cargo: 'Consultor',
    email: 'ana@empresa.pt',
    badgeName: '',
    badgeImage: '',
  });

  assert.doesNotMatch(html, /Badge:/);
});
