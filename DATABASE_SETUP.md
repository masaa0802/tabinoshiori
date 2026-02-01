# Travel Planner Database Setup

## Overview
このプロジェクトではHasura GraphQL Engineを使用してPostgreSQLデータベースと連携しています。

## Database Schema

### Tables
1. **groups** - 旅行グループ
2. **itineraries** - 旅行予定表
3. **activities** - アクティビティ
4. **budgets** - 予算・支出

### Relationships
- groups → itineraries (1:N)
- itineraries → activities (1:N)
- itineraries → budgets (1:N)
- activities → budgets (1:N, optional)

## Local Development Setup

### Prerequisites
- Docker & Docker Compose
- Hasura CLI

### 1. Start Services
```bash
# Start PostgreSQL and Hasura
docker-compose up -d postgres graphql-engine data-connector-agent

# Verify services are running
docker-compose ps
```

### 2. Apply Migrations
```bash
cd hasura-project
hasura migrate apply --endpoint http://localhost:8080 --admin-secret travelplanner9032
```

### 3. Apply Metadata
```bash
hasura metadata apply --endpoint http://localhost:8080 --admin-secret travelplanner9032
```

### 4. Access Hasura Console
```bash
# Option 1: Via CLI (recommended for development)
hasura console --endpoint http://localhost:8080 --admin-secret travelplanner9032

# Option 2: Direct browser access
open http://localhost:8080/console
```

## Production Setup

### Environment Variables
Production環境では以下の環境変数を設定してください：

```bash
DATABASE_URL="postgresql://username:password@host:port/database"
NEXT_PUBLIC_HASURA_GRAPHQL_ENDPOINT="https://your-hasura-endpoint/v1/graphql"
NEXT_PUBLIC_HASURA_GRAPHQL_ADMIN_SECRET="your-admin-secret"
```

### Hasura Cloud Setup
1. Hasura Cloudでプロジェクトを作成
2. PostgreSQLデータベースを接続
3. マイグレーションとメタデータを適用

```bash
# Production endpoint example
hasura migrate apply --endpoint https://your-hasura-app.hasura.app --admin-secret your-admin-secret
hasura metadata apply --endpoint https://your-hasura-app.hasura.app --admin-secret your-admin-secret
```

## Common Commands

### Create New Migration
```bash
cd hasura-project
hasura migrate create "migration_name" --from-server --endpoint http://localhost:8080 --admin-secret travelplanner9032
```

### Rollback Migration
```bash
hasura migrate apply --version [VERSION] --type down --endpoint http://localhost:8080 --admin-secret travelplanner9032
```

### Export Metadata
```bash
hasura metadata export --endpoint http://localhost:8080 --admin-secret travelplanner9032
```

### Check Migration Status
```bash
hasura migrate status --endpoint http://localhost:8080 --admin-secret travelplanner9032
```

## Troubleshooting

### Reset Database
```bash
# Stop all services
docker-compose down

# Remove volumes to reset database
docker-compose down --volumes

# Start fresh
docker-compose up -d postgres graphql-engine data-connector-agent

# Re-apply migrations
cd hasura-project
hasura migrate apply --endpoint http://localhost:8080 --admin-secret travelplanner9032
```

### Check Service Logs
```bash
# Hasura logs
docker-compose logs graphql-engine

# PostgreSQL logs
docker-compose logs postgres
```

## Database Schema Details

### Groups Table
```sql
CREATE TABLE groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Itineraries Table
```sql
CREATE TABLE itineraries (
    id SERIAL PRIMARY KEY,
    group_id UUID,
    title VARCHAR(255),
    destination VARCHAR(255),
    start_date DATE,
    end_date DATE,
    travel_purpose TEXT,
    location_type VARCHAR(100),
    created_by VARCHAR(255),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE SET NULL
);
```

### Activities Table
```sql
CREATE TABLE activities (
    id SERIAL PRIMARY KEY,
    itinerary_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    location TEXT,
    notes TEXT,
    type VARCHAR(100),
    date DATE,
    time TIME,
    photo_url TEXT,
    lat NUMERIC,
    lng NUMERIC,
    place_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (itinerary_id) REFERENCES itineraries(id) ON DELETE CASCADE
);
```

### Budgets Table
```sql
CREATE TABLE budgets (
    id SERIAL PRIMARY KEY,
    itinerary_id INTEGER NOT NULL,
    activity_id INTEGER,
    date DATE NOT NULL,
    category VARCHAR(100) NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    description TEXT,
    currency VARCHAR(3) DEFAULT 'JPY',
    paid_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (itinerary_id) REFERENCES itineraries(id) ON DELETE CASCADE,
    FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE SET NULL
);
```