// AgentCoordinator.js - 基础任务协调骨架（并行+顺序执行的示例）
class AgentCoordinator {
  constructor(agentManager) {
    this.agentManager = agentManager;
  }

  identifyRelevantAgents(gameEvent) {
    // 简化策略：根据类型选择Agent名称集合
    const type = gameEvent?.type || 'generic';
    const mapping = {
      evolution: ['EvolutionAgent'],
      story: ['StoryAgent', 'EvolutionAgent'],
      battle: ['BattleAgent', 'BehaviorAgent'],
      generic: this.agentManager.list()
    };
    return mapping[type] || [];
  }

  async createTaskPlan(gameEvent, agentNames) {
    // 简版任务计划：并行执行自检，顺序执行主任务（占位）
    return {
      parallel: agentNames.map(n => ({ kind: 'selfCheck', agent: n })),
      sequential: [{ kind: 'main', agent: agentNames[0] || null, event: gameEvent }]
    };
  }

  async executeTask(task) {
    if (task.kind === 'selfCheck' && task.agent) {
      const agent = this.agentManager.get(task.agent);
      if (agent && agent.selfCheck) return agent.selfCheck();
      return { ok: false, error: `Agent ${task.agent} not found or no selfCheck()` };
    }
    if (task.kind === 'main' && task.agent) {
      // 主任务占位：返回一个协调结果，后续按具体Agent扩展
      return { ok: true, agent: task.agent, coordinated: true };
    }
    return { ok: false, error: 'Unknown task kind' };
  }

  async coordinate(gameEvent) {
    const agentNames = this.identifyRelevantAgents(gameEvent);
    const plan = await this.createTaskPlan(gameEvent, agentNames);
    const parallelResults = await Promise.all(plan.parallel.map(t => this.executeTask(t)));
    let sequentialResults = [];
    for (const t of plan.sequential) {
      sequentialResults.push(await this.executeTask(t));
    }
    return { ok: true, plan, parallelResults, sequentialResults };
  }
}

module.exports = AgentCoordinator;