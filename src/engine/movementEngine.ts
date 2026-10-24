import type { BoardGraph, MovementPathOption, RouteType } from '../types/game'

export interface TraverseOptions {
  ignoreChokepoints?: boolean
  allowUturns?: boolean
}

/**
 * Computes all destinations reachable with a dice roll.
 * - Chokepoints (toll gates) halt movement unless ignored (the start node is exempt).
 * - Dead ends terminate the move early instead of wasting the roll.
 */
export function getReachablePaths(
  graph: BoardGraph,
  startNodeId: string,
  diceRoll: number,
  options: TraverseOptions = {},
): MovementPathOption[] {
  const { ignoreChokepoints = false, allowUturns = false } = options
  const results: MovementPathOption[] = []

  interface Item {
    nodeId: string
    path: string[]
    steps: number
    routes: RouteType[]
    prev: string | null
  }

  const addResult = (it: Item, early: boolean) => {
    if (it.path.length < 2) return
    const exists = results.some((r) => r.targetNodeId === it.nodeId && r.path.length === it.path.length)
    if (exists) return
    results.push({
      targetNodeId: it.nodeId,
      path: it.path,
      remainingSteps: it.steps,
      stoppedEarlyByChokepoint: early,
      routeTypesUsed: it.routes,
    })
  }

  const queue: Item[] = [{ nodeId: startNodeId, path: [startNodeId], steps: diceRoll, routes: [], prev: null }]

  while (queue.length) {
    const cur = queue.shift()!
    const node = graph[cur.nodeId]
    if (!node) continue

    const blocked = !ignoreChokepoints && node.isChokepoint && cur.nodeId !== startNodeId
    if (cur.steps === 0 || blocked) {
      addResult(cur, Boolean(blocked && cur.steps > 0))
      continue
    }

    let pushed = false
    for (const edge of node.edges) {
      if (!allowUturns && edge.targetNodeId === cur.prev) continue
      if (cur.path.filter((id) => id === edge.targetNodeId).length > 0) continue
      if (cur.steps < edge.cost) continue
      pushed = true
      queue.push({
        nodeId: edge.targetNodeId,
        path: [...cur.path, edge.targetNodeId],
        steps: cur.steps - edge.cost,
        routes: [...cur.routes, edge.routeType],
        prev: cur.nodeId,
      })
    }
    // Dead end: stop here with remaining steps forfeited.
    if (!pushed) addResult({ ...cur, steps: 0 }, false)
  }

  // Fallback: if nothing found (e.g. blocked start), allow turning around.
  if (results.length === 0 && !allowUturns) {
    return getReachablePaths(graph, startNodeId, diceRoll, { ignoreChokepoints, allowUturns: true })
  }
  return results
}

/** Step-by-step token animator. Returns a cancel handle. */
export function executeStepwiseMovement(
  path: string[],
  onStep: (nodeId: string, index: number) => void,
  onComplete: (finalNodeId: string) => void,
  stepDurationMs = 350,
): () => void {
  let index = 1 // path[0] is the starting node
  let cancelled = false

  const id = setInterval(() => {
    if (cancelled) return clearInterval(id)
    if (index >= path.length) {
      clearInterval(id)
      onComplete(path[path.length - 1])
      return
    }
    onStep(path[index], index)
    index++
  }, stepDurationMs)

  return () => {
    cancelled = true
    clearInterval(id)
  }
}
