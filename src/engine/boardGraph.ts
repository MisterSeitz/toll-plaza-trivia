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
}

const NODE_DEFS: NodeDef[] = [
  // Gauteng / North
  { id: 'node_jhb_central', name: 'Johannesburg Park Station', region: 'Gauteng', category: 'hub', x: 470, y: 240 },
  { id: 'node_n1_midrand', name: 'Midrand Waterfall', region: 'Gauteng', category: 'beats_screen', x: 490, y: 190 },
  { id: 'node_pta_monument', name: 'Voortrekker Monument', region: 'Gauteng', category: 'history_icons', x: 500, y: 140 },
  { id: 'node_n1_polokwane', name: 'Polokwane Gateway', region: 'Limpopo', category: 'hub', x: 530, y: 70 },
  // N4 East
  { id: 'node_n4_witbank', name: 'eMalahleni Rest Stop', region: 'Mpumalanga', category: 'spaza', x: 560, y: 230 },
  { id: 'node_n4_nelspruit', name: 'Mbombela Lowveld', region: 'Mpumalanga', category: 'hub', x: 670, y: 220 },
  // N3 to KZN
  { id: 'node_n3_heidelberg', name: 'Heidelberg Escarpment', region: 'Gauteng', category: 'slang_lingo', x: 505, y: 285 },
  { id: 'node_n3_de_lynn_toll', name: 'De Hoek Toll Plaza', region: 'Gauteng', category: 'toll_gate', x: 530, y: 325, isChokepoint: true },
  { id: 'node_n3_villiers', name: 'Villiers Vaal Crossing', region: 'Free State', category: 'braai_chow', x: 545, y: 365 },
  { id: 'node_gravel_shortcut_r56', name: 'Karoo Dirt Detour', region: 'Free State', category: 'pothole', x: 630, y: 385 },
  { id: 'node_n3_harrismith', name: 'Harrismith Mountain Inn', region: 'Free State', category: 'padstal', x: 550, y: 415 },
  { id: 'node_n3_van_reenen', name: "Van Reenen's Pass", region: 'KZN', category: 'load_shedding', x: 575, y: 450 },
  { id: 'node_n3_ladysmith', name: 'Ladysmith Junction', region: 'KZN', category: 'history_icons', x: 615, y: 475 },
  { id: 'node_n3_marianhill_toll', name: 'Marianhill Toll Plaza', region: 'KZN', category: 'toll_gate', x: 650, y: 495, isChokepoint: true },
  { id: 'node_n3_pmb', name: 'Pietermaritzburg Comrades Wall', region: 'KZN', category: 'diski_bokke', x: 690, y: 515 },
  { id: 'node_n3_durban_beach', name: 'Durban Moses Mabhida', region: 'KZN', category: 'hub', x: 735, y: 540 },
  // N2 coast
  { id: 'node_n2_kokstad', name: 'Kokstad Foothills', region: 'KZN', category: 'scenic_route', x: 650, y: 565 },
  { id: 'node_n2_east_london', name: 'East London Beachfront', region: 'Eastern Cape', category: 'beats_screen', x: 555, y: 575 },
  { id: 'node_n2_gqeberha', name: 'Gqeberha Friendly City', region: 'Eastern Cape', category: 'hub', x: 440, y: 575 },
  { id: 'node_n2_addo', name: 'Addo Elephant Park', region: 'Eastern Cape', category: 'scenic_route', x: 370, y: 560 },
  { id: 'node_n2_knysna', name: 'Knysna Lagoon Spaza', region: 'Western Cape', category: 'spaza', x: 290, y: 565 },
  // N1 South
  { id: 'node_n1_vaal_toll', name: 'Vaal Toll Plaza', region: 'Free State', category: 'toll_gate', x: 435, y: 275, isChokepoint: true },
  { id: 'node_n1_kroonstad', name: 'Kroonstad Silos', region: 'Free State', category: 'load_shedding', x: 400, y: 320 },
  { id: 'node_n1_bloem', name: 'Bloemfontein Mangaung', region: 'Free State', category: 'hub', x: 375, y: 380 },
  { id: 'node_n1_colesberg', name: 'Colesberg Karoo Stop', region: 'Northern Cape', category: 'padstal', x: 330, y: 440 },
  { id: 'node_n1_beaufort_west', name: 'Beaufort West Plains', region: 'Western Cape', category: 'braai_chow', x: 260, y: 490 },
  { id: 'node_n1_cpt_waterfront', name: 'Cape Town Table Mountain', region: 'Western Cape', category: 'hub', x: 150, y: 540 },
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
