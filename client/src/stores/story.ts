import { defineStore } from 'pinia'
import type { StoryLine, StoryChoice, SceneType } from '@/types/story'

export const useStoryStore = defineStore('story', {
  state: () => ({
    storyLines: [] as StoryLine[],
    currentChoices: [] as StoryChoice[],
    currentScene: 'forest' as SceneType,
    loading: false,
    error: null as string | null
  }),

  getters: {
    sceneColors: (state): [string, string] => {
      const colorMap: Record<SceneType, [string, string]> = {
        volcano: ['rgba(255,60,60,0.14)', 'rgba(255,140,0,0.12)'],
        sky: ['rgba(70,140,255,0.12)', 'rgba(160,120,255,0.10)'],
        forest: ['rgba(60,200,120,0.10)', 'rgba(40,120,80,0.12)'],
        desert: ['rgba(240,200,120,0.12)', 'rgba(200,160,80,0.10)'],
        camp: ['rgba(100,100,100,0.10)', 'rgba(60,60,60,0.12)']
      }
      return colorMap[state.currentScene]
    },

    latestStoryLine: (state): StoryLine | null => {
      return state.storyLines.length > 0
        ? state.storyLines[state.storyLines.length - 1]
        : null
    }
  },

  actions: {
    addStoryLine(text: string, cssClass?: string) {
      this.storyLines.push({
        text,
        cssClass,
        timestamp: Date.now()
      })
    },

    addMultipleLines(lines: string[], cssClass?: string) {
      lines.forEach(text => {
        this.addStoryLine(text, cssClass)
      })
    },

    setChoices(choices: StoryChoice[]) {
      this.currentChoices = choices
    },

    clearChoices() {
      this.currentChoices = []
    },

    setScene(scene: SceneType) {
      this.currentScene = scene
      this.addStoryLine(`场景切换: ${this.getSceneName(scene)}`, 'scene-change')
    },

    clearStoryLines() {
      this.storyLines = []
    },

    getSceneName(scene: SceneType): string {
      const nameMap: Record<SceneType, string> = {
        volcano: '火山边缘',
        sky: '云海之巅',
        forest: '青木灵境',
        desert: '流沙秘境',
        camp: '营地'
      }
      return nameMap[scene]
    },

    setLoading(loading: boolean) {
      this.loading = loading
    },

    setError(error: string | null) {
      this.error = error
    }
  }
})
