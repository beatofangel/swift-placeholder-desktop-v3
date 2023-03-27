import sqlite3 from '@vscode/sqlite3'
import { Sequelize, DataTypes, QueryTypes, Op, Options, Model, InferCreationAttributes, InferAttributes, CreationOptional, ForeignKey, BelongsToManyAddAssociationsMixin, BelongsToManyGetAssociationsMixin } from 'sequelize'
import cls from 'cls-hooked'
import Transaction from 'sequelize/types/transaction'
const namespace = cls.createNamespace('swift-placeholder-namespace')
Sequelize.useCLS(namespace)

// TODO upsert方法暂时有bug，修正已合并到7.0.0-alpha.16（https://github.com/sequelize/sequelize/pull/14853），等待正式版发布
const options: Options = {
  dialectModule: sqlite3, // https://github.com/sequelize/sequelize/issues/11677#issuecomment-553790367
  dialect: 'sqlite',
  storage: 'database/userdata.db',
  logging: console.log,
}
const sequelize = new Sequelize(options)

// try {
//   await sequelize.authenticate()
//   console.log('Connection has been established successfully.');
// } catch (error) {
//   console.error('Unable to connect to the database:', error)
//   throw error
// }

/**
 * 业务分类Model
 */
class BusinessCategoryModel extends Model<InferAttributes<BusinessCategoryModel>, InferCreationAttributes<BusinessCategoryModel>> {
  declare id: CreationOptional<string>
  declare pid: ForeignKey<BusinessCategoryModel['id']>
  declare name: string
  declare icon: string | null
  declare ordinal: CreationOptional<number>
  declare addTemplates: BelongsToManyAddAssociationsMixin<TemplateModel, string>
}
BusinessCategoryModel.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.TEXT,
      unique: true,
      allowNull: false
    },
    icon: {
      type: DataTypes.TEXT
    },
    ordinal: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
  },{
    sequelize,
    tableName: 'BusinessCategories',
    hooks: {
      // INSERT: 实现序号自增
      beforeCreate: async (instance, options) => {
        console.log('beforeCreate', options)
        const cnt = await BusinessCategoryModel.count({
          where: {
            pid: instance.pid
          }
        })
        instance.ordinal = cnt + 1
        console.log(instance)
      },
      afterDestroy: async (instance, options) => {
        // TODO 是否要实现自动序号递减？？
        console.log('afterDestroy', options)
      }
    }
  }
)

/**
 * 模板Model
 */
class TemplateModel extends Model<InferAttributes<TemplateModel>, InferCreationAttributes<TemplateModel>> {
  declare id: CreationOptional<string>
  declare name: string
  declare path: string
  declare addPlaceholderGroups: 
    BelongsToManyAddAssociationsMixin<PlaceholderGroupModel, string>
}
TemplateModel.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.TEXT,
      unique: true,
      allowNull: false
    },
    path: {
      type: DataTypes.TEXT,
      allowNull: false
    },
  },{
    sequelize,
    tableName: 'Templates',
  }
)

/**
 * 占位符分组Model
 */
class PlaceholderGroupModel extends Model<InferAttributes<PlaceholderGroupModel>, InferCreationAttributes<PlaceholderGroupModel>> {
  declare id: CreationOptional<string>
  declare name: string
  declare getPlaceholderItems: BelongsToManyGetAssociationsMixin<PlaceholderItemModel>
  declare addPlaceholderItems: 
    BelongsToManyAddAssociationsMixin<PlaceholderItemModel, string>
}
PlaceholderGroupModel.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.TEXT,
      unique: true,
      allowNull: false
    },
  },{
    sequelize,
    tableName: 'PlaceholderGroups',
  }
)

/**
 * 占位符项目Model
 */
class PlaceholderItemModel extends Model<InferAttributes<PlaceholderItemModel>, InferCreationAttributes<PlaceholderItemModel>> {
  declare id: CreationOptional<string>
  declare name: string
  declare type: string
  declare format: string | null
  declare getPlaceholderGroups: BelongsToManyGetAssociationsMixin<PlaceholderGroupModel>
}
PlaceholderItemModel.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.TEXT,
      unique: true,
      allowNull: false
    },
    type: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    format: {
      type: DataTypes.TEXT
    },
  }, {
    sequelize,
    tableName: 'PlaceholderItems',
  }
)

/**
 * 分类与模板关系Model
 */
class BcTplRelModel extends Model<InferAttributes<BcTplRelModel>, InferCreationAttributes<BcTplRelModel>> {
  declare bcId: ForeignKey<BusinessCategoryModel['id']>
  declare tplId: ForeignKey<TemplateModel['id']>
  declare ordinal: CreationOptional<number>
}
BcTplRelModel.init(
  {
    ordinal: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
  }, {
    sequelize,
    tableName: 'BcTplRels',
    hooks: {
      // INSERT: 实现序号自增
      beforeBulkCreate: async (instances, options) => {
        console.log('beforeBulkCreate', options)
        for (const instance of instances) {
          const cnt = await BcTplRelModel.count({
            where: {
              bcId: instance.bcId
            }
          })
          instance.ordinal = cnt + 1
          console.log(instance)
        }
      },
      afterBulkDestroy: async (options) => {
        console.log('afterBulkDestroy', options)
      }
    }
  }
)

/**
 * 模板与占位符分组关系Model
 */
class TplPhGrpRelModel extends Model<InferAttributes<TplPhGrpRelModel>, InferCreationAttributes<TplPhGrpRelModel>> {
  declare tplId: ForeignKey<TemplateModel['id']>
  declare phGrpId: ForeignKey<PlaceholderGroupModel['id']>
  declare ordinal: CreationOptional<number>
}
TplPhGrpRelModel.init(
  {
    ordinal: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
  }, {
    sequelize,
    tableName: 'TplPhGrpRels',
    hooks: {
      // INSERT: 实现序号自增
      beforeBulkCreate: async (instances, options) => {
        console.log('beforeBulkCreate', options)
        for (const instance of instances) {
          const cnt = await TplPhGrpRelModel.count({
            where: {
              tplId: instance.tplId
            }
          })
          instance.ordinal = cnt + 1
          console.log(instance)
        }
      },
      afterBulkDestroy: async (options) => {
        console.log('afterBulkDestroy', options)
      }
    }
  }
)

/**
 * 占位符分组与项目关系Model
 */
class PhGrpItmRelModel extends Model<InferAttributes<PhGrpItmRelModel>, InferCreationAttributes<PhGrpItmRelModel>> {
  declare phGrpId: ForeignKey<PlaceholderGroupModel['id']>
  declare phItmId: ForeignKey<PlaceholderItemModel['id']>
  declare ordinal: CreationOptional<number>
}
PhGrpItmRelModel.init(
  {
    ordinal: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
  }, {
    sequelize,
    tableName: 'PhGrpItmRels',
    hooks: {
      // INSERT: 实现序号自增
      beforeBulkCreate: async (instances, options) => {
        console.log('beforeBulkCreate', options)
        for (const instance of instances) {
          const cnt = await PhGrpItmRelModel.count({
            where: {
              phGrpId: instance.phGrpId
            }
          })
          instance.ordinal = cnt + 1
          console.log(instance)
        }
      },
      afterBulkDestroy: async (options) => {
        console.log('afterBulkDestroy', options)
      }
    }
  }
)

class SettingModel extends Model<InferAttributes<SettingModel>, InferCreationAttributes<SettingModel>> {
  declare id: CreationOptional<string>
  declare name: string
  declare description: string | null
  declare type: string
  declare value: string | null
}
SettingModel.init(
  {
    id: {
      type: DataTypes.TEXT,
      primaryKey: true
    },
    name: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
    },
    type: {
      type: DataTypes.TEXT,
      defaultValue: 'BOOL',
      allowNull: false
    },
    value: {
      type: DataTypes.TEXT,
    }
  }, {
    sequelize,
    tableName: 'Settings'
  }
)

class SessionModel extends Model<InferAttributes<SessionModel>, InferCreationAttributes<SessionModel>> {
  declare id: CreationOptional<string>
  declare type: string
  declare status: string
  declare data: string
}
SessionModel.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    type: {
      type: DataTypes.TEXT,
      defaultValue: 'replace',
      allowNull: false
    },
    status: {
      type: DataTypes.TEXT,
      defaultValue: 'processing',
      allowNull: false
    },
    data: {
      type: DataTypes.BLOB
    }
  }, {
    sequelize,
    tableName: 'Sessions'
  }
)

BusinessCategoryModel.hasMany(BusinessCategoryModel, {
  as: 'children',
  foreignKey: 'pid',
  onDelete: 'CASCADE'
})

BusinessCategoryModel.belongsToMany(TemplateModel, {
  through: BcTplRelModel,
  foreignKey: 'bcId',
})

TemplateModel.belongsToMany(BusinessCategoryModel, {
  through: BcTplRelModel,
  foreignKey: 'tplId',
})

TemplateModel.belongsToMany(PlaceholderGroupModel, {
  through: TplPhGrpRelModel,
  foreignKey: 'tplId',
})

PlaceholderGroupModel.belongsToMany(TemplateModel, {
  through: TplPhGrpRelModel,
  foreignKey: 'phGrpId',
})

PlaceholderGroupModel.belongsToMany(PlaceholderItemModel, {
  through: PhGrpItmRelModel,
  foreignKey: 'phGrpId',
})

PlaceholderItemModel.belongsToMany(PlaceholderGroupModel, {
  through: PhGrpItmRelModel,
  foreignKey: 'phItmId',
})

// const isDevelopment = process.env.NODE_ENV !== 'production'
// isDevelopment && sequelize.sync({ alter: true });

// const Models = {
//   BusinessCategoryModel,
//   TemplateModel,
//   PlaceholderItemModel,
//   PlaceholderGroupModel,
//   BcTplRelModel,
//   TplPhGrpRelModel,
//   PhGrpItmRelModel,
//   SettingModel,
//   SessionModel
// }

// TODO 所有service请求都要修改
export async function beginTx(callback: (t: Transaction) => PromiseLike<unknown>) {
  return await sequelize.transaction(callback)
}

// export function getModel(modelName: string) {
//   const model = Models[`${modelName}Model`]
//   if (!model) throw `Model with name ${modelName} not found.`
//   return model
// }

export {
  sequelize,
  QueryTypes,
  DataTypes,
  Op,
  BusinessCategoryModel,
  TemplateModel,
  PlaceholderItemModel,
  PlaceholderGroupModel,
  BcTplRelModel,
  TplPhGrpRelModel,
  PhGrpItmRelModel,
  SettingModel,
  SessionModel
}
