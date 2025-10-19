// MCP协议相关类型定义

export interface MCPConfig {
  serverUrl: string
  timeout?: number
  retryCount?: number
}

export interface MCPToolRequest {
  name: string
  arguments: Record<string, any>
}

export interface MCPContent {
  type: 'text' | 'image' | 'resource'
  text?: string
  data?: string
  mimeType?: string
}

export interface MCPToolResponse {
  content: MCPContent[]
  isError?: boolean
}

export interface MCPClientCapabilities {
  sampling?: {}
  tools?: {}
  prompts?: {}
  resources?: {}
}

// MCP工具定义
export type MCPTool =
  | 'generate_story'
  | 'calculate_evolution'
  | 'generate_pet_image'
  | 'analyze_behavior'
  | 'get_evolution_tendency'

export interface GenerateStoryParams {
  type: 'adventure' | 'daily' | 'battle' | 'evolution'
  context: Record<string, any>
}

export interface CalculateEvolutionParams {
  petId: string
  behaviors: any[]
}

export interface GeneratePetImageParams {
  prompt: string
  style?: string
  provider?: 'vim' | 'dalle' | 'sd'
}
