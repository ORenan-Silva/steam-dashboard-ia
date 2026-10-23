// Três blocos pulando (estilos em animacoes.css, classe blocos-loader)
const Loader = ({ rotulo = 'Carregando' }) => (
  <div className="blocos-loader" role="status" aria-label={rotulo}>
    <span />
    <span />
    <span />
  </div>
);

export default Loader;
