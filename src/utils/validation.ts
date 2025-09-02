import Joi from 'joi';
import { Role } from '@prisma/client';

export const validationSchemas = {
  // User validation schemas
  userSignup: Joi.object({
    phoneNumber: Joi.string()
      .pattern(/^\+?[1-9]\d{1,14}$/)
      .required()
      .messages({
        'string.pattern.base': 'Phone number must be a valid international format',
        'any.required': 'Phone number is required'
      }),
    email: Joi.string()
      .email()
      .optional()
      .messages({
        'string.email': 'Email must be a valid email address'
      }),
    name: Joi.string()
      .min(2)
      .max(100)
      .required()
      .messages({
        'string.min': 'Name must be at least 2 characters long',
        'string.max': 'Name cannot exceed 100 characters',
        'any.required': 'Name is required'
      }),
    password: Joi.string()
      .min(8)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .required()
      .messages({
        'string.min': 'Password must be at least 8 characters long',
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        'any.required': 'Password is required'
      }),
    role: Joi.string()
      .valid(...Object.values(Role))
      .required()
      .messages({
        'any.only': 'Invalid role specified',
        'any.required': 'Role is required'
      }),
    institutionId: Joi.string()
      .pattern(/^c[a-z0-9]{24}$/)
      .optional()
      .messages({
        'string.pattern.base': 'Invalid institution ID format'
      })
  }),

  userLogin: Joi.object({
    phoneNumber: Joi.string()
      .pattern(/^\+?[1-9]\d{1,14}$/)
      .required()
      .messages({
        'string.pattern.base': 'Phone number must be a valid international format',
        'any.required': 'Phone number is required'
      }),
    password: Joi.string()
      .required()
      .messages({
        'any.required': 'Password is required'
      })
  }),

  otpVerification: Joi.object({
    phoneNumber: Joi.string()
      .pattern(/^\+?[1-9]\d{1,14}$/)
      .required()
      .messages({
        'string.pattern.base': 'Phone number must be a valid international format',
        'any.required': 'Phone number is required'
      }),
    code: Joi.string()
      .length(6)
      .pattern(/^\d{6}$/)
      .required()
      .messages({
        'string.length': 'OTP code must be exactly 6 digits',
        'string.pattern.base': 'OTP code must contain only digits',
        'any.required': 'OTP code is required'
      })
  }),

  resetPassword: Joi.object({
    phoneNumber: Joi.string()
      .pattern(/^\+?[1-9]\d{1,14}$/)
      .required()
      .messages({
        'string.pattern.base': 'Phone number must be a valid international format',
        'any.required': 'Phone number is required'
      }),
    newPassword: Joi.string()
      .min(8)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .required()
      .messages({
        'string.min': 'Password must be at least 8 characters long',
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        'any.required': 'New password is required'
      })
  }),

  // Institution validation schemas
  institutionCreate: Joi.object({
    name: Joi.string()
      .min(2)
      .max(200)
      .required()
      .messages({
        'string.min': 'Institution name must be at least 2 characters long',
        'string.max': 'Institution name cannot exceed 200 characters',
        'any.required': 'Institution name is required'
      }),
    address: Joi.string()
      .max(500)
      .optional()
      .messages({
        'string.max': 'Address cannot exceed 500 characters'
      }),
    adminId: Joi.string()
      .pattern(/^c[a-z0-9]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'Invalid admin ID format',
        'any.required': 'Admin ID is required'
      })
  }),

  // Quiz validation schemas
  quizCreate: Joi.object({
    title: Joi.string()
      .min(3)
      .max(200)
      .required()
      .messages({
        'string.min': 'Quiz title must be at least 3 characters long',
        'string.max': 'Quiz title cannot exceed 200 characters',
        'any.required': 'Quiz title is required'
      }),
    description: Joi.string()
      .max(1000)
      .optional()
      .messages({
        'string.max': 'Description cannot exceed 1000 characters'
      }),
    subjectId: Joi.string()
      .pattern(/^c[a-z0-9]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'Invalid subject ID format',
        'any.required': 'Subject ID is required'
      }),
    institutionId: Joi.string()
      .pattern(/^c[a-z0-9]{24}$/)
      .optional()
      .messages({
        'string.pattern.base': 'Invalid institution ID format'
      }),
    startTime: Joi.date()
      .greater('now')
      .required()
      .messages({
        'date.greater': 'Start time must be in the future',
        'any.required': 'Start time is required'
      }),
    endTime: Joi.date()
      .greater(Joi.ref('startTime'))
      .required()
      .messages({
        'date.greater': 'End time must be after start time',
        'any.required': 'End time is required'
      }),
    durationMins: Joi.number()
      .integer()
      .min(1)
      .max(480)
      .required()
      .messages({
        'number.base': 'Duration must be a number',
        'number.integer': 'Duration must be an integer',
        'number.min': 'Duration must be at least 1 minute',
        'number.max': 'Duration cannot exceed 8 hours (480 minutes)',
        'any.required': 'Duration is required'
      }),
    settings: Joi.object({
      allowRetake: Joi.boolean().default(false),
      showResults: Joi.boolean().default(true),
      randomizeQuestions: Joi.boolean().default(false),
      timeLimit: Joi.boolean().default(true),
      passingScore: Joi.number().min(0).max(100).default(60)
    }).default({})
  }),

  // Question validation schemas
  questionCreate: Joi.object({
    quizId: Joi.string()
      .pattern(/^c[a-z0-9]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'Invalid quiz ID format',
        'any.required': 'Quiz ID is required'
      }),
    text: Joi.string()
      .min(5)
      .max(1000)
      .required()
      .messages({
        'string.min': 'Question text must be at least 5 characters long',
        'string.max': 'Question text cannot exceed 1000 characters',
        'any.required': 'Question text is required'
      }),
    options: Joi.array()
      .items(Joi.string().min(1).max(200))
      .min(2)
      .max(6)
      .required()
      .messages({
        'array.min': 'Question must have at least 2 options',
        'array.max': 'Question cannot have more than 6 options',
        'any.required': 'Options are required'
      }),
    answer: Joi.string()
      .required()
      .messages({
        'any.required': 'Answer is required'
      }),
    difficulty: Joi.string()
      .valid('easy', 'medium', 'hard')
      .required()
      .messages({
        'any.only': 'Difficulty must be easy, medium, or hard',
        'any.required': 'Difficulty is required'
      }),
    points: Joi.number()
      .integer()
      .min(1)
      .max(10)
      .default(1)
      .messages({
        'number.base': 'Points must be a number',
        'number.integer': 'Points must be an integer',
        'number.min': 'Points must be at least 1',
        'number.max': 'Points cannot exceed 10'
      })
  }),

  // Pagination validation schema
  pagination: Joi.object({
    page: Joi.number()
      .integer()
      .min(1)
      .default(1)
      .messages({
        'number.base': 'Page must be a number',
        'number.integer': 'Page must be an integer',
        'number.min': 'Page must be at least 1'
      }),
    limit: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .default(10)
      .messages({
        'number.base': 'Limit must be a number',
        'number.integer': 'Limit must be an integer',
        'number.min': 'Limit must be at least 1',
        'number.max': 'Limit cannot exceed 100'
      }),
    sortBy: Joi.string()
      .valid('createdAt', 'updatedAt', 'name', 'title', 'score')
      .default('createdAt')
      .messages({
        'any.only': 'Invalid sort field'
      }),
    sortOrder: Joi.string()
      .valid('asc', 'desc')
      .default('desc')
      .messages({
        'any.only': 'Sort order must be asc or desc'
      })
  })
};

export const validateSchema = (schema: Joi.ObjectSchema, data: any) => {
  const { error, value } = schema.validate(data, { abortEarly: false });
  
  if (error) {
    const errorMessages = error.details.map(detail => detail.message);
    throw new Error(errorMessages.join(', '));
  }
  
  return value;
};
