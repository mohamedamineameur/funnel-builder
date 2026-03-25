import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  literal,
} from "sequelize";
import { getSequelize } from "@/lib/sequelize";

export class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
  declare id: CreationOptional<string>;
  declare username: string;
  declare passwordHash: string;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

export class Project extends Model<InferAttributes<Project>, InferCreationAttributes<Project>> {
  declare id: CreationOptional<string>;
  declare name: string;
  declare userId: string;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

export class Page extends Model<InferAttributes<Page>, InferCreationAttributes<Page>> {
  declare id: CreationOptional<string>;
  declare projectId: string;
  declare isEffective: CreationOptional<boolean>;
  declare payload: unknown;
  declare createdAt: CreationOptional<Date>;
}

type DbModels = {
  User: typeof User;
  Project: typeof Project;
  Page: typeof Page;
};

const globalForModels = globalThis as typeof globalThis & {
  __dbModels__?: DbModels;
  __dbSyncPromise__?: Promise<DbModels> | null;
};

function initializeModels() {
  if (globalForModels.__dbModels__) {
    return globalForModels.__dbModels__;
  }

  const sequelize = getSequelize();

  User.init(
    {
      id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: literal("gen_random_uuid()"),
      },
      username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          len: [3, 255],
        },
      },
      passwordHash: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "password_hash",
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: literal("NOW()"),
        field: "created_at",
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: literal("NOW()"),
        field: "updated_at",
      },
    },
    {
      sequelize,
      modelName: "User",
      tableName: "users",
      timestamps: true,
      underscored: true,
    },
  );

  Project.init(
    {
      id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: literal("gen_random_uuid()"),
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "user_id",
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: literal("NOW()"),
        field: "created_at",
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: literal("NOW()"),
        field: "updated_at",
      },
    },
    {
      sequelize,
      modelName: "Project",
      tableName: "projects",
      timestamps: true,
      underscored: true,
    },
  );

  Page.init(
    {
      id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: literal("gen_random_uuid()"),
      },
      projectId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "project_id",
      },
      isEffective: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: "is_effective",
      },
      payload: {
        type: DataTypes.JSONB,
        allowNull: false,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: literal("NOW()"),
        field: "created_at",
      },
    },
    {
      sequelize,
      modelName: "Page",
      tableName: "pages",
      timestamps: false,
    },
  );

  User.hasMany(Project, {
    foreignKey: "userId",
    as: "projects",
  });
  Project.belongsTo(User, {
    foreignKey: "userId",
    as: "user",
  });
  Project.hasMany(Page, {
    foreignKey: "projectId",
    as: "pages",
  });
  Page.belongsTo(Project, {
    foreignKey: "projectId",
    as: "project",
  });

  globalForModels.__dbModels__ = {
    User,
    Project,
    Page,
  };

  return globalForModels.__dbModels__;
}

export function getModels() {
  return initializeModels();
}

export async function syncDatabase() {
  const models = getModels();

  if (!globalForModels.__dbSyncPromise__) {
    globalForModels.__dbSyncPromise__ = (async () => {
      const sequelize = getSequelize();

      await sequelize.query("CREATE EXTENSION IF NOT EXISTS pgcrypto");
      await sequelize.sync();
      await sequelize.query(`
        ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
        ALTER TABLE projects FORCE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS projects_select_own ON projects;
        DROP POLICY IF EXISTS projects_insert_own ON projects;
        DROP POLICY IF EXISTS projects_update_own ON projects;
        DROP POLICY IF EXISTS projects_delete_own ON projects;
        CREATE POLICY projects_select_own
          ON projects
          FOR SELECT
          USING (user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid);
        CREATE POLICY projects_insert_own
          ON projects
          FOR INSERT
          WITH CHECK (user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid);
        CREATE POLICY projects_update_own
          ON projects
          FOR UPDATE
          USING (user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid)
          WITH CHECK (user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid);
        CREATE POLICY projects_delete_own
          ON projects
          FOR DELETE
          USING (user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid);
      `);
      await sequelize.query(`
        ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
        ALTER TABLE pages FORCE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS pages_select_own ON pages;
        DROP POLICY IF EXISTS pages_insert_own ON pages;
        DROP POLICY IF EXISTS pages_update_own ON pages;
        DROP POLICY IF EXISTS pages_delete_own ON pages;
        CREATE POLICY pages_select_own
          ON pages
          FOR SELECT
          USING (
            EXISTS (
              SELECT 1
              FROM projects
              WHERE projects.id = pages.project_id
                AND projects.user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
            )
          );
        CREATE POLICY pages_insert_own
          ON pages
          FOR INSERT
          WITH CHECK (
            EXISTS (
              SELECT 1
              FROM projects
              WHERE projects.id = pages.project_id
                AND projects.user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
            )
          );
        CREATE POLICY pages_update_own
          ON pages
          FOR UPDATE
          USING (
            EXISTS (
              SELECT 1
              FROM projects
              WHERE projects.id = pages.project_id
                AND projects.user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
            )
          )
          WITH CHECK (
            EXISTS (
              SELECT 1
              FROM projects
              WHERE projects.id = pages.project_id
                AND projects.user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
            )
          );
        CREATE POLICY pages_delete_own
          ON pages
          FOR DELETE
          USING (
            EXISTS (
              SELECT 1
              FROM projects
              WHERE projects.id = pages.project_id
                AND projects.user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
            )
          );
      `);

      return models;
    })().catch((error) => {
      globalForModels.__dbSyncPromise__ = null;
      throw error;
    });
  }

  return globalForModels.__dbSyncPromise__;
}
