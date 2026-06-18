# Database Schema

## ERD

See `Docs/Gambaran ERD.png` for the full entity-relationship diagram.

## Tables

### merchants
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| business_name | String | |
| phone | String | Unique |
| password_hash | String? | Null for invite-only |
| address | String? | |
| is_active | Boolean | Default true |
| created_at | DateTime | |
| updated_at | DateTime | |

### customers
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| merchant_id | UUID | FK → merchants |
| name | String | |
| phone | String | |
| notes | String? | |
| total_orders | Int | Default 0 |
| created_at | DateTime | |
| Unique: (merchant_id, phone) | | |

### categories
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| merchant_id | UUID | FK → merchants |
| name | String | |
| description | String? | |
| Unique: (merchant_id, name) | | |

### products
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| merchant_id | UUID | FK → merchants |
| category_id | UUID? | FK → categories |
| name | String | |
| description | String? | |
| price | Decimal(12,2) | |
| stock | Int | Default 0 |
| is_available | Boolean | Default true |
| image_url | String? | |
| created_at | DateTime | |
| updated_at | DateTime | |

### orders
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| merchant_id | UUID | FK → merchants |
| customer_id | UUID | FK → customers |
| status | Enum | PENDING → CONFIRMED → PROCESSING → COMPLETED / CANCELLED |
| total_amount | Decimal(12,2) | Default 0 |
| source | String | Default "wa_chat" |
| notes | String? | |
| created_at | DateTime | |
| updated_at | DateTime | |

### order_items
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| order_id | UUID | FK → orders |
| product_id | UUID | FK → products |
| qty | Int | |
| unit_price | Decimal(12,2) | |
| subtotal | Decimal(12,2) | |

### payments
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| order_id | UUID | FK → orders (unique) |
| method | Enum | CASH / TRANSFER / QRIS |
| amount | Decimal(12,2) | |
| status | Enum | PENDING → PAID / FAILED / REFUNDED |
| paid_at | DateTime? | |
| created_at | DateTime | |

### conversations
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| merchant_id | UUID | FK → merchants |
| customer_id | UUID | FK → customers |
| status | Enum | ACTIVE / RESOLVED / ARCHIVED / ESCALATED |
| last_message_at | DateTime? | |
| created_at | DateTime | |
| updated_at | DateTime | |

### messages
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| conversation_id | UUID | FK → conversations |
| role | Enum | CUSTOMER / BOT / HUMAN |
| content | Text | |
| msg_type | String | Default "text" |
| metadata | JSON? | |
| created_at | DateTime | |

### wa_sessions
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| merchant_id | UUID | FK → merchants (unique) |
| creds | JSON? | Baileys auth credentials |
| status | String | Default "disconnected" |
| qr_code | String? | |
| created_at | DateTime | |
| updated_at | DateTime | |

### ai_agents
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| merchant_id | UUID | FK → merchants (unique) |
| is_active | Boolean | Default true |
| system_prompt | Text | |
| model | String | Default "opencode/deepseek-v4-flash-free" |
| greeting_message | String? | |
| knowledge_base | Text? | |
| max_tokens | Int | Default 2048 |
| temperature | Decimal(3,2) | Default 0.7 |
| created_at | DateTime | |
| updated_at | DateTime | |

### settings
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| merchant_id | UUID | FK → merchants |
| key | String | |
| value | JSON? | |
| updated_at | DateTime | |
| Unique: (merchant_id, key) | | |

### activity_logs
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| merchant_id | UUID | FK → merchants |
| type | String | |
| reference_id | String? | |
| description | Text | |
| metadata | JSON? | |
| created_at | DateTime | |

### web_stores
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| merchant_id | UUID | FK → merchants (unique) |
| slug | String | Unique |
| template | String | Default "default" |
| is_published | Boolean | Default false |
| custom_domain | String? | |
| seo_title | String? | |
| seo_desc | String? | |
| theme | JSON? | |
| hero_image | String? | |
| hero_text | String? | |
| created_at | DateTime | |
| updated_at | DateTime | |

### templates
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| name | String | Unique |
| label | String | |
| thumbnail | String? | |
| config | JSON? | |
| is_public | Boolean | Default true |
| created_at | DateTime | |
