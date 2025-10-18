// AgentManager.js - 统一管理各类Agent，提供注册、获取与健康检查
class AgentManager {
  constructor() {
    this.registry = new Map(); // name -> instance
  }

  register(name, instance) {
    if (!name || !instance) throw new Error('AgentManager.register: invalid args');
    this.registry.set(name, instance);
    return true;
  }

  get(name) {
    return this.registry.get(name);
  }

  list() {
    return Array.from(this.registry.keys());
  }

  async healthCheckAll() {
    const reports = [];
    for (const [name, agent] of this.registry.entries()) {
      if (typeof agent.selfCheck === 'function') {
        const report = await agent.selfCheck();
        reports.push({ name, report });
      } else {
        reports.push({ name, report: { status: 'UNKNOWN', reason: 'no selfCheck()' } });
      }
    }
    return { ok: true, count: reports.length, reports };
  }
}

module.exports = AgentManager;