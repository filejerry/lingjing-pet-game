// BaseAgent.js - 通用Agent基类（精简版）
class BaseAgent {
  constructor(name, capabilities = []) {
    this.name = name;
    this.capabilities = capabilities;
    this.memory = [];
    this.health = { status: 'unknown', lastCheck: null, issues: [] };
  }

  logMemory(entry) {
    this.memory.push({ ...entry, ts: Date.now() });
    if (this.memory.length > 200) this.memory.shift(); // 控制内存
  }

  async process(input, context = {}) {
    const analysis = await this.analyze(input, context);
    const decision = await this.decide(analysis, context);
    const action = await this.act(decision, context);
    this.logMemory({ input, context, analysis, decision, action });
    return action;
  }

  async analyze(input, context) { return { input, context, ok: true }; }
  async decide(analysis) { return { action: 'noop', meta: analysis }; }
  async act(decision) { return { result: 'noop_done', decision }; }

  // 自检：返回Agent健康报告
  async selfCheck() {
    const report = {
      agent: this.name,
      capabilities: this.capabilities,
      memorySize: this.memory.length,
      status: 'OK',
      timestamp: new Date().toISOString(),
    };
    this.health = { status: 'OK', lastCheck: Date.now(), issues: [] };
    return report;
  }
}

module.exports = BaseAgent;