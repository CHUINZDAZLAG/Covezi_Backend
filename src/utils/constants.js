import { env } from '~/config/environment'

export const WHITELIST_DOMAINS = [
  // 'http://localhost:5173' // Dev always runs
  'https://covezi-frontend.vercel.app',
  'https://covezi.vercel.app',
  'http://localhost:5173'
]

export const WEBSITE_DOMAIN = (env.BUILD_MODE === 'production') ? env.WEBSITE_DOMAIN_PRODUCTION : env.WEBSITE_DOMAIN_DEVELOPMENT

export const DEFAULT_PAGE = 1
export const DEFAULT_ITEMS_PER_PAGE = 12

// Board constants (Legacy Trello)
export const BOARD_TYPES = {
  PUBLIC: 'public',
  PRIVATE: 'private'
}

export const CARD_MEMBER_ACTIONS = {
  ADD: 'add',
  REMOVE: 'remove'
}

export const INVITATION_TYPES = {
  BOARD_INVITATION: 'board_invitation'
}

export const BOARD_INVITATION_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected'
}

// Product constants
export const PRODUCT_CATEGORIES = {
  ORGANIC: 'organic',
  RECYCLED: 'recycled',
  SUSTAINABLE: 'sustainable',
  ECO_CONSCIOUS: 'eco-conscious'
}

export const PRODUCT_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  OUT_OF_STOCK: 'out-of-stock'
}

// Order constants
export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  SHIPPING: 'shipping',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled'
}

export const PAYMENT_METHODS = {
  COD: 'cod',
  MOMO: 'momo',
  BANK_TRANSFER: 'bank-transfer'
}

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded'
}

// Challenge constants
export const CHALLENGE_TYPES = {
  ECO_ACTION: 'eco-action',
  PURCHASE_GREEN: 'purchase-green',
  RECYCLE: 'recycle',
  PLANT_TREE: 'plant-tree'
}

export const CHALLENGE_DIFFICULTY = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard'
}

export const CHALLENGE_STATUS = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  EXPIRED: 'expired'
}

// Garden constants
export const TREE_TYPES = {
  OAK: 'oak',
  PINE: 'pine',
  BAMBOO: 'bamboo',
  FLOWER: 'flower'
}

export const TREE_STATUS = {
  SEED: 'seed',
  GROWING: 'growing',
  MATURE: 'mature',
  BLOOMING: 'blooming'
}

export const GARDEN_ACTIONS = {
  PLANT: 'plant',
  WATER: 'water',
  FERTILIZE: 'fertilize',
  HARVEST: 'harvest'
}