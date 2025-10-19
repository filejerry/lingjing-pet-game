// 宠物相关类型定义

export type Rarity = 'N' | 'R' | 'SR' | 'SSR' | 'SSS'

export interface PetStats {
  hp: number
  attack: number
  defense: number
  speed: number
  magic: number
}

export interface Pet {
  id: string
  name: string
  species: string
  rarity: Rarity
  level: number
  exp: number
  stats: PetStats
  traits: string[]
  personality: string
  mood: string
  bond: number
  imageUrl?: string
  description?: string
  createdAt: string
  updatedAt: string
}

export interface PetEvolutionPath {
  path: string
  name: string
  probability: number
  requirements: string[]
  description: string
}

export interface EvolutionCandidate {
  eligible: boolean
  candidates: PetEvolutionPath[]
  currentTendency: Record<string, number>
}
