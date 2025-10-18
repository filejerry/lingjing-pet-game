/**
 * 内容过滤中间件
 * 敏感词检测、不良内容过滤、AI生成内容审核
 */

const logger = require('../utils/logger');

/**
 * 敏感词库
 * 生产环境建议使用外部词库文件或数据库
 */
const SENSITIVE_WORDS = {
  // 政治敏感词
  political: [
    // 这里只是示例,实际使用需要完整词库
  ],

  // 色情低俗
  vulgar: [
    '色情', '黄色', '裸体', '性交', '淫秽'
  ],

  // 暴力血腥
  violence: [
    '杀人', '自杀', '屠杀', '血腥', '暴力'
  ],

  // 违法犯罪
  illegal: [
    '毒品', '赌博', '诈骗', '洗钱', '走私'
  ],

  // 辱骂攻击
  abuse: [
    '傻逼', '操你', '妈的', '去死', '脑残', '智障'
  ],

  // 广告营销
  spam: [
    '加微信', '免费领取', '点击链接', '扫码关注', '限时优惠'
  ]
};

/**
 * 内容过滤器类
 */
class ContentFilter {
  constructor() {
    // 将敏感词转换为正则表达式(提高性能)
    this.patterns = this.buildPatterns();

    // 是否启用过滤
    this.enabled = process.env.ENABLE_CONTENT_FILTER !== 'false';

    // 过滤统计
    this.stats = {
      totalChecks: 0,
      blocked: 0,
      byCategory: {}
    };
  }

  /**
   * 构建敏感词正则模式
   */
  buildPatterns() {
    const patterns = {};

    for (const [category, words] of Object.entries(SENSITIVE_WORDS)) {
      if (words.length > 0) {
        // 转义特殊字符并构建正则
        const escaped = words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
        patterns[category] = new RegExp(`(${escaped.join('|')})`, 'gi');
      }
    }

    return patterns;
  }

  /**
   * 检测文本中的敏感词
   */
  detectSensitiveWords(text) {
    if (!this.enabled || !text || typeof text !== 'string') {
      return { hasSensitive: false, matches: [] };
    }

    this.stats.totalChecks++;

    const matches = [];

    for (const [category, pattern] of Object.entries(this.patterns)) {
      const found = text.match(pattern);
      if (found) {
        matches.push({
          category,
          words: [...new Set(found)], // 去重
          count: found.length
        });

        // 更新统计
        this.stats.byCategory[category] = (this.stats.byCategory[category] || 0) + 1;
      }
    }

    if (matches.length > 0) {
      this.stats.blocked++;
    }

    return {
      hasSensitive: matches.length > 0,
      matches
    };
  }

  /**
   * 替换敏感词为星号
   */
  maskSensitiveWords(text) {
    if (!this.enabled || !text || typeof text !== 'string') {
      return text;
    }

    let masked = text;

    for (const pattern of Object.values(this.patterns)) {
      masked = masked.replace(pattern, (match) => {
        return '*'.repeat(match.length);
      });
    }

    return masked;
  }

  /**
   * 检查文本长度和格式
   */
  validateTextFormat(text, options = {}) {
    const {
      minLength = 1,
      maxLength = 5000,
      allowEmoji = true,
      allowURL = false
    } = options;

    const errors = [];

    // 长度检查
    if (text.length < minLength) {
      errors.push(`文本长度不能少于${minLength}字符`);
    }

    if (text.length > maxLength) {
      errors.push(`文本长度不能超过${maxLength}字符`);
    }

    // URL检查
    if (!allowURL && /https?:\/\//.test(text)) {
      errors.push('文本不能包含网址链接');
    }

    // Emoji检查
    if (!allowEmoji && /[\u{1F300}-\u{1F9FF}]/u.test(text)) {
      errors.push('文本不能包含表情符号');
    }

    // 特殊字符比例检查(防止乱码)
    const specialCharRatio = (text.match(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g) || []).length / text.length;
    if (specialCharRatio > 0.3) {
      errors.push('文本包含过多特殊字符');
    }

    // 重复字符检查(防止刷屏)
    const repeatedPattern = /(.)\1{9,}/g;
    if (repeatedPattern.test(text)) {
      errors.push('文本包含过多重复字符');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * AI生成内容审核
   */
  auditAIContent(content) {
    const issues = [];

    // 检查敏感词
    const sensitiveCheck = this.detectSensitiveWords(content);
    if (sensitiveCheck.hasSensitive) {
      issues.push({
        type: 'sensitive',
        severity: 'high',
        details: sensitiveCheck.matches
      });
    }

    // 检查格式
    const formatCheck = this.validateTextFormat(content, {
      maxLength: 10000,
      allowURL: false
    });

    if (!formatCheck.valid) {
      issues.push({
        type: 'format',
        severity: 'medium',
        details: formatCheck.errors
      });
    }

    // 检查AI特征(判断是否为AI生成)
    const aiPatterns = [
      /作为一个AI/gi,
      /我是一个AI/gi,
      /抱歉.*无法.*提供/gi,
      /违反.*政策/gi
    ];

    const hasAISignature = aiPatterns.some(p => p.test(content));
    if (hasAISignature) {
      issues.push({
        type: 'ai_signature',
        severity: 'low',
        details: ['内容包含AI生成特征']
      });
    }

    return {
      safe: issues.filter(i => i.severity === 'high').length === 0,
      issues,
      shouldMask: sensitiveCheck.hasSensitive,
      maskedContent: sensitiveCheck.hasSensitive ? this.maskSensitiveWords(content) : content
    };
  }

  /**
   * 获取过滤统计
   */
  getStats() {
    return {
      ...this.stats,
      enabled: this.enabled,
      categoriesCount: Object.keys(this.patterns).length
    };
  }

  /**
   * 重置统计
   */
  resetStats() {
    this.stats = {
      totalChecks: 0,
      blocked: 0,
      byCategory: {}
    };
  }

  /**
   * Express中间件 - 请求内容过滤
   */
  filterRequest(options = {}) {
    const {
      fields = ['content', 'message', 'text', 'name', 'description'],
      strict = false // 严格模式:发现敏感词直接拦截
    } = options;

    return (req, res, next) => {
      if (!this.enabled) {
        return next();
      }

      try {
        const data = { ...req.body, ...req.query };
        const violations = [];

        // 检查指定字段
        for (const field of fields) {
          if (data[field] && typeof data[field] === 'string') {
            const result = this.detectSensitiveWords(data[field]);

            if (result.hasSensitive) {
              violations.push({
                field,
                matches: result.matches
              });

              // 非严格模式:自动替换敏感词
              if (!strict) {
                data[field] = this.maskSensitiveWords(data[field]);
                logger.warn('敏感词已过滤', {
                  field,
                  ip: req.ip,
                  path: req.path
                });
              }
            }
          }
        }

        // 严格模式:有敏感词直接拦截
        if (strict && violations.length > 0) {
          logger.warn('请求包含敏感词被拦截', {
            ip: req.ip,
            path: req.path,
            violations
          });

          return res.status(400).json({
            success: false,
            error: 'Content Violation',
            message: '内容包含敏感词,请修改后重试',
            details: violations.map(v => ({
              field: v.field,
              category: v.matches.map(m => m.category)
            }))
          });
        }

        // 更新请求数据
        if (!strict) {
          req.body = { ...req.body, ...data };
        }

        next();
      } catch (error) {
        logger.error('内容过滤错误:', error);
        next(); // 过滤失败不影响请求
      }
    };
  }

  /**
   * Express中间件 - AI响应内容审核
   */
  auditAIResponse() {
    return (req, res, next) => {
      if (!this.enabled) {
        return next();
      }

      // 拦截res.json,审核AI返回内容
      const originalJson = res.json.bind(res);

      res.json = (data) => {
        try {
          // 检查响应中的AI生成内容
          const aiContent = this.extractAIContent(data);

          if (aiContent) {
            const audit = this.auditAIContent(aiContent);

            if (!audit.safe) {
              logger.warn('AI响应内容审核未通过', {
                path: req.path,
                issues: audit.issues
              });

              // 记录问题但不拦截(由业务层决定)
              if (data.data) {
                data.data._contentAudit = {
                  safe: audit.safe,
                  issues: audit.issues.map(i => ({ type: i.type, severity: i.severity }))
                };
              }
            }

            // 自动替换敏感词
            if (audit.shouldMask) {
              this.replaceAIContent(data, audit.maskedContent);
            }
          }
        } catch (error) {
          logger.error('AI响应审核错误:', error);
        }

        return originalJson(data);
      };

      next();
    };
  }

  /**
   * 从响应数据中提取AI内容
   */
  extractAIContent(data) {
    if (!data || typeof data !== 'object') return null;

    // 常见AI内容字段
    const aiFields = ['story', 'description', 'aiResponse', 'generatedText', 'content'];

    for (const field of aiFields) {
      if (data[field] && typeof data[field] === 'string') {
        return data[field];
      }

      if (data.data && data.data[field] && typeof data.data[field] === 'string') {
        return data.data[field];
      }
    }

    return null;
  }

  /**
   * 替换响应中的AI内容
   */
  replaceAIContent(data, maskedContent) {
    const aiFields = ['story', 'description', 'aiResponse', 'generatedText', 'content'];

    for (const field of aiFields) {
      if (data[field] && typeof data[field] === 'string') {
        data[field] = maskedContent;
      }

      if (data.data && data.data[field] && typeof data.data[field] === 'string') {
        data.data[field] = maskedContent;
      }
    }
  }
}

// 创建单例
const contentFilter = new ContentFilter();

// 路由处理器
const filterHandlers = {
  /**
   * 检测文本敏感词
   */
  checkText: (req, res) => {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: '缺少text参数'
      });
    }

    const result = contentFilter.detectSensitiveWords(text);
    const masked = contentFilter.maskSensitiveWords(text);

    res.json({
      success: true,
      data: {
        hasSensitive: result.hasSensitive,
        matches: result.matches,
        maskedText: masked
      }
    });
  },

  /**
   * 获取过滤统计
   */
  stats: (req, res) => {
    const stats = contentFilter.getStats();
    res.json({
      success: true,
      data: stats
    });
  }
};

module.exports = {
  ContentFilter,
  contentFilter,

  // 中间件
  filterRequest: contentFilter.filterRequest.bind(contentFilter),
  auditAIResponse: contentFilter.auditAIResponse.bind(contentFilter),

  // 工具函数
  detectSensitiveWords: contentFilter.detectSensitiveWords.bind(contentFilter),
  maskSensitiveWords: contentFilter.maskSensitiveWords.bind(contentFilter),
  auditAIContent: contentFilter.auditAIContent.bind(contentFilter),

  // 路由处理器
  filterHandlers
};
