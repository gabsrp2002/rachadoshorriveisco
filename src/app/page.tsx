export default function HomePage() {
  return (
    <main className="main-container">
      <section className="hero-card">
        <span className="badge">⚽ Temporada Oficial</span>
        <h1 className="hero-title">Racha dos Horríveis</h1>
        <p className="hero-subtitle">
          Portal oficial para acompanhamento de partidas, estatísticas dos jogadores,
          artilharia, assistências e histórico completo do nosso futebol.
        </p>
      </section>

      <section className="features-grid" aria-label="Funcionalidades do Portal">
        <article className="feature-card">
          <h2 className="feature-title">Artilharia &amp; Assistências</h2>
          <p className="feature-description">
            Ranking atualizado de gols, assistências e participações diretas por temporada e geral.
          </p>
        </article>

        <article className="feature-card">
          <h2 className="feature-title">Histórico de Partidas</h2>
          <p className="feature-description">
            Registro completo dos jogos, escalações dos times, placares e destaques de cada racha.
          </p>
        </article>

        <article className="feature-card">
          <h2 className="feature-title">Presença &amp; Desempenho</h2>
          <p className="feature-description">
            Controle de assiduidade, aproveitamento de vitórias e estatísticas individuais dos atletas.
          </p>
        </article>
      </section>
    </main>
  );
}
