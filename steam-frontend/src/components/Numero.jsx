import { useContagem } from '../hooks/useContagem';

const inteiro = (v) => Math.round(v).toLocaleString('pt-BR');

// Número com contagem animada. O leitor de tela recebe só o valor final, não cada passo da contagem.
const Numero = ({ valor, formatar = inteiro }) => {
  const atual = useContagem(valor);
  return (
    <>
      <span aria-hidden="true">{formatar(atual)}</span>
      <span className="sr-only">{formatar(valor)}</span>
    </>
  );
};

export default Numero;
