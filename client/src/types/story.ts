// 剧情相关类型定义

export type StoryType = 'adventure' | 'daily' | 'battle' | 'evolution'
export type SceneType = 'volcano' | 'sky' | 'forest' | 'desert' | 'camp'

export interface StoryContext {
  type: StoryType
  petId?: string
  scene?: SceneType
  action?: string
  [key: string]: any
}

export interface StoryResponse {
  text: string
  deltas?: {
    exp?: number
    bond?: number
    items?: string[]
  }
  meta?: {
    scene?: SceneType
    actors?: string[]
    task?: string
    plot?: string
  }
  choices?: StoryChoice[]
}

export interface StoryChoice {
  id: string
  text: string
  action: string
}

export interface StoryLine {
  text: string
  cssClass?: string
  timestamp: number
}
