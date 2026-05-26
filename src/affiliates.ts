export const AFFILIATE_ENABLED = false

export const AMAZON_TAG = ''
export const MERCADOLIVRE_ID = ''

export function amazonUrl(termo: string): string {
  const tag = AMAZON_TAG || 'seudotag-20'
  return `https://www.amazon.com.br/s?k=${encodeURIComponent(termo)}&tag=${tag}`
}

export function mercadolivreUrl(termo: string): string {
  const id = MERCADOLIVRE_ID || 'seu_id'
  const encoded = encodeURIComponent(termo)
  return `https://www.mercadolivre.com.br/${encoded}/#D=D&mllib=${id}`
}

export interface ProdutoAfiliado {
  nome: string
  amazon?: string
  mercadolivre?: string
  termosBusca: string[]
}

export const PRODUTOS: ProdutoAfiliado[] = [
  {
    nome: 'DualSense Edge',
    termosBusca: ['dualsense edge', 'controle ps5', 'playstation 5 controller'],
  },
  {
    nome: 'Xbox Elite Series 2',
    termosBusca: ['xbox elite controller', 'controle xbox series', 'xbox series controller'],
  },
  {
    nome: 'Nintendo Switch 2',
    termosBusca: ['nintendo switch 2', 'nintendo switch oled'],
  },
  {
    nome: 'ASUS ROG Ally',
    termosBusca: ['asus rog ally', 'rog ally x', 'console portátil asus'],
  },
  {
    nome: 'Steam Deck',
    termosBusca: ['steam deck', 'steam deck oled', 'console portátil valve'],
  },
  {
    nome: 'PlayStation Portal',
    termosBusca: ['playstation portal', 'ps portal', 'remote play sony'],
  },
  {
    nome: '8BitDo Pro 2',
    termosBusca: ['8bitdo pro 2', 'controle 8bitdo', 'controle retrô'],
  },
  {
    nome: 'Logitech G Cloud',
    termosBusca: ['logitech g cloud', 'console portátil logitech', 'cloud gaming handheld'],
  },
  {
    nome: 'Nintendo Switch OLED',
    termosBusca: ['nintendo switch oled', 'nintendo switch'],
  },
  {
    nome: 'Lenovo Legion Go',
    termosBusca: ['lenovo legion go', 'console portátil lenovo'],
  },
  {
    nome: 'Razer Kishi',
    termosBusca: ['razer kishi', 'controle mobile', 'controle celular'],
  },
  {
    nome: 'PlayStation 5',
    termosBusca: ['playstation 5', 'ps5', 'console sony ps5'],
  },
  {
    nome: 'Xbox Series X',
    termosBusca: ['xbox series x', 'xbox series s', 'console microsoft xbox'],
  },
  {
    nome: 'PlayStation VR2',
    termosBusca: ['playstation vr2', 'ps vr2', 'realidade virtual sony'],
  },
  {
    nome: 'Nintendo Switch Lite',
    termosBusca: ['nintendo switch lite', 'nintendo switch portátil'],
  },
]

export function buscarProduto(texto: string): ProdutoAfiliado | null {
  const lower = texto.toLowerCase()
  for (const p of PRODUTOS) {
    if (p.termosBusca.some(t => lower.includes(t))) return p
  }
  return null
}
