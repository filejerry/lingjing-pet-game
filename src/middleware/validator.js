/**
 * 输入验证中间件
 * 防止SQL注入、XSS攻击和恶意输入
 */

const logger = require('../utils/logger');

/**
 * 验证规则定义
 */
const ValidationRules = {
  // 用户名规则
  username: {
    type: 'string',
    minLength: 3,
    maxLength: 20,
    pattern: /^[a-zA-Z0-9_\u4e00-\u9fa5]+$/,
    message: '用户名只能包含字母、数字、下划线和中文,长度3-20字符'
  },

  // 邮箱规则
  email: {
    type: 'string',
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: '邮箱格式不正确'
  },

  // 密码规则
  password: {
    type: 'string',
    minLength: 6,
    maxLength: 50,
    pattern: /^(?=.*[a-zA-Z])(?=.*\d).+$/,
    message: '密码长度6-50字符,必须包含字母和数字'
  },

  // 宠物名称规则
  petName: {
    type: 'string',
    minLength: 1,
    maxLength: 20,
    pattern: /^[a-zA-Z0-9_\u4e00-\u9fa5\s]+$/,
    message: '宠物名称长度1-20字符,不能包含特殊字符'
  },

  // 宠物种族规则
  species: {
    type: 'string',
    minLength: 2,
    maxLength: 20,
    pattern: /^[\u4e00-\u9fa5a-zA-Z]+$/,
    message: '种族名称只能包含中文或英文,长度2-20字符'
  },

  // 稀有度规则
  rarity: {
    type: 'enum',
    values: ['N', 'R', 'SR', 'SSR', 'SSS'],
    message: '稀有度必须是 N, R, SR, SSR, SSS 之一'
  },

  // ID规则
  id: {
    type: 'string',
    pattern: /^[0-9]+$/,
    message: 'ID必须是数字'
  },

  // 等级规则
  level: {
    type: 'number',
    min: 1,
    max: 100,
    message: '等级必须在1-100之间'
  },

  // 整数规则
  integer: {
    type: 'number',
    integer: true,
    message: '必须是整数'
  },

  // 正整数规则
  positiveInteger: {
    type: 'number',
    integer: true,
    min: 1,
    message: '必须是正整数'
  },

  // 文本内容规则
  text: {
    type: 'string',
    maxLength: 5000,
    message: '文本内容不能超过5000字符'
  },

  // JSON对象规则
  json: {
    type: 'object',
    message: '必须是有效的JSON对象'
  }
};

/**
 * 验证器类
 */
class Validator {
  /**
   * 验证单个字段
   */
  static validate(value, rule, fieldName = 'field') {
    // 处理undefined和null
    if (value === undefined || value === null) {
      if (rule.required) {
        return { valid: false, error: `${fieldName} 是必填项` };
      }
      return { valid: true };
    }

    // 类型检查
    if (rule.type) {
      const actualType = Array.isArray(value) ? 'array' : typeof value;

      if (rule.type === 'enum') {
        if (!rule.values.includes(value)) {
          return { valid: false, error: rule.message || `${fieldName} 的值无效` };
        }
      } else if (actualType !== rule.type) {
        return { valid: false, error: `${fieldName} 类型错误,期望 ${rule.type}` };
      }
    }

    // 字符串验证
    if (typeof value === 'string') {
      // 去除首尾空格
      value = value.trim();

      // 长度检查
      if (rule.minLength && value.length < rule.minLength) {
        return { valid: false, error: `${fieldName} 长度不能少于 ${rule.minLength} 字符` };
      }
      if (rule.maxLength && value.length > rule.maxLength) {
        return { valid: false, error: `${fieldName} 长度不能超过 ${rule.maxLength} 字符` };
      }

      // 正则检查
      if (rule.pattern && !rule.pattern.test(value)) {
        return { valid: false, error: rule.message || `${fieldName} 格式不正确` };
      }

      // XSS检查
      if (this.containsXSS(value)) {
        return { valid: false, error: `${fieldName} 包含非法字符` };
      }

      // SQL注入检查
      if (this.containsSQLInjection(value)) {
        return { valid: false, error: `${fieldName} 包含非法字符` };
      }
    }

    // 数字验证
    if (typeof value === 'number') {
      if (isNaN(value)) {
        return { valid: false, error: `${fieldName} 不是有效数字` };
      }

      // 整数检查
      if (rule.integer && !Number.isInteger(value)) {
        return { valid: false, error: `${fieldName} 必须是整数` };
      }

      // 范围检查
      if (rule.min !== undefined && value < rule.min) {
        return { valid: false, error: `${fieldName} 不能小于 ${rule.min}` };
      }
      if (rule.max !== undefined && value > rule.max) {
        return { valid: false, error: `${fieldName} 不能大于 ${rule.max}` };
      }
    }

    // 对象验证
    if (rule.type === 'object' && typeof value !== 'object') {
      return { valid: false, error: `${fieldName} 必须是对象` };
    }

    return { valid: true, value };
  }

  /**
   * XSS检测
   */
  static containsXSS(str) {
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe/gi,
      /<embed/gi,
      /<object/gi
    ];

    return xssPatterns.some(pattern => pattern.test(str));
  }

  /**
   * SQL注入检测
   */
  static containsSQLInjection(str) {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/gi,
      /(--|;|\/\*|\*\/)/g,
      /('|('')|;|--|\/\*|\*\/|\bOR\b|\bAND\b)/gi
    ];

    // 对于用户输入的普通文本,只检测明显的SQL关键字组合
    const dangerousPattern = /('.*?(OR|AND).*?=.*?'|;\s*(DROP|DELETE|UPDATE))/gi;
    return dangerousPattern.test(str);
  }

  /**
   * 清理HTML标签
   */
  static sanitizeHTML(str) {
    if (typeof str !== 'string') return str;
    return str
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  /**
   * 转义特殊字符
   */
  static escape(str) {
    if (typeof str !== 'string') return str;
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * 验证Schema
   */
  static validateSchema(data, schema) {
    const errors = {};
    const sanitized = {};

    for (const [field, rule] of Object.entries(schema)) {
      const value = data[field];
      const result = this.validate(value, rule, field);

      if (!result.valid) {
        errors[field] = result.error;
      } else {
        // 清理后的值
        sanitized[field] = result.value !== undefined ? result.value : value;
      }
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors,
      data: sanitized
    };
  }

  /**
   * Express中间件工厂函数
   */
  static middleware(schema) {
    return (req, res, next) => {
      // 合并所有输入源
      const data = {
        ...req.body,
        ...req.query,
        ...req.params
      };

      // 验证
      const result = this.validateSchema(data, schema);

      if (!result.valid) {
        logger.warn('Validation failed', {
          path: req.path,
          errors: result.errors,
          ip: req.ip
        });

        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          details: result.errors
        });
      }

      // 将清理后的数据附加到请求对象
      req.validated = result.data;

      next();
    };
  }
}

/**
 * 预定义的验证Schema
 */
const Schemas = {
  // 用户注册
  userRegister: {
    username: { ...ValidationRules.username, required: true },
    email: { ...ValidationRules.email, required: true },
    password: { ...ValidationRules.password, required: true }
  },

  // 用户登录
  userLogin: {
    username: { ...ValidationRules.username, required: true },
    password: { ...ValidationRules.password, required: true }
  },

  // 创建宠物
  petCreate: {
    name: { ...ValidationRules.petName, required: false },
    species: { ...ValidationRules.species, required: true }
  },

  // 更新宠物
  petUpdate: {
    id: { ...ValidationRules.id, required: true },
    name: { ...ValidationRules.petName, required: false },
    level: { ...ValidationRules.level, required: false }
  },

  // 宠物进化
  petEvolution: {
    petId: { ...ValidationRules.id, required: true },
    evolutionPath: { ...ValidationRules.text, required: false }
  },

  // 通用ID验证
  idParam: {
    id: { ...ValidationRules.id, required: true }
  }
};

/**
 * 快捷验证中间件
 */
const validateUserRegister = Validator.middleware(Schemas.userRegister);
const validateUserLogin = Validator.middleware(Schemas.userLogin);
const validatePetCreate = Validator.middleware(Schemas.petCreate);
const validatePetUpdate = Validator.middleware(Schemas.petUpdate);
const validatePetEvolution = Validator.middleware(Schemas.petEvolution);
const validateId = Validator.middleware(Schemas.idParam);

module.exports = {
  Validator,
  ValidationRules,
  Schemas,

  // 导出快捷中间件
  validateUserRegister,
  validateUserLogin,
  validatePetCreate,
  validatePetUpdate,
  validatePetEvolution,
  validateId,

  // 导出工具函数
  sanitizeHTML: Validator.sanitizeHTML,
  escape: Validator.escape
};
