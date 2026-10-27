import type { BoardGraph, BoardNode, RouteType, TileCategory, BoardEdge } from '../types/game'

export interface MapNodeCoordinates {
  x: number
  y: number
}

interface NodeDef {
  id: string
  name: string
  region: string
  category: TileCategory
  x: number
  y: number
  isChokepoint?: boolean
  isRoundabout?: boolean
}


const NODE_DEFS: NodeDef[] = [
  // Limpopo & Gauteng (North)
  { id: 'node_n1_polokwane', name: 'Polokwane Gateway', region: 'Limpopo', category: 'hub', x: 740, y: 70 },
  { id: 'node_pta_monument', name: 'Voortrekker Monument', region: 'Gauteng', category: 'history_icons', x: 710, y: 155 },
  { id: 'node_n1_midrand', name: 'Midrand Waterfall', region: 'Gauteng', category: 'beats_screen', x: 690, y: 235 },
  { id: 'node_jhb_central', name: 'Johannesburg Park Station', region: 'Gauteng', category: 'hub', x: 670, y: 315 },

  // N4 East (Mpumalanga)
  { id: 'node_n4_witbank', name: 'eMalahleni Rest Stop', region: 'Mpumalanga', category: 'spaza', x: 850, y: 300 },
  { id: 'node_n4_nelspruit', name: 'Mbombela Lowveld', region: 'Mpumalanga', category: 'hub', x: 1050, y: 260 },

  // N3 Route to KZN (South-East)
  { id: 'node_n3_heidelberg', name: 'Heidelberg Escarpment', region: 'Gauteng', category: 'slang_lingo', x: 755, y: 385 },
  { id: 'node_n3_de_lynn_toll', name: 'De Hoek Toll Plaza', region: 'Gauteng', category: 'toll_gate', x: 820, y: 445, isChokepoint: true },
  { id: 'node_n3_villiers', name: 'Villiers Vaal Crossing', region: 'Free State', category: 'braai_chow', x: 865, y: 510 },
  { id: 'node_gravel_shortcut_r56', name: 'Karoo Dirt Detour', region: 'Free State', category: 'pothole', x: 995, y: 520 },
  { id: 'node_n3_harrismith', name: 'Harrismith Mountain Inn', region: 'Free State', category: 'padstal', x: 885, y: 585 },
  { id: 'node_n3_van_reenen', name: "Van Reenen's Pass", region: 'KZN', category: 'load_shedding', x: 930, y: 650 },
  { id: 'node_n3_ladysmith', name: 'Ladysmith Junction', region: 'KZN', category: 'history_icons', x: 980, y: 705 },
  { id: 'node_n3_marianhill_toll', name: 'Marianhill Toll Plaza', region: 'KZN', category: 'toll_gate', x: 1035, y: 750, isChokepoint: true },
  { id: 'node_n3_pmb', name: 'Pietermaritzburg Comrades', region: 'KZN', category: 'diski_bokke', x: 1080, y: 790 },
  { id: 'node_n3_durban_beach', name: 'Durban Moses Mabhida', region: 'KZN', category: 'hub', x: 1135, y: 825 },

  // N2 South Coast (Eastern Cape & Garden Route Arc)
  { id: 'node_n2_kokstad', name: 'Kokstad Foothills', region: 'KZN', category: 'scenic_route', x: 975, y: 825 },
  { id: 'node_n2_east_london', name: 'East London Beachfront', region: 'Eastern Cape', category: 'beats_screen', x: 820, y: 825 },
  { id: 'node_n2_gqeberha', name: 'Gqeberha Friendly City', region: 'Eastern Cape', category: 'hub', x: 650, y: 825 },
  { id: 'node_n2_addo', name: 'Addo Elephant Park', region: 'Eastern Cape', category: 'scenic_route', x: 515, y: 815 },
  { id: 'node_n2_knysna', name: 'Knysna Lagoon Spaza', region: 'Western Cape', category: 'spaza', x: 345, y: 815 },
  { id: 'node_n1_cpt_waterfront', name: 'Cape Town Table Mountain', region: 'Western Cape', category: 'hub', x: 130, y: 805 },

  // N1 South Interior (Karoo & Free State)
  { id: 'node_n1_beaufort_west', name: 'Beaufort West Plains', region: 'Western Cape', category: 'braai_chow', x: 290, y: 695 },
  { id: 'node_n1_colesberg', name: 'Colesberg Karoo Circle', region: 'Northern Cape', category: 'padstal', x: 435, y: 595, isRoundabout: true },
  { id: 'node_n1_bloem', name: 'Bloemfontein Mangaung', region: 'Free State', category: 'hub', x: 530, y: 495 },
  { id: 'node_n1_kroonstad', name: 'Kroonstad Silos', region: 'Free State', category: 'load_shedding', x: 590, y: 415 },
  { id: 'node_n1_vaal_toll', name: 'Vaal Toll Plaza', region: 'Free State', category: 'toll_gate', x: 630, y: 355, isChokepoint: true },
]


type Label = BoardEdge['highwayLabel']

const ROADS: [string, string, Label, RouteType][] = [
  ['node_jhb_central', 'node_n1_midrand', 'N1', 'tar'],
  ['node_n1_midrand', 'node_pta_monument', 'N1', 'tar'],
  ['node_pta_monument', 'node_n1_polokwane', 'N1', 'tar'],
  ['node_jhb_central', 'node_n4_witbank', 'N4', 'tar'],
  ['node_n4_witbank', 'node_n4_nelspruit', 'N4', 'tar'],
  ['node_jhb_central', 'node_n3_heidelberg', 'N3', 'tar'],
  ['node_n3_heidelberg', 'node_n3_de_lynn_toll', 'N3', 'tar'],
  ['node_n3_de_lynn_toll', 'node_n3_villiers', 'N3', 'tar'],
  ['node_n3_villiers', 'node_n3_harrismith', 'N3', 'tar'],
  ['node_n3_villiers', 'node_gravel_shortcut_r56', 'R56', 'gravel'],
  ['node_gravel_shortcut_r56', 'node_n3_ladysmith', 'Local', 'shortcut'],
  ['node_n3_harrismith', 'node_n3_van_reenen', 'N3', 'tar'],
  ['node_n3_van_reenen', 'node_n3_ladysmith', 'N3', 'tar'],
  ['node_n3_ladysmith', 'node_n3_marianhill_toll', 'N3', 'tar'],
  ['node_n3_marianhill_toll', 'node_n3_pmb', 'N3', 'tar'],
  ['node_n3_pmb', 'node_n3_durban_beach', 'N3', 'tar'],
  ['node_n3_durban_beach', 'node_n2_kokstad', 'N2', 'tar'],
  ['node_n2_kokstad', 'node_n2_east_london', 'N2', 'tar'],
  ['node_n2_east_london', 'node_n2_gqeberha', 'N2', 'tar'],
  ['node_n2_gqeberha', 'node_n2_addo', 'N2', 'tar'],
  ['node_n2_addo', 'node_n2_knysna', 'N2', 'tar'],
  ['node_n2_knysna', 'node_n1_cpt_waterfront', 'N2', 'tar'],
  ['node_jhb_central', 'node_n1_vaal_toll', 'N1', 'tar'],
  ['node_n1_vaal_toll', 'node_n1_kroonstad', 'N1', 'tar'],
  ['node_n1_kroonstad', 'node_n1_bloem', 'N1', 'tar'],
  ['node_n1_bloem', 'node_n1_colesberg', 'N1', 'tar'],
  ['node_n1_colesberg', 'node_n1_beaufort_west', 'N1', 'tar'],
  ['node_n1_beaufort_west', 'node_n1_cpt_waterfront', 'N1', 'tar'],
]

export const NODE_COORDINATES: Record<string, MapNodeCoordinates> = {}

export const MZANSI_BOARD_GRAPH: BoardGraph = (() => {
  const graph: BoardGraph = {}
  for (const d of NODE_DEFS) {
    const node: BoardNode = {
      id: d.id,
      name: d.name,
      region: d.region,
      category: d.category,
      isChokepoint: d.isChokepoint,
      isRoundabout: d.isRoundabout,
      edges: [],
    }
    graph[d.id] = node
    NODE_COORDINATES[d.id] = { x: d.x, y: d.y }
  }

  // Roads are bidirectional.
  for (const [a, b, highwayLabel, routeType] of ROADS) {
    graph[a].edges.push({ targetNodeId: b, routeType, highwayLabel, cost: 1 })
    graph[b].edges.push({ targetNodeId: a, routeType, highwayLabel, cost: 1 })
  }
  return graph
})()

export const START_NODE_ID = 'node_jhb_central'
/** Players must hold all souvenirs and reach one of these finish hubs to win. */
export const FINISH_NODE_IDS = ['node_n1_cpt_waterfront', 'node_n3_durban_beach']
