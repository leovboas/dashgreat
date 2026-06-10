export interface Config {
  token: string
  id_usuario: string
  id_projeto: string
  cacheTtlMinutes: number
}

export interface PageSummary {
  id: string
  titulo: string
  visitas: { total: number; '7_dias': number }
  impressoes: { total: number; '7_dias': number }
  conversoes: { total: number; '7_dias': number }
  status: string
  link: { preview: string; publico: string }
}

export interface PageReport {
  id: string
  titulo: string
  relatorios: {
    visitas_7_dias: number
    visitas: number
    impressoes_7_dias: number
    impressoes: number
    conversoes_7_dias: number
    conversoes: number
    taxa_conversao_7_dias: number
    taxa_conversao: number
  }
}

export interface Lead {
  id: string
  titulo: string
  valor: string
}

export interface LeadEntry {
  fields: Lead[]
}

export interface PagesListResponse {
  status: string
  retorno: {
    pagina: number
    quantidade: number
    quantidade_total: number
    paginas: PageSummary[]
  }
}

export interface PageReportResponse {
  status: string
  retorno: {
    paginas: PageReport[]
  }
}

export interface LeadsResponse {
  status: string
  retorno: {
    pagina: number
    quantidade: number
    quantidade_total: number
    paginas: {
      leads: Lead[][]
    }
  }
}
