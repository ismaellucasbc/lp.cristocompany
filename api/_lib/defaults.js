// Conteúdo inicial do site. Depois que o painel salvar pela primeira vez,
// o conteúdo passa a vir do armazenamento (Vercel Blob).
export default {
  version: 1,
  updatedAt: null,
  pagina: {
    temaPadrao: 'escuro',
    heroLinha1: 'FÉ QUE VESTE.',
    heroLinha2: 'PALAVRA QUE',
    heroDestaque: 'TRANSFORMA.',
    heroTexto: 'Conteúdo diário para fortalecer sua fé e te lembrar de quem caminha com você todos os dias.',
    heroImagem: '',
    secoes: [
      { id: 'destaques', nome: 'Versículo do dia e devocional', visivel: true },
      { id: 'videos', nome: 'Vídeos', visivel: true },
      { id: 'oracao', nome: 'Pedido de oração', visivel: true },
      { id: 'comunidade', nome: 'Comunidade', visivel: true },
      { id: 'missao', nome: 'Go and make disciples', visivel: true },
      { id: 'feed', nome: 'Feed (loja ou Instagram)', visivel: true }
    ]
  },
  links: {
    loja: '',
    comunidade: 'https://www.instagram.com/cristocompanyofc/',
    oracao: 'https://ig.me/m/cristocompanyofc',
    instagram: 'https://www.instagram.com/cristocompanyofc/'
  },
  devocionais: [
    {
      id: 'dev-inicial',
      titulo: 'Ele cuida de cada detalhe',
      data: '2026-10-28',
      versiculo: '',
      texto: 'Deus não é apenas o Deus das grandes coisas, mas também das pequenas. Ele vê o que ninguém vê e cuida do que ninguém cuida. Descanse no cuidado d’Ele e confie: você não está sozinho.',
      reflexao: 'Que detalhe da sua vida você ainda não entregou nas mãos de Deus?',
      imagem: ''
    }
  ],
  videos: [
    { id: 'v1', titulo: 'Quando a vida estiver difícil', link: 'https://www.instagram.com/cristocompanyofc/reels/', capa: '' },
    { id: 'v2', titulo: 'Como vencer a ansiedade', link: 'https://www.instagram.com/cristocompanyofc/reels/', capa: '' },
    { id: 'v3', titulo: 'Encontre forças para continuar', link: 'https://www.instagram.com/cristocompanyofc/reels/', capa: '' }
  ],
  feed: {
    modo: 'produtos',
    titulo: 'VISTA A MENSAGEM.',
    texto: 'Peças que levam a Palavra para onde você for.',
    produtos: [],
    instagram: []
  }
};
