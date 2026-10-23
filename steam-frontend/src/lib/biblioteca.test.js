import { describe, expect, test } from 'vitest';
import { formatarHoras, formatarReais, resumirBiblioteca, situacaoDoPreco, somarValores } from './biblioteca';

const JOGOS = [
  { appid: 1, name: 'Counter-Strike', playtime_forever: 90000 },
  { appid: 2, name: 'Stardew Valley', playtime_forever: 0 },
  { appid: 3, name: 'Elden Ring', playtime_forever: 60 },
  { appid: 4, name: 'Jogo Grátis', playtime_forever: 0 },
];

describe('formatação', () => {
  test('horas no padrão brasileiro, com e sem casas decimais', () => {
    expect(formatarHoras(90000)).toBe('1.500,0H');
    expect(formatarHoras(90000, 0)).toBe('1.500H');
    expect(formatarHoras(45)).toBe('0,8H');
  });

  test('reais com separador de milhar e vírgula', () => {
    expect(formatarReais(24324.76)).toBe('R$ 24.324,76');
    expect(formatarReais(0)).toBe('R$ 0,00');
  });
});

describe('resumirBiblioteca', () => {
  test('soma as horas, conta os nunca abertos e acha o maior vício', () => {
    const resumo = resumirBiblioteca(JOGOS);
    expect(resumo.totalMinutos).toBe(90060);
    expect(resumo.nuncaAbertos).toBe(2);
    expect(resumo.maisJogado.name).toBe('Counter-Strike');
  });

  test('biblioteca vazia não quebra', () => {
    expect(resumirBiblioteca([])).toEqual({ totalMinutos: 0, nuncaAbertos: 0, maisJogado: null, tempoPrivado: false });
  });

  test('todos os jogos com 0 horas = tempo de jogo escondido', () => {
    const escondidos = JOGOS.map(g => ({ ...g, playtime_forever: 0 }));
    expect(resumirBiblioteca(escondidos).tempoPrivado).toBe(true);
    expect(resumirBiblioteca(JOGOS).tempoPrivado).toBe(false);
  });
});

describe('somarValores', () => {
  test('calcula total, dinheiro jogado fora e os mais caros', () => {
    const precos = {
      1: { cheio: 0, atual: 0 },
      2: { cheio: 49.99, atual: 24.99 },
      3: { cheio: 229.9, atual: 229.9 },
      4: { cheio: 0, atual: 0 },
    };
    const valores = somarValores(JOGOS, precos);
    expect(valores.total).toBeCloseTo(279.89);
    expect(valores.desperdicio).toBeCloseTo(49.99);
    // Jogo grátis nunca aberto não conta como dinheiro jogado fora
    expect(valores.pagosNuncaAbertos).toBe(1);
    expect(valores.maisCaros.map(g => g.name)).toEqual(['Elden Ring', 'Stardew Valley']);
  });

  test('com o tempo de jogo escondido, não existe "dinheiro jogado fora"', () => {
    const escondidos = JOGOS.map(g => ({ ...g, playtime_forever: 0 }));
    const valores = somarValores(escondidos, { 2: { cheio: 49.99, atual: 49.99 }, 3: { cheio: 100, atual: 100 } });
    expect(valores.total).toBeCloseTo(149.99);
    expect(valores.desperdicio).toBe(0);
    expect(valores.pagosNuncaAbertos).toBe(0);
    expect(valores.tempoPrivado).toBe(true);
  });

  test('jogo fora da loja não entra na soma nem no "jogado fora", mas é contado', () => {
    const precos = {
      2: { cheio: 0, atual: 0, situacao: 'indisponivel' }, // nunca aberto, mas saiu da loja
      3: { cheio: 100, atual: 100, situacao: 'pago' },
      4: { cheio: 0, atual: 0, situacao: 'gratis' },
    };
    const valores = somarValores(JOGOS, precos);
    expect(valores.total).toBe(100);
    expect(valores.desperdicio).toBe(0);
    expect(valores.pagosNuncaAbertos).toBe(0);
    expect(valores.foraDaLoja).toBe(1);
  });

  test('situacaoDoPreco entende respostas antigas, sem o campo situacao', () => {
    expect(situacaoDoPreco({ cheio: 49.9, atual: 49.9 })).toBe('pago');
    expect(situacaoDoPreco({ cheio: 0, atual: 0 })).toBe('gratis');
    expect(situacaoDoPreco({ cheio: 0, atual: 0, situacao: 'indisponivel' })).toBe('indisponivel');
  });

  test('ignora jogos ainda sem preço consultado', () => {
    const valores = somarValores(JOGOS, { 3: { cheio: 100, atual: 100 } });
    expect(valores.total).toBe(100);
    expect(valores.desperdicio).toBe(0);
  });
});
